import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { Asset, User } from '../../src/types.js';

test('account state migrates once and synchronizes across sessions', async () => {
  const dataDirectory = await mkdtemp(path.join(os.tmpdir(), 'bullbrief-account-test-'));
  process.env.BULLBRIEF_DATA_DIR = dataDirectory;
  const store = await import('./accountStore.js');
  const user: User = {
    name: 'Sync Tester',
    email: 'sync@example.com',
    isPro: false,
    joinedDate: 'Jul 29, 2026',
  };
  const apple: Asset = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 100,
    dayChangePercent: 0,
    dayChangeAmount: 0,
    marketCap: '—',
    volume24h: '—',
  };
  const enbridge: Asset = {
    symbol: 'ENB.TO',
    name: 'ENBRIDGE INC',
    exchange: 'Toronto',
    currency: 'CAD',
    price: 70,
    dayChangePercent: 0,
    dayChangeAmount: 0,
    marketCap: '—',
    volume24h: '—',
    dataStatus: 'Delayed',
  };

  try {
    const deviceA = await store.startAccountSession(user, { watchlist: [apple], invoices: [] });
    await store.updateAccount(deviceA.token, (state) => ({ ...state, watchlist: [...state.watchlist, enbridge] }));

    const deviceB = await store.startAccountSession(user);
    assert.deepEqual(deviceB.state.watchlist.map((asset) => asset.symbol), ['AAPL', 'ENB.TO']);

    await store.updateAccount(deviceB.token, (state) => ({
      ...state,
      watchlist: state.watchlist.filter((asset) => asset.symbol !== 'AAPL'),
    }));
    const refreshedA = await store.getAccountState(deviceA.token);
    assert.deepEqual(refreshedA?.watchlist.map((asset) => asset.symbol), ['ENB.TO']);
    assert.equal(await store.deleteAccount(deviceB.token), true);
    assert.equal(await store.getAccountState(deviceA.token), null);
  } finally {
    await rm(dataDirectory, { recursive: true, force: true });
  }
});
