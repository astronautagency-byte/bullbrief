import React, { useState, useEffect } from 'react';
import { PageId, User } from '../types';
import { Search, Bell, Sparkles, Menu, X, Settings, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  setActivePage: (page: PageId) => void;
  onLoginClick: () => void;
  onSearch: (query: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Header({
  user,
  setActivePage,
  onLoginClick,
  onSearch,
  mobileMenuOpen,
  setMobileMenuOpen,
}: HeaderProps) {
  const [searchVal, setSearchVal] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    onSearch(val);
  };

  // Human-readable format matching "institutional" standards
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    hour12: false
  });

  return (
    <header className="h-16 w-full bg-surface border-b border-outline-variant flex items-center justify-between px-md md:px-xl sticky top-0 z-50">
      {/* Brand Logo & Wordmark */}
      <div className="flex items-center gap-xs cursor-pointer" onClick={() => setActivePage('pulse')}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3AvLGBnA1tNwcrm_-DWGOLW1oxnW45yzwd0-EYA0oClyPedOfaZqL6x0b1iqe1PPBdwggcB0gj4w42Bo8aTX9lPAztUIsxTlH82imgo6-r3iMH_XaClA4zIQ6-fa1dbOjE6U6aDYBe3dZrP6UGxTYyjw4rakN-EQN5NL4FaH2x3WgkdchgxMdytfWVc_U8Ae17uVgr1CJEtjL0wfEk--PYRTWTiWal2KTNsATufuy9WlYjuq5qGmom8ljdoJugBcXwA"
          alt="BullBrief Logo"
          referrerPolicy="no-referrer"
          className="h-10 w-auto object-contain"
        />
        <div className="hidden lg:flex flex-col select-none">
          <span className="font-headline italic text-lg font-light leading-none text-on-surface">BullBrief</span>
          <span className="font-sans text-[8px] font-bold text-secondary tracking-[0.3em] leading-none uppercase mt-1">
            Market Intelligence
          </span>
        </div>
      </div>

      {/* Global Live Search input */}
      <div className="hidden md:flex flex-1 max-w-md mx-xl relative">
        <Search className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchVal}
          onChange={handleSearchChange}
          placeholder="Search indices, assets, briefings..."
          className="w-full bg-surface-container-low border border-outline-variant rounded-none py-2 pl-10 pr-4 text-xs font-sans placeholder:text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {/* Live Market Clock & User Status Bar */}
      <div className="flex items-center gap-md">
        {/* Real-time Institutional Clock */}
        <div className="hidden sm:flex flex-col text-right select-none pr-md border-r border-outline-variant">
          <span className="font-mono text-[10px] tracking-wider text-tertiary font-bold uppercase">MARKET TIME (EST)</span>
          <span className="font-mono text-xs font-semibold text-on-surface tabular-nums">
            {formattedTime}
          </span>
        </div>

        {/* Notifications & Settings Triggers */}
        <div className="flex items-center gap-xs">
          <button
            onClick={() => alert('No new notifications. All markets functioning normally.')}
            className="p-2 text-tertiary hover:bg-surface-container-high rounded-full relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white"></span>
          </button>
        </div>

        {/* Dynamic Auth Profile Card */}
        {user ? (
          <div
            onClick={() => setActivePage('account')}
            className="flex items-center gap-xs cursor-pointer hover:bg-surface-container-high px-2 py-1 rounded-none transition-colors"
          >
            <div className="relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIOSQ9fme3uyy4MH4FmKw7Qeu1Vp04IaLAcEJTtm7nj6sBO25wm__JLM1i171zBsm0b-Mi68c6OopXGkT6d2uiUeff_7s-r6Mzj-oRTn_S-ma33UT_ScfEHOP9V982fvub1tFiX7eOnpCRM7Yoyjl1PAWgjONtps3Yaqj0Ow5iaLbKZmAyggx9XI0R89QCBirHn7gPtgWMcZ0pqSUWMU06sMbimF7DmPghfikfS7BivpzmHAHgdr-o"
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-outline-variant"
              />
              {user.isPro && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-[#1A1A1A] text-[#FAF9F6] p-0.5 rounded-full ring-1 ring-[#FAF9F6]">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold leading-none text-on-surface">{user.name}</span>
              <span className="font-mono text-[9px] font-bold text-primary tracking-widest uppercase">
                {user.isPro ? 'PRO SUBS' : 'BASIC TIER'}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-sm px-4 py-2 bg-primary text-white font-sans font-bold text-xs rounded-none hover:bg-transparent hover:text-primary border border-primary transition-all cursor-pointer uppercase tracking-widest"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Mobile Navigation Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-on-surface hover:bg-surface-container-high rounded-lg cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
}
