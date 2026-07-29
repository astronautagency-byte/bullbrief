import React, { useState } from 'react';
import { User } from '../types';
import {
  Sparkles,
  Check,
  CreditCard,
  ShieldCheck,
  Building,
  Zap,
  Globe,
  Coins
} from 'lucide-react';

interface ProPricingProps {
  user: User | null;
  onUpgradeSuccess: () => void;
  setActivePage: (page: string) => void;
  onLoginRedirect: () => void;
}

export default function ProPricing({
  user,
  onUpgradeSuccess,
  setActivePage,
  onLoginRedirect,
}: ProPricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [isProcessing, setIsProcessing] = useState(false);

  const priceVal = billingCycle === 'monthly' ? 99.00 : 990.00;
  const pricePeriod = billingCycle === 'monthly' ? '/ MONTH' : '/ YEAR';

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in or create an account first.');
      onLoginRedirect();
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsCheckoutOpen(false);
      onUpgradeSuccess();
      alert('UPGRADE SUCCESSFUL:\n\nWelcome to BullBrief Pro. Expanded analysis features are now available. Market-data timing varies by source and venue.');
      setActivePage('pulse');
    }, 1500);
  };

  const proFeatures = [
    {
      title: 'Institutional Macro Briefings',
      desc: '320kbps high-fidelity audio streams and written summaries updated daily before the opening bell.',
    },
    {
      title: 'Consensus Sentiment Index',
      desc: 'Unfiltered 0-100 confidence meter gauge driven by raw Bloomberg, Reuters, and WSJ sentiment engines.',
    },
    {
      title: 'AI Implications Engine',
      desc: 'Automatic cognitive bias calculations and microeconomic risk logs for any custom equity ticker.',
    },
    {
      title: 'Quantitative Analyst Deck',
      desc: 'Explore comprehensive asset targets, institutional inflow trends, and AI consensus scoring.',
    },
    {
      title: 'Global Analyst Briefs',
      desc: 'Instant updates on Tokyo, Frankfurt, London, and New York core treasury yield shifts.',
    }
  ];

  return (
    <div className="flex flex-col gap-lg w-full animate-fade-in select-none max-w-4xl mx-auto">
      {/* Title */}
      <div className="text-center flex flex-col items-center gap-xs mb-md">
        <span className="bg-primary text-slate-950 px-3.5 py-1.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>BULLBRIEF PROFESSIONAL INTELLIGENCE</span>
        </span>
        <h1 className="font-headline italic text-3xl md:text-5xl text-on-surface tracking-tight mt-4 font-light">
          Institutional intelligence. Level pricing.
        </h1>
        <p className="font-sans text-xs text-secondary/80 max-w-xl leading-relaxed mt-2">
          Empower your portfolio with the exact data matrices, macro-briefings, and sentiment indices used by institutional desk analysts worldwide.
        </p>

        {/* Toggle Billing Cycle */}
        <div className="flex bg-surface-container rounded-none p-1 mt-md border border-outline">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-1.5 rounded-none font-mono font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-all ${
              billingCycle === 'monthly'
                ? 'bg-primary text-slate-950 shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-1.5 rounded-none font-mono font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-primary text-slate-950 shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <span>Yearly Billing</span>
            <span className="bg-slate-950 text-primary text-[9px] font-mono px-1.5 py-0.5 rounded-none font-black">SAVE 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg items-stretch">
        {/* Basic Card */}
        <div className="bg-surface border border-outline rounded-none p-lg flex flex-col justify-between opacity-80">
          <div>
            <div className="border-b border-outline pb-md mb-md">
              <span className="font-mono text-[9px] text-tertiary font-bold uppercase tracking-[0.15em]">STANDARD TIER</span>
              <h3 className="font-headline italic text-2xl text-on-surface mt-1 font-light">Basic Access</h3>
              <p className="font-sans text-xs text-secondary mt-1">
                For retail hobbyists looking for daily digests.
              </p>
              <div className="mt-md font-headline italic text-3xl text-on-surface font-light">
                $0 <span className="text-xs font-mono font-bold text-tertiary">/ FOREVER</span>
              </div>
            </div>

            <ul className="flex flex-col gap-sm text-xs text-secondary font-sans">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Standard market news feed stream.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Standard local watchlist portfolios.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Delay of 15 minutes on global macro feeds.</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full mt-lg py-3 border border-outline text-tertiary rounded-none font-mono font-bold text-xs uppercase bg-surface-container-low/30 cursor-not-allowed"
          >
            Active Subscription
          </button>
        </div>

        {/* Pro Card (Highlighted) */}
        <div className="bg-surface border-2 border-primary rounded-none p-lg flex flex-col justify-between relative">
          <div className="absolute -top-3 right-6 bg-primary text-slate-950 text-[9px] font-mono font-bold px-3 py-1 rounded-none uppercase tracking-widest">
            RECOMMENDED FOR ACTIVE OBSERVERS
          </div>

          <div>
            <div className="border-b border-outline pb-md mb-md">
              <span className="font-mono text-[9px] text-primary font-black uppercase tracking-[0.15em]">FULL INTELLIGENCE</span>
              <h3 className="font-headline italic text-2xl text-on-surface mt-1 font-bold">BullBrief Pro</h3>
              <p className="font-sans text-xs text-secondary mt-1">
                Expanded research matrices, audio briefings, and automated analysis.
              </p>
              <div className="mt-md font-headline italic text-4xl text-primary tabular-nums font-bold">
                ${priceVal.toFixed(2)}{' '}
                <span className="text-xs font-mono font-bold text-tertiary uppercase">{pricePeriod}</span>
              </div>
            </div>

            <ul className="flex flex-col gap-sm text-xs text-secondary font-sans">
              {proFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-on-surface font-semibold block font-headline italic text-xs">{feat.title}</strong>
                    <span className="text-tertiary text-[11px] leading-normal">{feat.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {user && user.isPro ? (
            <button
              disabled
              className="w-full mt-lg py-3 bg-surface-container text-primary rounded-none font-mono font-bold text-xs uppercase tracking-widest cursor-not-allowed"
            >
              Pro Tier Is Active
            </button>
          ) : (
            <button
              onClick={() => {
                if (user) {
                  setIsCheckoutOpen(true);
                } else {
                  alert('Please sign in or create a mock account to continue.');
                  onLoginRedirect();
                }
              }}
              className="w-full mt-lg py-3.5 bg-primary text-slate-950 rounded-none font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer hover:bg-opacity-95 active:scale-98"
            >
              Initiate Pro Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Checkout Simulated Drawer Modal Overlay */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-md">
          <form
            onSubmit={handleCheckoutSubmit}
            className="bg-surface border border-outline rounded-none max-w-md w-full shadow-2xl animate-scale-up overflow-hidden"
          >
            <div className="p-lg border-b border-outline bg-surface-container text-on-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">
                  SECURE CHECKOUT DESK
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-on-surface hover:text-primary font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-lg flex flex-col gap-md">
              <div className="bg-surface-container p-md rounded-none flex items-center justify-between border border-outline">
                <div>
                  <span className="font-mono text-[9px] text-tertiary block font-bold uppercase tracking-wider">SELECTED BILLING MATRIX</span>
                  <span className="font-headline italic text-sm text-primary font-bold">
                    BullBrief Pro ({billingCycle === 'monthly' ? 'Monthly' : 'Yearly'})
                  </span>
                </div>
                <div className="text-right font-mono font-black text-primary tabular-nums">
                  ${priceVal.toFixed(2)}
                </div>
              </div>

              {/* Mock credit card inputs */}
              <div className="flex flex-col gap-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. Elena Vance"
                    className="bg-transparent border border-outline rounded-none p-2.5 font-sans text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Mock Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="bg-transparent border border-outline rounded-none p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-sm">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Expiry</label>
                    <input
                      type="text"
                      required
                      defaultValue="09/29"
                      placeholder="MM/YY"
                      className="bg-transparent border border-outline rounded-none p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] text-tertiary font-bold uppercase">CVC Code</label>
                    <input
                      type="text"
                      required
                      defaultValue="123"
                      placeholder="123"
                      className="bg-transparent border border-outline rounded-none p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 text-[10px] text-secondary bg-surface-container-low border border-outline p-2.5 rounded-none">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Simulated Sandbox Payment. Do not insert actual sensitive bank card details.</span>
              </div>
            </div>

            <div className="p-lg bg-surface-container-low border-t border-outline flex gap-sm">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 py-3 bg-primary text-slate-950 border border-primary rounded-none font-mono font-bold text-xs uppercase tracking-widest hover:bg-opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize Payment</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-3 border border-outline text-on-surface hover:bg-surface-container rounded-none font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
