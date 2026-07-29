import { Router } from 'express';
import type { Asset, Invoice, User } from '../../src/types.js';
import {
  endAccountSession,
  deleteAccount,
  getAccountState,
  startAccountSession,
  updateAccount,
} from '../services/accountStore.js';

const router = Router();
const COOKIE_NAME = 'bullbrief_session';

function sessionToken(cookieHeader?: string): string | undefined {
  return cookieHeader
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === COOKIE_NAME)?.[1];
}

function unauthorized(res: Parameters<Parameters<typeof router.get>[1]>[1]) {
  res.status(401).json({ error: 'Authentication required' });
}

router.post('/session', async (req, res, next) => {
  try {
    const user = req.body?.user as User | undefined;
    if (!user?.email || !user?.name) {
      res.status(400).json({ error: 'A valid user profile is required' });
      return;
    }
    const { token, state } = await startAccountSession(user, req.body?.legacy);
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`
    );
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.delete('/session', (req, res) => {
  endAccountSession(sessionToken(req.headers.cookie));
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.status(204).end();
});

router.get('/state', async (req, res, next) => {
  try {
    const state = await getAccountState(sessionToken(req.headers.cookie));
    if (!state) return unauthorized(res);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    const state = await getAccountState(sessionToken(req.headers.cookie));
    if (!state) return unauthorized(res);
    res.setHeader('Content-Disposition', 'attachment; filename="bullbrief-account-export.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      notice: 'Account-data copy for personal records. Market data and AI-generated content are informational, may be delayed, and are not investment advice.',
      account: state,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const profile = req.body as Partial<User>;
    const state = await updateAccount(sessionToken(req.headers.cookie), (current) => ({
      ...current,
      user: { ...current.user, ...profile, email: current.user.email },
    }));
    if (!state) return unauthorized(res);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.post('/watchlist', async (req, res, next) => {
  try {
    const asset = req.body as Asset;
    if (!asset?.symbol) {
      res.status(400).json({ error: 'A valid asset is required' });
      return;
    }
    const state = await updateAccount(sessionToken(req.headers.cookie), (current) => ({
      ...current,
      watchlist: current.watchlist.some((item) => item.symbol === asset.symbol)
        ? current.watchlist.map((item) => item.symbol === asset.symbol ? asset : item)
        : [...current.watchlist, asset],
    }));
    if (!state) return unauthorized(res);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.delete('/watchlist/:symbol', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const state = await updateAccount(sessionToken(req.headers.cookie), (current) => ({
      ...current,
      watchlist: current.watchlist.filter((asset) => asset.symbol.toUpperCase() !== symbol),
    }));
    if (!state) return unauthorized(res);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.put('/invoices', async (req, res, next) => {
  try {
    const invoices = req.body as Invoice[];
    if (!Array.isArray(invoices)) {
      res.status(400).json({ error: 'Invoices must be an array' });
      return;
    }
    const state = await updateAccount(sessionToken(req.headers.cookie), (current) => ({ ...current, invoices }));
    if (!state) return unauthorized(res);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    const token = sessionToken(req.headers.cookie);
    if (!await deleteAccount(token)) return unauthorized(res);
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
