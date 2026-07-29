import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Asset, Invoice, User } from '../../src/types.js';

export interface AccountState {
  user: User;
  watchlist: Asset[];
  invoices: Invoice[];
  updatedAt: string;
}

interface AccountDatabase {
  accounts: Record<string, AccountState>;
}

const dataDirectory = process.env.BULLBRIEF_DATA_DIR || path.resolve(process.cwd(), '.data');
const databasePath = path.join(dataDirectory, 'accounts.json');
const sessions = new Map<string, string>();
let writeQueue = Promise.resolve();

function accountIdForEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

async function readDatabase(): Promise<AccountDatabase> {
  try {
    return JSON.parse(await readFile(databasePath, 'utf8')) as AccountDatabase;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { accounts: {} };
    throw error;
  }
}

async function updateDatabase<T>(update: (database: AccountDatabase) => T | Promise<T>): Promise<T> {
  let result!: T;
  writeQueue = writeQueue.then(async () => {
    const database = await readDatabase();
    result = await update(database);
    await mkdir(dataDirectory, { recursive: true });
    const temporaryPath = `${databasePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(database, null, 2), { mode: 0o600 });
    await rename(temporaryPath, databasePath);
  });
  await writeQueue;
  return result;
}

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const identity = key(value);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export async function startAccountSession(
  profile: User,
  legacy?: { watchlist?: Asset[]; invoices?: Invoice[] }
): Promise<{ token: string; state: AccountState }> {
  const accountId = accountIdForEmail(profile.email);
  const state = await updateDatabase((database) => {
    const existing = database.accounts[accountId];
    const now = new Date().toISOString();
    const next: AccountState = existing
      ? {
          ...existing,
          user: { ...existing.user, name: profile.name || existing.user.name, isPro: existing.user.isPro || profile.isPro },
          watchlist: uniqueBy([...(existing.watchlist || []), ...(legacy?.watchlist || [])], (asset) => asset.symbol),
          invoices: uniqueBy([...(existing.invoices || []), ...(legacy?.invoices || [])], (invoice) => invoice.id),
          updatedAt: now,
        }
      : {
          user: profile,
          watchlist: uniqueBy(legacy?.watchlist || [], (asset) => asset.symbol),
          invoices: uniqueBy(legacy?.invoices || [], (invoice) => invoice.id),
          updatedAt: now,
        };
    database.accounts[accountId] = next;
    return next;
  });

  const token = randomUUID();
  sessions.set(token, accountId);
  return { token, state };
}

export function endAccountSession(token?: string): void {
  if (token) sessions.delete(token);
}

export async function getAccountState(token?: string): Promise<AccountState | null> {
  const accountId = token ? sessions.get(token) : undefined;
  if (!accountId) return null;
  return (await readDatabase()).accounts[accountId] || null;
}

export async function updateAccount(
  token: string | undefined,
  update: (state: AccountState) => AccountState
): Promise<AccountState | null> {
  const accountId = token ? sessions.get(token) : undefined;
  if (!accountId) return null;
  return updateDatabase((database) => {
    const current = database.accounts[accountId];
    if (!current) return null;
    const next = { ...update(current), updatedAt: new Date().toISOString() };
    database.accounts[accountId] = next;
    return next;
  });
}

export async function deleteAccount(token?: string): Promise<boolean> {
  const accountId = token ? sessions.get(token) : undefined;
  if (!accountId) return false;
  const deleted = await updateDatabase((database) => {
    if (!database.accounts[accountId]) return false;
    delete database.accounts[accountId];
    return true;
  });
  endAccountSession(token);
  return deleted;
}
