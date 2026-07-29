import React, { useState } from 'react';
import { User, Invoice } from '../types';
import {
  User as UserIcon,
  CreditCard,
  Download,
  CheckCircle,
  FileText,
  Save,
  Building,
  ShieldCheck,
  Award,
  Trash2
} from 'lucide-react';

interface AccountBillingProps {
  user: User;
  onUpdateUser: (updated: Partial<User>) => Promise<void>;
  invoices: Invoice[];
  onExportAccount: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export default function AccountBilling({ user, onUpdateUser, invoices, onExportAccount, onDeleteAccount }: AccountBillingProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateUser({ name });
      setEmail(user.email);
      alert('PROFILE UPDATED:\n\nYour account profile has been synchronized.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    alert(`DOWNLOADING RECEIPT PRINT:\n\nInvoice: ${invoice.id}\nDate: ${invoice.date}\nAmount Paid: $${invoice.amount.toFixed(2)}\nStatus: PAID\n\nGenerated for ${user.name} (${user.email}).`);
  };

  return (
    <div className="flex flex-col gap-lg w-full animate-fade-in select-none max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-outline pb-4">
        <h2 className="font-headline italic text-2xl md:text-3xl text-on-surface tracking-tight font-light">
          Account Workspace Settings
        </h2>
        <p className="font-sans text-xs text-secondary/80">
          Configure profile specifications, track your active subscription matrix, and download invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg items-start">
        {/* Left Column: Form Settings */}
        <div className="md:col-span-7 flex flex-col gap-lg">
          {/* Form */}
          <form onSubmit={handleProfileSubmit} className="bg-surface border border-outline rounded-none p-lg flex flex-col gap-md">
            <h3 className="font-headline italic text-base text-on-surface flex items-center gap-2 border-b border-outline pb-2 font-semibold">
              <UserIcon className="w-5 h-5 text-primary" />
              <span>Identity Specifications</span>
            </h3>

            <div className="flex flex-col gap-sm">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Display Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border border-outline rounded-none p-2.5 font-sans text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Registered Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  disabled
                  className="bg-transparent border border-outline rounded-none p-2.5 font-sans text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <p className="text-[10px] text-tertiary">Contact support to change the account identifier.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-xs py-2.5 bg-primary text-slate-950 border border-primary rounded-none font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-opacity-95 w-full sm:w-auto self-start sm:px-6"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Specifications'}</span>
            </button>
          </form>

          {/* Billing Receipts Panel */}
          <div className="bg-surface border border-outline rounded-none p-lg flex flex-col gap-md">
            <h3 className="font-headline italic text-base text-on-surface flex items-center gap-2 border-b border-outline pb-2 font-semibold">
              <FileText className="w-5 h-5 text-primary" />
              <span>Receipt Billing Ledger</span>
            </h3>

            <div className="flex flex-col gap-2">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-md bg-surface-container-low border border-outline rounded-none tabular-nums hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-md">
                    <FileText className="w-5 h-5 text-secondary" />
                    <div>
                      <span className="font-mono text-xs font-black text-on-surface block">{inv.id}</span>
                      <span className="font-sans text-[11px] text-tertiary">{inv.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-lg">
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-on-surface block">${inv.amount.toFixed(2)}</span>
                      <span className="font-mono text-[9px] bg-transparent text-primary border border-outline px-1.5 py-0.5 rounded-none font-bold uppercase tracking-wider">
                        {inv.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(inv)}
                      className="p-2 hover:bg-surface-container rounded-none text-tertiary hover:text-primary transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-outline rounded-none p-lg flex flex-col gap-md">
            <h3 className="font-headline italic text-base text-on-surface font-semibold">Privacy & account data</h3>
            <p className="text-xs text-secondary">
              Download a copy of your profile, watchlist, and billing records, or permanently delete the server-side account record.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onExportAccount} className="px-4 py-2 border border-outline text-xs text-on-surface">
                Export account data
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Permanently delete this BullBrief account and its saved watchlist? This cannot be undone.')) {
                    await onDeleteAccount();
                  }
                }}
                className="px-4 py-2 border border-error text-xs text-error flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete account
              </button>
            </div>
            <p className="text-[10px] text-tertiary">
              Exports are personal data copies, not official statements or investment records. Market and AI content may be delayed or inaccurate.
            </p>
          </div>
        </div>

        {/* Right Column: Active Subscription card info */}
        <div className="md:col-span-5 flex flex-col gap-lg">
          {/* Profile overview badge */}
          <div className="bg-surface border border-outline rounded-none p-lg text-center flex flex-col items-center gap-xs">
            {/* Elegant Letter-based Initial Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-headline italic text-2xl font-light shadow-inner mb-2 uppercase select-none">
              {name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'EV'}
            </div>
            <h4 className="font-headline italic text-lg text-on-surface mt-xs font-bold">{user.name}</h4>
            <p className="font-mono text-[10px] text-tertiary -mt-1 font-bold">{user.email}</p>
            <div className="w-full border-t border-outline my-sm"></div>
            <span className="font-mono text-[11px] text-secondary">Registered: {user.joinedDate}</span>
          </div>

          {/* Plan specification card */}
          {user.isPro ? (
            <div className="bg-primary/5 border border-primary/10 rounded-none p-lg flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-primary font-black uppercase tracking-widest">ACTIVE PLAN</span>
                <Award className="w-5 h-5 text-primary" />
              </div>

              <div>
                <h3 className="font-headline italic text-xl text-primary font-bold">BullBrief Pro Active</h3>
                <p className="font-sans text-xs text-secondary mt-1 leading-relaxed">
                  You are currently subscribed to the Professional Tier, unlocking expanded audio briefings, consensus summaries, and automated analysis logs.
                </p>
              </div>

              <div className="bg-surface-container border border-outline rounded-none p-md flex items-center justify-between tabular-nums">
                <div>
                  <span className="font-mono text-[9px] text-tertiary block">MONTHLY CHARGE</span>
                  <span className="font-mono text-sm font-black text-on-surface">$99.00 / month</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[9px] text-tertiary block">RENEWAL DATE</span>
                  <span className="font-mono text-xs font-semibold text-on-surface">Aug 12, 2026</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-secondary bg-surface-container border border-outline p-2.5 rounded-none">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Signed-in account data is synchronized through an HTTP-only session. Do not share access to your device.</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-outline rounded-none p-lg flex flex-col gap-md">
              <span className="font-mono text-[9px] text-tertiary font-bold uppercase tracking-widest">ACTIVE PLAN</span>

              <div>
                <h3 className="font-headline italic text-xl text-on-surface font-light">Standard Basic Tier</h3>
                <p className="font-sans text-xs text-secondary mt-1 leading-relaxed">
                  You are currently on the free Standard Tier, restricted to basic news briefs and standard delayed tickers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onUpdateUser({ isPro: true })}
                className="w-full py-3 bg-primary text-slate-950 border border-primary font-mono font-bold text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer hover:bg-opacity-95 active:scale-95 text-center block"
              >
                Instant Simulated Upgrade
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
