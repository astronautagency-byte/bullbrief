"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  ClipboardCheck,
  FileDown,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { type KypAssetType, type KypHolding, type KypProductRecord } from "@/lib/kyp";
import { formatPrice } from "@/lib/types";
import { KypResearchReport } from "@/components/kyp/kyp-research-report";
import { KypPrintReport } from "@/components/kyp/kyp-print-report";

type Filter = "all" | "fund" | "stock" | "review";
type ProductSearchResult = {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  currency: string;
  assetType: KypAssetType;
  source: "Morningstar" | "Yahoo";
};
type Draft = {
  reviewContext: string;
  firmApproval: string;
  structure: string;
  risk: string;
  costs: string;
  liquidityComplexity: string;
  conflicts: string;
  alternatives: string;
  lowerCostRationale: string;
  rationale: string;
  clientExplanation: string;
  changeMonitoring: string;
  evidenceSources: string;
  nextReview: string;
  completed: boolean;
  completedAt: string;
};

const EMPTY_DRAFT: Draft = {
  reviewContext: "",
  firmApproval: "",
  structure: "",
  risk: "",
  costs: "",
  liquidityComplexity: "",
  conflicts: "",
  alternatives: "",
  lowerCostRationale: "",
  rationale: "",
  clientExplanation: "",
  changeMonitoring: "",
  evidenceSources: "",
  nextReview: "",
  completed: false,
  completedAt: "",
};
const STORAGE_KEY = "bullbrief:kyp-drafts:v2";
const CUSTOM_HOLDINGS_KEY = "bullbrief:kyp-custom-holdings:v1";
const REPORT_IDENTITY_KEY = "bullbrief:report-identity:v1";
const REQUIRED_FIELDS: Array<keyof Draft> = [
  "reviewContext",
  "firmApproval",
  "structure",
  "risk",
  "costs",
  "liquidityComplexity",
  "alternatives",
  "lowerCostRationale",
  "rationale",
  "clientExplanation",
  "changeMonitoring",
  "nextReview",
];

function Field({ label, value, onChange, placeholder, multiline = true }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean }) {
  const shared = "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-on-surface-variant/60";
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-on-surface">{label}</span>
      {multiline ? (
        <textarea rows={3} className={`${shared} py-3`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <span className="relative block">
          <input type="date" className={`${shared} h-12 appearance-none pr-12 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`} value={value} onChange={(event) => onChange(event.target.value)} />
          <CalendarDays aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        </span>
      )}
    </label>
  );
}

function SelectField({ label, hint, value, onChange, children }: { label: string; hint: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface">{label}</span>
      <span className="mt-1 block text-[11px] leading-4 text-on-surface-variant">{hint}</span>
      <span className="relative mt-3 block">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest py-2.5 pl-4 pr-12 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
      </span>
    </label>
  );
}

export function KypWorkspace() {
  const [records, setRecords] = useState<KypProductRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [customHoldings, setCustomHoldings] = useState<KypHolding[]>([]);
  const [showNewKyp, setShowNewKyp] = useState(false);
  const [newProduct, setNewProduct] = useState<{ assetType: KypAssetType; requestedName: string; identifier: string; exchange: string }>({ assetType: "stock", requestedName: "", identifier: "", exchange: "TSX" });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<KypAssetType | "all">("all");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [createError, setCreateError] = useState("");
  const [reportIdentity, setReportIdentity] = useState({ name: "", institutionLogo: "" });
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; close: number; volume: number }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setDrafts(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
      } catch {
        setDrafts({});
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showNewKyp || manualEntry || searchTerm.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const response = await fetch(`/api/kyp/search?q=${encodeURIComponent(searchTerm.trim())}&type=${searchType}`, { signal: controller.signal });
        if (response.ok) setSearchResults((await response.json()).data || []);
      } catch {
        if (!controller.signal.aborted) setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchingProducts(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [showNewKyp, manualEntry, searchTerm, searchType]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(CUSTOM_HOLDINGS_KEY) || "[]");
        if (Array.isArray(stored)) setCustomHoldings(stored.slice(0, 10));
      } catch {
        setCustomHoldings([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const local = JSON.parse(localStorage.getItem(REPORT_IDENTITY_KEY) || "{}");
        setReportIdentity({ name: local.name || "", institutionLogo: local.institutionLogo || "" });
      } catch {}
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const profile = (await response.json()).data;
          setReportIdentity((current) => ({ name: profile.name || current.name, institutionLogo: profile.institutionLogo || current.institutionLogo }));
        }
      } catch {}
    };
    const timer = window.setTimeout(() => void loadIdentity(), 0);
    const updateIdentity = (event: Event) => {
      const detail = (event as CustomEvent<{ name: string; institutionLogo: string }>).detail;
      if (detail) setReportIdentity(detail);
    };
    window.addEventListener("bullbrief:report-identity", updateIdentity);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bullbrief:report-identity", updateIdentity);
    };
  }, []);

  const allHoldings = customHoldings;

  useEffect(() => {
    const requestedProduct = new URLSearchParams(window.location.search).get("product");
    if (!requestedProduct || !allHoldings.some((holding) => holding.id === requestedProduct)) return;
    const timer = window.setTimeout(() => setSelectedId(requestedProduct), 0);
    return () => window.clearTimeout(timer);
  }, [allHoldings]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/kyp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ holdings: allHoldings }),
      });
      if (response.ok) setRecords((await response.json()).data || []);
    } finally {
      setLoading(false);
    }
  }, [allHoldings]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const saveDraft = (id: string, change: Partial<Draft>) => {
    setDrafts((current) => {
      const next = { ...current, [id]: { ...EMPTY_DRAFT, ...current[id], ...change } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const deleteKyp = (id: string, name: string) => {
    if (!window.confirm(`Delete the KYP document for ${name}? This cannot be undone.`)) return;
    const nextHoldings = customHoldings.filter((holding) => holding.id !== id);
    setCustomHoldings(nextHoldings);
    localStorage.setItem(CUSTOM_HOLDINGS_KEY, JSON.stringify(nextHoldings));
    setRecords((current) => current.filter((record) => record.id !== id));
    setDrafts((current) => {
      const next = { ...current };
      delete next[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (selectedId === id) setSelectedId(nextHoldings[0]?.id || "");
  };

  const createKyp = () => {
    const requestedName = manualEntry ? newProduct.requestedName.trim() : selectedProduct?.name || "";
    const identifier = manualEntry ? newProduct.identifier.trim().toUpperCase() : selectedProduct?.ticker || selectedProduct?.id || "";
    if (!requestedName || !identifier) {
      setCreateError(manualEntry ? "Add the official product name and an identifier." : "Select a product from the search results.");
      return;
    }

    const assetType = manualEntry ? newProduct.assetType : selectedProduct!.assetType;
    const holding: KypHolding = {
      id: `custom-${crypto.randomUUID()}`,
      requestedName,
      searchQuery: manualEntry ? identifier : selectedProduct?.ticker || selectedProduct?.name || identifier,
      assetType,
      ...(assetType === "stock" ? { symbol: identifier, exchange: manualEntry ? newProduct.exchange : selectedProduct!.exchange } : {}),
      ...(!manualEntry && selectedProduct?.source === "Morningstar" ? { performanceId: selectedProduct.id } : {}),
    };
    const next = [...customHoldings, holding].slice(-10);
    setCustomHoldings(next);
    localStorage.setItem(CUSTOM_HOLDINGS_KEY, JSON.stringify(next));
    setSelectedId(holding.id);
    setNewProduct({ assetType: "stock", requestedName: "", identifier: "", exchange: "TSX" });
    setSearchTerm("");
    setSelectedProduct(null);
    setSearchResults([]);
    setManualEntry(false);
    setCreateError("");
    setShowNewKyp(false);
  };

  const items = records.length ? records : allHoldings.map((holding) => ({
    ...holding,
    status: "not_found" as const,
    asOf: "",
    identity: { performanceId: null, name: null, ticker: holding.symbol || null, exchange: holding.exchange || null },
    facts: { price: null, changePercent: null, currency: null, sector: null, industry: null, pe: null, priceToBook: null, priceToSales: null, priceToCashFlow: null, dividendYield: null, fairValue: null, starRating: null, economicMoat: null, marketCap: null, volume: null, averageVolume: null, fiftyTwoWeekLow: null, fiftyTwoWeekHigh: null, bid: null, ask: null },
    morningstar: { profileDescription: null, styleBox: null, employees: null, website: null, cusip: null, isin: null, analystReportTitle: null, analystName: null, reportPublishedAt: null, reportUpdatedAt: null, ratingAsOf: null, evaluatedPrice: null, fairValueAsOf: null, fairValueCurrency: null, fairValueUncertainty: null, oneStarPrice: null, twoStarPrice: null, fourStarPrice: null, fiveStarPrice: null, forwardDividendYield: null, totalYield: null, dividendMonths: [], returnOnAssets: null, returnOnEquity: null, returnOnCapital: null, quickRatio: null, currentRatio: null, interestCoverage: null, sharesOutstanding: null, competitors: [], availableComponents: [], lockedComponents: [], requestStatus: "unavailable" as const, retrievedAt: null },
  }));

  const selected = items.find((item) => item.id === selectedId) || items[0];
  const draft = { ...EMPTY_DRAFT, ...(selected ? drafts[selected.id] : {}) };
  const completeFields = REQUIRED_FIELDS.filter((field) => Boolean(draft[field])).length;
  const canComplete = completeFields === REQUIRED_FIELDS.length && draft.firmApproval !== "not-confirmed";

  const visible = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === "all" || item.assetType === filter || (filter === "review" && !drafts[item.id]?.completed);
    const haystack = `${item.requestedName} ${item.symbol || ""} ${item.identity.name || ""}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [items, filter, query, drafts]);

  useEffect(() => {
    if (selected?.assetType !== "stock" || !selected.symbol) {
      const clearTimer = window.setTimeout(() => setPriceHistory([]), 0);
      return () => window.clearTimeout(clearTimer);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true);
      try {
        const response = await fetch(`/api/markets/history?symbol=${encodeURIComponent(selected.symbol!)}&range=5y`, { signal: controller.signal });
        if (!response.ok) throw new Error("Historical prices unavailable");
        const payload = await response.json();
        setPriceHistory((payload.data || []).map((point: { date: string; value: number; volume: number }) => ({ date: point.date, close: point.value, volume: point.volume })));
      } catch {
        if (!controller.signal.aborted) setPriceHistory([]);
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selected?.assetType, selected?.symbol]);

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-[28px] border border-outline-variant bg-surface-container-low p-6 print:hidden md:p-8">
        <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[28px] border-primary/10" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em]">Agent workspace</span>
            </div>
            <h1 className="font-display text-3xl font-bold italic text-on-surface md:text-4xl">Know the product. Keep the record clear.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">Review essential product facts, document alternatives, and capture why the recommendation is reasonable without turning KYP into another research terminal.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setShowNewKyp(true); setSearchTerm(""); setSearchResults([]); setSelectedProduct(null); setSearchingProducts(false); setManualEntry(false); setCreateError(""); }} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-on-primary"><Plus className="h-4 w-4" /> New KYP</button>
            <button onClick={() => window.print()} disabled={!selected || historyLoading} className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"><FileDown className="h-4 w-4" /> {historyLoading ? "Loading report" : "Print record"}</button>
            <button onClick={() => void refresh()} disabled={loading || !items.length} className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-60"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh data</button>
          </div>
        </div>
      </section>

      <div className="kyp-print-document grid min-h-[720px] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-outline-variant lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-outline-variant p-4">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-on-surface">My KYP documents</p><button onClick={() => setShowNewKyp(true)} aria-label="Create KYP document" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"><Plus className="h-4 w-4" /></button></div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-2">
              <Search className="h-4 w-4 text-on-surface-variant" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a product" className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "fund", "stock", "review"] as const).map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={cn("rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize", filter === item ? "bg-on-surface text-background" : "bg-surface-container-low text-on-surface-variant")}>{item === "review" ? "Needs review" : item}</button>
              ))}
            </div>
          </div>
          <div className="max-h-[620px] overflow-y-auto p-2 lg:max-h-none">
            {visible.map((item, index) => {
              const isSelected = item.id === selected?.id;
              const isComplete = drafts[item.id]?.completed;
              return (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} key={item.id} className={cn("group relative flex items-center rounded-xl transition", isSelected ? "bg-surface-container-high" : "hover:bg-surface-container-low")}>
                  <button onClick={() => setSelectedId(item.id)} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left">
                    <span className={cn("h-9 w-1 shrink-0 rounded-full", isComplete ? "bg-primary" : item.status === "verified" ? "bg-primary/50" : "bg-warning")} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-on-surface">{item.identity.name || item.requestedName}</span><span className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-on-surface-variant">{item.assetType} · {item.identity.ticker || "Match pending"}</span></span>
                    {isComplete ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <ChevronRight className="h-4 w-4 shrink-0 text-on-surface-variant" />}
                  </button>
                  <button onClick={() => deleteKyp(item.id, item.identity.name || item.requestedName)} aria-label={`Delete ${item.identity.name || item.requestedName}`} className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant opacity-60 transition hover:bg-error/10 hover:text-error hover:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                </motion.div>
              );
            })}
            {!visible.length && <div className="px-5 py-12 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><ClipboardCheck className="h-5 w-5" /></div><p className="mt-3 text-sm font-semibold text-on-surface">{items.length ? "No documents match" : "No KYP documents yet"}</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">{items.length ? "Try another search or filter." : "Create a record to start product research and the advisor assessment."}</p>{!items.length && <button onClick={() => setShowNewKyp(true)} className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary"><Plus className="mr-1.5 inline h-3.5 w-3.5" />Create KYP</button>}</div>}
          </div>
        </aside>

        <AnimatePresence mode="wait">
          {selected ? (
          <motion.main key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }} className="kyp-report p-5 md:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-outline-variant pb-6 md:flex-row md:items-start">
            <div className="flex items-start gap-4">
              {reportIdentity.institutionLogo && (
                <div className="hidden h-16 w-28 shrink-0 items-center justify-center rounded-xl bg-white p-2 print:hidden sm:flex">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reportIdentity.institutionLogo} alt="Financial institution logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div>
                <div className="mb-2"><span className="text-[11px] font-semibold text-on-surface-variant">{selected.assetType === "fund" ? "Fund / ETF review" : "Equity review"}</span></div>
                <h2 className="font-display text-2xl font-bold text-on-surface">{selected.identity.name || selected.requestedName}</h2>
                <p className="mt-1 font-mono text-xs text-on-surface-variant">{selected.identity.ticker || selected.symbol || "Identifier pending"}{selected.identity.exchange ? ` · ${selected.identity.exchange}` : ""}</p>
                <p className="mt-2 text-xs text-on-surface-variant print:hidden">Prepared by <span className="font-semibold text-on-surface">{reportIdentity.name || "Advisor name not set"}</span></p>
              </div>
              </div>
              <div className="min-w-32 text-left md:text-right"><p className="font-mono text-2xl font-semibold text-on-surface">{selected.facts.price == null ? "-" : `${selected.facts.currency || ""} ${formatPrice(selected.facts.price)}`}</p><p className="text-[10px] uppercase tracking-wide text-on-surface-variant">Current reference price</p></div>
            </div>

            <KypResearchReport record={selected} />

            <section className="border-t border-outline-variant py-6">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px] md:items-end">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Advisor assessment</p><h3 className="mt-1 text-lg font-semibold text-on-surface">Complete the KYP record</h3><p className="mt-1 text-xs text-on-surface-variant">Your judgment stays separate from dealer approval and third-party product data.</p></div>
                <div><div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant"><span>Required fields</span><span className="font-mono">{completeFields} of {REQUIRED_FIELDS.length}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completeFields / REQUIRED_FIELDS.length) * 100}%` }} /></div></div>
              </div>
              <div className="mb-6 grid gap-3 md:grid-cols-2">
                <SelectField label="Review trigger" hint="Why this KYP review is being completed." value={draft.reviewContext} onChange={(reviewContext) => saveDraft(selected.id, { reviewContext, completed: false })}>
                  <option value="">Select a context</option>
                  <option value="recommendation">New recommendation or purchase</option>
                  <option value="continued-hold">Recommendation to continue holding</option>
                  <option value="transfer-in">Transferred-in security</option>
                  <option value="client-directed">Client-directed trade</option>
                  <option value="significant-change">Significant product change</option>
                </SelectField>
                <SelectField label="Dealer shelf status" hint="Confirm availability before making a recommendation." value={draft.firmApproval} onChange={(firmApproval) => saveDraft(selected.id, { firmApproval, completed: false })}>
                  <option value="">Confirm shelf status</option>
                  <option value="approved">Approved and available through the dealer</option>
                  <option value="restricted">Approved with restrictions</option>
                  <option value="not-required">Transfer-in/client-directed assessment</option>
                  <option value="not-confirmed">Not yet confirmed - do not recommend</option>
                </SelectField>
              </div>
              <div className="assessment-section-title mb-3 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">01</span><h4 className="text-sm font-semibold text-on-surface">Understand and explain the product</h4></div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Structure, features and potential return" value={draft.structure} onChange={(structure) => saveDraft(selected.id, { structure, completed: false })} placeholder="How it works, objective, time horizon, leverage, redemption and potential return…" />
                <Field label="Material risks and potential loss" value={draft.risk} onChange={(risk) => saveDraft(selected.id, { risk, completed: false })} placeholder="Principal loss, volatility, concentration, redemption and product-specific risks…" />
                <Field label="Initial and ongoing costs-and their impact" value={draft.costs} onChange={(costs) => saveDraft(selected.id, { costs, completed: false })} placeholder="MER, commissions, embedded or performance fees, plus the impact on expected returns…" />
                <Field label="Liquidity and complexity" value={draft.liquidityComplexity} onChange={(liquidityComplexity) => saveDraft(selected.id, { liquidityComplexity, completed: false })} placeholder="Trading liquidity, settlement/redemption limits and any complex features…" />
                <Field label="Material conflicts of interest" value={draft.conflicts} onChange={(conflicts) => saveDraft(selected.id, { conflicts })} placeholder="Compensation, proprietary-product or affiliate conflicts, and how they are addressed…" />
              </div>

              <div className="assessment-section-title mb-3 mt-7 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">02</span><h4 className="text-sm font-semibold text-on-surface">Compare a reasonable range of alternatives</h4></div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Alternatives available through the dealer" value={draft.alternatives} onChange={(alternatives) => saveDraft(selected.id, { alternatives, completed: false })} placeholder="Name the comparable products or actions reviewed and the criteria used…" />
                <Field label="Lower-cost alternative assessment" value={draft.lowerCostRationale} onChange={(lowerCostRationale) => saveDraft(selected.id, { lowerCostRationale, completed: false })} placeholder="Identify lower-cost options and explain the trade-off if they were not selected…" />
                <Field label="Why this action puts the client’s interest first" value={draft.rationale} onChange={(rationale) => saveDraft(selected.id, { rationale, completed: false })} placeholder="Document the recommendation rationale; connect it to suitability separately…" />
                <Field label="Plain-language client explanation" value={draft.clientExplanation} onChange={(clientExplanation) => saveDraft(selected.id, { clientExplanation, completed: false })} placeholder="Summarize what the client should understand about benefits, risks and costs…" />
              </div>

              <div className="assessment-section-title mb-3 mt-7 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">03</span><h4 className="text-sm font-semibold text-on-surface">Evidence and ongoing monitoring</h4></div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Significant-change monitoring plan" value={draft.changeMonitoring} onChange={(changeMonitoring) => saveDraft(selected.id, { changeMonitoring, completed: false })} placeholder="What changes would trigger reassessment, who monitors them and how the advisor is notified…" />
                <Field label="Evidence reviewed" value={draft.evidenceSources} onChange={(evidenceSources) => saveDraft(selected.id, { evidenceSources })} placeholder="Morningstar report date, Fund Facts, prospectus, issuer filing or dealer research reference…" />
                <Field label="Next review date" value={draft.nextReview} onChange={(nextReview) => saveDraft(selected.id, { nextReview, completed: false })} placeholder="" multiline={false} />
              </div>
              <div className="mt-6 flex flex-col gap-3 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><ClipboardCheck className={cn("h-5 w-5", draft.completed ? "text-primary" : "text-on-surface-variant")} /><div><p className="text-sm font-semibold text-on-surface">{draft.completed ? "Assessment attested" : "Ready for advisor attestation"}</p><p className="text-[11px] text-on-surface-variant">{draft.completedAt ? `Recorded ${new Date(draft.completedAt).toLocaleString("en-CA")}. ` : ""}All required evidence and dealer shelf status must be confirmed.</p></div></div><button disabled={!canComplete} onClick={() => saveDraft(selected.id, { completed: !draft.completed, completedAt: draft.completed ? "" : new Date().toISOString() })} className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-40">{draft.completed ? "Reopen assessment" : "Attest assessment"}</button></div>
            </section>
            <p className="border-t border-outline-variant pt-4 text-[10px] leading-5 text-on-surface-variant">BullBrief is a workflow aid-not a compliance determination. Completion does not approve a product or establish suitability. Dealer policies, books-and-records controls, KYC, suitability, conflict management and supervision still apply. Confirm all facts against current issuer disclosure, dealer research and Morningstar Direct.</p>
          </motion.main>
          ) : (
            <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[620px] place-items-center p-8 text-center"><div className="max-w-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><ClipboardCheck className="h-6 w-6" /></div><h2 className="mt-5 font-display text-2xl font-bold text-on-surface">Create your first KYP document</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Search for a Canadian or US stock, fund, or ETF. BullBrief will retrieve available research and open a new assessment record.</p><button onClick={() => setShowNewKyp(true)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-on-primary"><Plus className="h-4 w-4" />New KYP document</button></div></motion.main>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showNewKyp && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 print:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.currentTarget === event.target) setShowNewKyp(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="new-kyp-title" className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-2xl md:p-6" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">New record</p><h2 id="new-kyp-title" className="mt-1 font-display text-2xl font-bold text-on-surface">Start a new KYP document</h2></div>
                <button aria-label="Close" onClick={() => setShowNewKyp(false)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"><X className="h-4 w-4" /></button>
              </div>

              {!manualEntry ? (
                <div className="mt-6">
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-container-low p-1.5">
                    {(["all", "stock", "fund"] as const).map((assetType) => <button key={assetType} onClick={() => { setSearchType(assetType); setSelectedProduct(null); setSearchResults([]); }} className={cn("rounded-lg px-2 py-2.5 text-xs font-bold transition", searchType === assetType ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant")}>{assetType === "all" ? "All products" : assetType === "fund" ? "Funds and ETFs" : "Stocks"}</button>)}
                  </div>

                  <label className="relative mt-4 block"><span className="sr-only">Search Canadian and US products</span><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /><input autoFocus value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setSelectedProduct(null); setSearchResults([]); setSearchingProducts(false); setCreateError(""); }} placeholder="Search company, ticker, fund or series code" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-10 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />{searchingProducts && <RefreshCw className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}</label>

                  {selectedProduct ? (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"><Check className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-on-surface">{selectedProduct.name}</span><span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-on-surface-variant">{selectedProduct.ticker || "Fund"} · {selectedProduct.exchange} {selectedProduct.currency ? `· ${selectedProduct.currency}` : ""}</span></span><button onClick={() => setSelectedProduct(null)} className="text-[11px] font-semibold text-primary">Change</button></div>
                  ) : searchResults.length > 0 ? (
                    <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-low">
                      {searchResults.map((product) => <button key={`${product.source}-${product.id}`} onClick={() => { setSelectedProduct(product); setCreateError(""); }} className="flex w-full items-center gap-3 border-b border-outline-variant px-3.5 py-3 text-left transition last:border-0 hover:bg-surface-container-high"><span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest font-mono text-[10px] font-bold text-primary">{product.ticker || "FUND"}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-on-surface">{product.name}</span><span className="mt-0.5 block text-[10px] uppercase tracking-wide text-on-surface-variant">{product.assetType === "fund" ? "Fund or ETF" : "Stock"} · {product.exchange} {product.currency ? `· ${product.currency}` : ""}</span></span></button>)}
                    </div>
                  ) : searchTerm.trim().length >= 2 && !searchingProducts ? (
                    <div className="mt-4 rounded-xl border border-dashed border-outline-variant p-4 text-center"><p className="text-sm font-semibold text-on-surface">No Canada or US match found</p><p className="mt-1 text-xs text-on-surface-variant">Try the legal product name, ticker, or exact fund series code.</p></div>
                  ) : null}

                  <button onClick={() => { setManualEntry(true); setSearchResults([]); setSearchingProducts(false); setCreateError(""); }} className="mt-4 text-xs font-semibold text-on-surface-variant underline decoration-outline-variant underline-offset-4 hover:text-on-surface">Product not listed? Enter it manually</button>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-on-surface">Manual product entry</p><p className="mt-1 text-[11px] text-on-surface-variant">Use only after searching the provider listings.</p></div><button onClick={() => { setManualEntry(false); setCreateError(""); }} className="text-xs font-semibold text-primary">Back to search</button></div>
                  <div className="mt-4 grid grid-cols-2 gap-2">{(["stock", "fund"] as const).map((assetType) => <button key={assetType} onClick={() => setNewProduct((current) => ({ ...current, assetType }))} className={cn("rounded-lg px-3 py-2.5 text-xs font-bold capitalize transition", newProduct.assetType === assetType ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant")}>{assetType === "fund" ? "Fund or ETF" : "Stock"}</button>)}</div>
                  <div className="mt-4 space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-on-surface">Official product name</span><input value={newProduct.requestedName} onChange={(event) => setNewProduct((current) => ({ ...current, requestedName: event.target.value }))} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label><div className={cn("grid gap-4", newProduct.assetType === "stock" && "sm:grid-cols-[1fr_150px]")}><label className="block"><span className="mb-1.5 block text-xs font-semibold text-on-surface">Identifier</span><input value={newProduct.identifier} onChange={(event) => setNewProduct((current) => ({ ...current, identifier: event.target.value }))} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 font-mono text-sm uppercase text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>{newProduct.assetType === "stock" && <label className="block"><span className="mb-1.5 block text-xs font-semibold text-on-surface">Exchange</span><span className="relative block"><select value={newProduct.exchange} onChange={(event) => setNewProduct((current) => ({ ...current, exchange: event.target.value }))} className="h-12 w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest py-2.5 pl-4 pr-11 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"><option>TSX</option><option>TSXV</option><option>NASDAQ</option><option>NYSE</option><option>CSE</option></select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></span></label>}</div></div>
                </div>
              )}

              {createError && <p className="mt-3 text-xs font-semibold text-error">{createError}</p>}
              <div className="mt-6 flex justify-end gap-2"><button onClick={() => setShowNewKyp(false)} className="rounded-full border border-outline-variant px-4 py-2.5 text-xs font-semibold text-on-surface">Cancel</button><button onClick={createKyp} disabled={!manualEntry && !selectedProduct} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" /> Create KYP document</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {selected && <KypPrintReport record={selected} draft={draft} identity={reportIdentity} history={priceHistory} />}
    </div>
  );
}
