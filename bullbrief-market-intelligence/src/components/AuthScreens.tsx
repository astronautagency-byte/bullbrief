import React, { useState } from 'react';
import { PageId } from '../types';
import { Lock, Mail, User as UserIcon, Sparkles, Building, ArrowRight } from 'lucide-react';

interface AuthScreensProps {
  mode: 'login' | 'register';
  onAuthSuccess: (user: { name: string; email: string; isPro: boolean; joinedDate: string }) => Promise<void>;
  setActivePage: (page: PageId) => void;
}

export default function AuthScreens({ mode, onAuthSuccess, setActivePage }: AuthScreensProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
      await onAuthSuccess({
        name: name || 'Elena Vance',
        email: email || 'elena.vance@institutional-flows.com',
        isPro: false,
        joinedDate: 'Jul 18, 2026'
      });
      alert('LOGIN SUCCESSFUL:\n\nWelcome back to BullBrief. Sandbox session started.');
    } else {
      await onAuthSuccess({
        name: name || 'Alex Mercer',
        email: email || 'alex.mercer@hedgecapital.com',
        isPro: false,
        joinedDate: 'Jul 18, 2026'
      });
      alert('REGISTRATION SUCCESSFUL:\n\nAccount registered. Welcome to the BullBrief Intelligence network.');
    }
    setActivePage('pulse');
  };

  // One-Click Demo prefill helper for rapid previewing
  const triggerDemoLogin = async (proStatus: boolean) => {
    await onAuthSuccess({
      name: 'Elena Vance',
      email: 'elena.vance@institutional-flows.com',
      isPro: proStatus,
      joinedDate: 'Jan 12, 2026'
    });
    alert(`DEMO INITIALIZED:\n\nLogged in as Elena Vance (${proStatus ? 'Pro Subscriber' : 'Basic Tier User'}).`);
    setActivePage('pulse');
  };

  return (
    <div className="flex flex-col items-center justify-center py-lg px-md w-full max-w-md mx-auto select-none animate-fade-in">
      <div className="bg-surface border border-outline rounded-none p-lg w-full flex flex-col gap-md shadow-lg">
        {/* Brand logo header inside form */}
        <div className="text-center flex flex-col items-center">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3AvLGBnA1tNwcrm_-DWGOLW1oxnW45yzwd0-EYA0oClyPedOfaZqL6x0b1iqe1PPBdwggcB0gj4w42Bo8aTX9lPAztUIsxTlH82imgo6-r3iMH_XaClA4zIQ6-fa1dbOjE6U6aDYBe3dZrP6UGxTYyjw4rakN-EQN5NL4FaH2x3WgkdchgxMdytfWVc_U8Ae17uVgr1CJEtjL0wfEk--PYRTWTiWal2KTNsATufuy9WlYjuq5qGmom8ljdoJugBcXwA"
            alt="BullBrief Logo"
            referrerPolicy="no-referrer"
            className="h-12 w-auto object-contain mb-xs"
          />
          <h2 className="font-headline italic text-xl md:text-2xl text-on-surface tracking-tight mt-1 font-light">
            {mode === 'login' ? 'Sign In to Workspace' : 'Register Intelligence Node'}
          </h2>
          <p className="font-sans text-xs text-secondary mt-2 max-w-xs leading-relaxed">
            Sign in to synchronize watchlists and account settings across your devices.
          </p>
        </div>

        {/* Demo Fast Login Area */}
        <div className="bg-surface-container border border-outline rounded-none p-md flex flex-col gap-xs text-center">
          <span className="font-mono text-[9px] text-on-surface font-bold uppercase tracking-[0.2em] block">
            DEMO SANDBOX FAST LOGIN
          </span>
          <div className="grid grid-cols-2 gap-sm mt-2">
            <button
              onClick={() => triggerDemoLogin(false)}
              className="py-2.5 px-1 bg-transparent border border-outline hover:bg-surface-container-high text-secondary hover:text-on-surface font-mono font-bold text-[10px] uppercase tracking-wider rounded-none cursor-pointer transition-all"
            >
              Elena (Basic)
            </button>
            <button
              onClick={() => triggerDemoLogin(true)}
              className="py-2.5 px-1 bg-primary text-slate-950 hover:bg-opacity-90 font-mono font-bold text-[10px] uppercase tracking-wider rounded-none cursor-pointer transition-all flex items-center justify-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-slate-950 animate-pulse" />
              <span>Elena (Pro)</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-outline-variant"></div>
          <span className="flex-shrink mx-4 font-mono text-[8px] text-tertiary font-bold uppercase tracking-widest">OR USE REGISTERED MAIL</span>
          <div className="flex-grow border-t border-outline-variant"></div>
        </div>

        {/* Auth form */}
        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-sm text-left">
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Display Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-surface-container-low border border-outline rounded-none py-2.5 pl-10 pr-4 text-xs font-sans text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena.vance@institutional-flows.com"
                className="w-full bg-surface-container-low border border-outline rounded-none py-2.5 pl-10 pr-4 text-xs font-sans text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Secret Passcode</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-container-low border border-outline rounded-none py-2.5 pl-10 pr-4 text-xs font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-sm py-3 bg-primary text-slate-950 border border-primary rounded-none font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 hover:bg-opacity-90"
          >
            <span>{mode === 'login' ? 'Authorize Credentials' : 'Create Node Profile'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center font-sans text-xs text-secondary border-t border-outline-variant pt-sm">
          {mode === 'login' ? (
            <p>
              New analyst to the network?{' '}
              <button
                type="button"
                onClick={() => setActivePage('register')}
                className="text-primary font-bold hover:underline cursor-pointer"
              >
                Create a node profile.
              </button>
            </p>
          ) : (
            <p>
              Already have active credentials?{' '}
              <button
                type="button"
                onClick={() => setActivePage('login')}
                className="text-primary font-bold hover:underline cursor-pointer"
              >
                Log in to session.
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
