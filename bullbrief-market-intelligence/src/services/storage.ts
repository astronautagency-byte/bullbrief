import type { User, Asset, Invoice } from '../types';
import { INITIAL_WATCHLIST, INITIAL_INVOICES } from '../components/mockData';

const KEYS = {
  user: 'bullbrief_user',
  watchlist: 'bullbrief_watchlist',
  invoices: 'bullbrief_invoices',
};

function accountKey(base: string, email?: string): string {
  return email ? `${base}:${encodeURIComponent(email.trim().toLowerCase())}` : base;
}

export function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.user);
  }
}

export function loadWatchlist(email?: string): Asset[] {
  try {
    const raw = localStorage.getItem(accountKey(KEYS.watchlist, email));
    return raw ? JSON.parse(raw) : INITIAL_WATCHLIST;
  } catch {
    return INITIAL_WATCHLIST;
  }
}

export function saveWatchlist(watchlist: Asset[], email?: string) {
  localStorage.setItem(accountKey(KEYS.watchlist, email), JSON.stringify(watchlist));
}

export function loadInvoices(email?: string): Invoice[] {
  try {
    const raw = localStorage.getItem(accountKey(KEYS.invoices, email));
    return raw ? JSON.parse(raw) : INITIAL_INVOICES;
  } catch {
    return INITIAL_INVOICES;
  }
}

export function saveInvoices(invoices: Invoice[], email?: string) {
  localStorage.setItem(accountKey(KEYS.invoices, email), JSON.stringify(invoices));
}

export function shouldMigrateLocalData(email: string): boolean {
  return localStorage.getItem(`bullbrief_account_migrated:${encodeURIComponent(email.trim().toLowerCase())}`) !== '1';
}

export function markLocalDataMigrated(email: string): void {
  localStorage.setItem(`bullbrief_account_migrated:${encodeURIComponent(email.trim().toLowerCase())}`, '1');
}
