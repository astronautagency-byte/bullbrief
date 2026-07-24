import type { User, Asset, Invoice } from '../types';
import { INITIAL_WATCHLIST, INITIAL_INVOICES } from '../components/mockData';

const KEYS = {
  user: 'bullbrief_user',
  watchlist: 'bullbrief_watchlist',
  invoices: 'bullbrief_invoices',
};

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

export function loadWatchlist(): Asset[] {
  try {
    const raw = localStorage.getItem(KEYS.watchlist);
    return raw ? JSON.parse(raw) : INITIAL_WATCHLIST;
  } catch {
    return INITIAL_WATCHLIST;
  }
}

export function saveWatchlist(watchlist: Asset[]) {
  localStorage.setItem(KEYS.watchlist, JSON.stringify(watchlist));
}

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(KEYS.invoices);
    return raw ? JSON.parse(raw) : INITIAL_INVOICES;
  } catch {
    return INITIAL_INVOICES;
  }
}

export function saveInvoices(invoices: Invoice[]) {
  localStorage.setItem(KEYS.invoices, JSON.stringify(invoices));
}
