import React from 'react';
import { PageId, User } from '../types';
import {
  TrendingUp,
  Activity,
  Newspaper,
  Eye,
  Award,
  User as UserIcon,
  HelpCircle,
  LogOut,
  LogIn,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

export default function Sidebar({
  activePage,
  setActivePage,
  user,
  onLogout,
  onLoginClick,
}: SidebarProps) {
  // Check active menu item
  const isTabActive = (tab: PageId) => {
    if (tab === 'pulse' && activePage === 'pulse') return true;
    if (tab === 'quick-pulse' && activePage === 'quick-pulse') return true;
    if (tab === 'news' && activePage === 'news') return true;
    if (tab === 'watchlist' && activePage === 'watchlist') return true;
    if (tab === 'pro' && activePage === 'pro') return true;
    if (tab === 'account' && (activePage === 'account' || activePage === 'billing')) return true;
    return false;
  };

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] w-64 sticky top-16 bg-surface/50 backdrop-blur-md p-md border-r border-outline select-none">
      <div className="flex flex-col gap-xs mb-xl">
        <div className="px-sm py-xs mb-sm">
          <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">
            INTELLIGENCE
          </p>
        </div>

        {/* Pulse */}
        <button
          onClick={() => setActivePage('pulse')}
          className={`flex items-center gap-md px-md py-2.5 rounded-xl transition-all hover:bg-surface-container-high cursor-pointer ${
            activePage === 'pulse'
              ? 'text-primary font-semibold bg-primary/10'
              : 'text-secondary font-medium hover:text-on-surface'
          }`}
        >
          <Activity className="w-4.5 h-4.5" />
          <span className="text-xs uppercase tracking-wider font-mono">Pulse</span>
        </button>

        {/* Quick Pulse alternative dashboard */}
        <button
          onClick={() => setActivePage('quick-pulse')}
          className={`flex items-center gap-md px-md py-2.5 rounded-xl transition-all hover:bg-surface-container-high cursor-pointer ${
            activePage === 'quick-pulse'
              ? 'text-primary font-semibold bg-primary/10'
              : 'text-secondary font-medium hover:text-on-surface'
          }`}
        >
          <TrendingUp className="w-4.5 h-4.5" />
          <span className="text-xs uppercase tracking-wider font-mono">Quick Pulse</span>
        </button>

        {/* Podcast News Feed */}
        <button
          onClick={() => setActivePage('news')}
          className={`flex items-center gap-md px-md py-2.5 rounded-xl transition-all hover:bg-surface-container-high cursor-pointer ${
            activePage === 'news'
              ? 'text-primary font-semibold bg-primary/10'
              : 'text-secondary font-medium hover:text-on-surface'
          }`}
        >
          <Newspaper className="w-4.5 h-4.5" />
          <span className="text-xs uppercase tracking-wider font-mono">Podcast Hub</span>
        </button>

        {/* My Watchlist */}
        <button
          onClick={() => setActivePage('watchlist')}
          className={`flex items-center gap-md px-md py-2.5 rounded-xl transition-all hover:bg-surface-container-high cursor-pointer ${
            activePage === 'watchlist'
              ? 'text-primary font-semibold bg-primary/10'
              : 'text-secondary font-medium hover:text-on-surface'
          }`}
        >
          <Eye className="w-4.5 h-4.5" />
          <span className="text-xs uppercase tracking-wider font-mono">My Watchlist</span>
        </button>

        {/* Pro Analysis */}
        <button
          onClick={() => setActivePage('pro')}
          className={`flex items-center gap-md px-md py-2.5 rounded-xl transition-all hover:bg-surface-container-high cursor-pointer ${
            activePage === 'pro'
              ? 'text-primary font-semibold bg-primary/10'
              : 'text-secondary font-medium hover:text-on-surface'
          }`}
        >
          <Award className="w-4.5 h-4.5" />
          <span className="text-xs uppercase tracking-wider font-mono">Pro Analysis</span>
        </button>

        {/* Account / Billing */}
        <button
          onClick={() => {
            if (user) {
              setActivePage('account');
            } else {
              setActivePage('login');
            }
          }}
          className={`flex items-center gap-md px-md py-2.5 rounded-xl transition-all hover:bg-surface-container-high cursor-pointer ${
            isTabActive('account')
              ? 'text-primary font-semibold bg-primary/10'
              : 'text-secondary font-medium hover:text-on-surface'
          }`}
        >
          <UserIcon className="w-4.5 h-4.5" />
          <span className="text-xs uppercase tracking-wider font-mono">
            {user ? 'Account & Billing' : 'Sign In'}
          </span>
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-xs border-t border-outline pt-md">
        {/* Support */}
        <button
          onClick={() => alert('Support Desk is available 24/7 at support@bullbrief.com')}
          className="flex items-center gap-md px-md py-2.5 rounded-xl text-tertiary font-mono text-xs tracking-wider uppercase hover:bg-surface-container-high hover:text-on-surface cursor-pointer transition-colors"
        >
          <HelpCircle className="w-4.5 h-4.5" />
          <span>Support</span>
        </button>

        {/* Auth Button */}
        {user ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-md px-md py-2.5 rounded-xl text-error hover:bg-error-container hover:text-on-error-container cursor-pointer transition-all font-mono text-xs tracking-wider uppercase"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-md px-md py-2.5 rounded-xl text-primary hover:bg-primary-container/10 cursor-pointer transition-all font-mono text-xs tracking-wider uppercase"
          >
            <LogIn className="w-4.5 h-4.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Pro / Go Pro Upgrade call-to-action */}
        {(!user || !user.isPro) ? (
          <div className="mt-md p-md bg-gradient-to-br from-slate-950 to-primary/5 text-on-surface border border-primary/20 rounded-xl flex flex-col gap-xs transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-xs">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <p className="font-headline italic text-sm text-white font-semibold">Go Premium</p>
            </div>
            <p className="text-[10px] text-secondary leading-relaxed uppercase tracking-wider">
              Unlock institutional-grade real-time market sentiment & analysis.
            </p>
            <button
              onClick={() => setActivePage('pro')}
              className="w-full mt-sm py-2 bg-primary hover:bg-opacity-90 text-slate-950 font-mono text-[10px] tracking-[0.15em] font-bold uppercase transition-all cursor-pointer rounded-lg border border-transparent shadow-md"
            >
              Subscribe
            </button>
          </div>
        ) : (
          <div className="mt-md p-md bg-primary-container border border-primary/20 text-primary rounded-xl flex flex-col gap-xs">
            <div className="flex items-center gap-xs">
              <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
              <p className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-primary">PRO MEMBER</p>
            </div>
            <p className="text-[11px] text-secondary leading-normal font-medium">
              Thank you for being a Pro subscriber. Real-time data feed is active.
            </p>
            <button
              onClick={() => setActivePage('account')}
              className="w-full mt-xs py-2 bg-primary/25 hover:bg-primary/35 text-primary text-[10px] tracking-[0.15em] font-bold uppercase transition-all cursor-pointer rounded-lg"
            >
              Manage Plan
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
