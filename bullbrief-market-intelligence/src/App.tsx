import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageId, User, Asset, Invoice } from './types';
import { BRIEFING_ITEMS, PODCAST_EPISODES } from './components/mockData';
import { useLiveQuotes } from './hooks/useLiveQuotes';
import { useMarketNews } from './hooks/useMarketNews';
import { loadUser, saveUser, loadWatchlist, saveWatchlist, loadInvoices, saveInvoices } from './services/storage';
import { api } from './services/api';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PulseDashboard from './components/PulseDashboard';
import QuickPulseDashboard from './components/QuickPulseDashboard';
import PodcastHub from './components/PodcastHub';
import WatchlistPanel from './components/WatchlistPanel';
import ProPricing from './components/ProPricing';
import AccountBilling from './components/AccountBilling';
import AuthScreens from './components/AuthScreens';
import { TrendingUp, Newspaper, Eye, Award, User as UserIcon, Activity } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('pulse');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [user, setUser] = useState<User | null>(() => loadUser());
  const [watchlist, setWatchlist] = useState<Asset[]>(() => loadWatchlist());
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [briefings, setBriefings] = useState(BRIEFING_ITEMS);

  const { news } = useMarketNews();
  const symbols = useMemo(() => watchlist.map((a) => a.symbol), [watchlist]);
  const { quotes: liveQuotes } = useLiveQuotes(symbols, 60000);

  const mergedWatchlist = useMemo(() => {
    if (liveQuotes.length === 0) return watchlist;
    const quoteMap = new Map(liveQuotes.map((q) => [q.symbol, q]));
    return watchlist.map((asset) => quoteMap.get(asset.symbol) ?? asset);
  }, [watchlist, liveQuotes]);

  useEffect(() => {
    saveUser(user);
  }, [user]);

  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    async function loadBriefing() {
      try {
        const tickers = await api.getTickers();
        const context = tickers.map((t) => `${t.label}: ${t.price} (${t.changePercent}%)`).join(', ');
        const briefing = await api.getDailyBriefing(context);
        setBriefings(
          briefing.highlights.map((h, i) => ({
            id: `brief-${i}`,
            title: h.title,
            text: h.text,
            time: 'Today',
            impact: h.impact,
          }))
        );
      } catch {
        // Keep default briefings on failure
      }
    }
    loadBriefing();
  }, []);

  const handleUpgradeSuccess = () => {
    if (user) {
      setUser({ ...user, isPro: true });
      const newInvoice: Invoice = {
        id: `INV-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: 99.0,
        status: 'PAID',
      };
      setInvoices([newInvoice, ...invoices]);
    }
  };

  const handleUpdateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated } as User);
    }
  };

  const handleAuthSuccess = (authUser: User) => {
    setUser(authUser);
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage('login');
  };

  const handleAddToWatchlist = useCallback(async (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (watchlist.some((a) => a.symbol === upper)) return;

    try {
      const quote = await api.getQuote(upper);
      setWatchlist((prev) => [...prev, quote]);
    } catch {
      const fallback: Asset = {
        symbol: upper,
        name: `${upper} Spot Asset`,
        price: 100.0,
        dayChangePercent: 0,
        dayChangeAmount: 0,
        marketCap: '—',
        volume24h: '—',
      };
      setWatchlist((prev) => [...prev, fallback]);
    }
  }, [watchlist]);

  const handleAddToWatchlistObj = (asset: Asset) => {
    if (watchlist.some((a) => a.symbol === asset.symbol)) {
      alert(`${asset.symbol} is already in your watchlist.`);
      return;
    }
    setWatchlist((prev) => [...prev, asset]);
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlist((prev) => prev.filter((a) => a.symbol !== symbol));
  };

  const navigateMobile = (page: PageId) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'pulse':
        return (
          <PulseDashboard
            news={news}
            briefings={briefings}
            watchlist={mergedWatchlist}
            user={user}
            searchQuery={searchQuery}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            setActivePage={setActivePage}
          />
        );
      case 'quick-pulse':
        return <QuickPulseDashboard watchlist={mergedWatchlist} searchQuery={searchQuery} />;
      case 'news':
        return <PodcastHub episodes={PODCAST_EPISODES} />;
      case 'watchlist':
        return (
          <WatchlistPanel
            watchlist={mergedWatchlist}
            onAddAsset={handleAddToWatchlistObj}
            onRemoveAsset={handleRemoveFromWatchlist}
            onLookupSymbol={handleAddToWatchlist}
          />
        );
      case 'pro':
        return (
          <ProPricing
            user={user}
            onUpgradeSuccess={handleUpgradeSuccess}
            setActivePage={setActivePage}
            onLoginRedirect={() => setActivePage('login')}
          />
        );
      case 'account':
      case 'billing':
        return user ? (
          <AccountBilling user={user} onUpdateUser={handleUpdateUser} invoices={invoices} />
        ) : (
          <AuthScreens mode="login" onAuthSuccess={handleAuthSuccess} setActivePage={setActivePage} />
        );
      case 'login':
        return <AuthScreens mode="login" onAuthSuccess={handleAuthSuccess} setActivePage={setActivePage} />;
      case 'register':
        return <AuthScreens mode="register" onAuthSuccess={handleAuthSuccess} setActivePage={setActivePage} />;
      default:
        return (
          <div className="p-xl text-center">
            <h3 className="font-headline font-extrabold text-xl">404 - Grid Node Missing</h3>
            <button onClick={() => setActivePage('pulse')} className="text-primary mt-sm font-semibold">
              Reset Terminal
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header
        user={user}
        setActivePage={setActivePage}
        onLoginClick={() => setActivePage('login')}
        onSearch={setSearchQuery}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex flex-1 relative">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          user={user}
          onLogout={handleLogout}
          onLoginClick={() => setActivePage('login')}
        />

        {mobileMenuOpen && (
          <div className="absolute inset-x-0 top-0 bg-surface border-b border-outline-variant p-lg flex flex-col gap-sm z-40 md:hidden animate-scale-up select-none">
            <p className="font-mono text-[10px] text-tertiary font-bold tracking-widest border-b border-outline-variant pb-xs uppercase">
              GRID TERMINAL INDEX
            </p>

            <button
              onClick={() => navigateMobile('pulse')}
              className={`flex items-center gap-sm p-sm rounded-xl font-headline font-bold text-xs ${
                activePage === 'pulse' ? 'text-primary bg-primary/5' : 'text-secondary'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>PULSE NEWSROOM</span>
            </button>

            <button
              onClick={() => navigateMobile('quick-pulse')}
              className={`flex items-center gap-sm p-sm rounded-xl font-headline font-bold text-xs ${
                activePage === 'quick-pulse' ? 'text-primary bg-primary/5' : 'text-secondary'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>QUICK PULSE</span>
            </button>

            <button
              onClick={() => navigateMobile('news')}
              className={`flex items-center gap-sm p-sm rounded-xl font-headline font-bold text-xs ${
                activePage === 'news' ? 'text-primary bg-primary/5' : 'text-secondary'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>PODCAST LIBRARY</span>
            </button>

            <button
              onClick={() => navigateMobile('watchlist')}
              className={`flex items-center gap-sm p-sm rounded-xl font-headline font-bold text-xs ${
                activePage === 'watchlist' ? 'text-primary bg-primary/5' : 'text-secondary'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>MY WATCHLIST</span>
            </button>

            <button
              onClick={() => navigateMobile('pro')}
              className={`flex items-center gap-sm p-sm rounded-xl font-headline font-bold text-xs ${
                activePage === 'pro' ? 'text-primary bg-primary/5' : 'text-secondary'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>PRO ANALYSIS</span>
            </button>

            <button
              onClick={() => navigateMobile(user ? 'account' : 'login')}
              className={`flex items-center gap-sm p-sm rounded-xl font-headline font-bold text-xs ${
                activePage === 'account' ? 'text-primary bg-primary/5' : 'text-secondary'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>{user ? 'ACCOUNT SETTINGS' : 'SIGN IN'}</span>
            </button>

            {user && (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-sm p-sm text-error font-headline font-bold text-xs uppercase"
              >
                <span>Terminate Session</span>
              </button>
            )}
          </div>
        )}

        <main className="flex-1 p-md md:p-xl max-w-full overflow-hidden">
          {renderPage()}
        </main>
      </div>

      <footer className="py-md border-t border-outline-variant bg-surface-container-low text-center font-mono text-[9px] text-tertiary select-none">
        BULLBRIEF MARKET INTELLIGENCE TERMINAL V2.4.0 • COGNITIVE ANALYSIS DECK ACTIVE • © 2026 BULLBRIEF CORP
      </footer>
    </div>
  );
}
