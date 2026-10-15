"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  ClipboardCheck,
  FileDown,
  FileSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { normalizeExtractedProducts, uploadedDocumentTitle, type ExtractedFundFactsheet, type KypAssetType, type KypHolding, type KypProductRecord } from "@/lib/kyp";
import { formatPrice } from "@/lib/types";
import { KypResearchReport } from "@/components/kyp/kyp-research-report";
import { KypPrintReport } from "@/components/kyp/kyp-print-report";
import { ADVISOR_ROSTER_EVENT, ADVISOR_ROSTER_KEY, INSTITUTION_BRAND_KEY } from "@/lib/institution-brand";
import { deleteKypSourcePdf, getKypSourcePdf, saveKypSourcePdf } from "@/lib/kyp-source-pdf";

type Filter = "all" | "fund" | "stock" | "review";
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
  templateFields: Record<string, string>;
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
  templateFields: {},
  completed: false,
  completedAt: "",
};
const STORAGE_KEY = "bullbrief:kyp-drafts:v2";
const CUSTOM_HOLDINGS_KEY = "bullbrief:kyp-custom-holdings:v1";
const REPORT_IDENTITY_KEY = "bullbrief:report-identity:v1";
const FACTSHEET_OVERRIDES_KEY = "bullbrief:kyp-factsheet-overrides:v1";
const DEMO_ADVISORS = ["Katherine Vorobiev", "Alex Morgan", "Jordan Lee", "Priya Shah", "Michael Chen"];
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
];
const AI_ASSESSMENT_FIELDS: Array<keyof Draft> = [
  "structure", "risk", "costs", "liquidityComplexity", "conflicts", "alternatives",
  "lowerCostRationale", "rationale", "clientExplanation", "changeMonitoring", "evidenceSources",
];

function migrateLegacyAiDraft(draft: Partial<Draft>): Draft {
  const migrated = { ...EMPTY_DRAFT, ...draft, templateFields: { ...(draft.templateFields || {}) } };
  if (/^advisor confirmation required:/i.test(migrated.conflicts)) {
    migrated.conflicts = "Review compensation, proprietary-product, affiliate and other material conflicts, then document how each conflict is addressed in the client's interest.";
  }
  if (/^advisor confirmation required:/i.test(migrated.lowerCostRationale)) {
    migrated.lowerCostRationale = "Compare dealer-approved alternatives with lower product and transaction costs, document the material differences, and explain the client-specific trade-off if a higher-cost option is selected.";
  }
  if (/^advisor confirmation required:/i.test(migrated.rationale)) {
    migrated.rationale = "Document how the proposed action aligns with the client's current KYC information, objectives, time horizon, risk profile, portfolio construction and the reasonable alternatives considered. The product PDF supports the product analysis but does not establish suitability.";
  }
  for (const field of AI_ASSESSMENT_FIELDS) {
    const value = migrated[field];
    if (typeof value === "string") migrated[field] = value.replace(/advisor confirmation (?:is )?required:?\s*/gi, "").trim() as never;
  }
  if (migrated.reviewContext === "confirmation-required") migrated.reviewContext = "document-review";
  return migrated;
}

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

async function logoAsPng(dataUrl: string) {
  if (!dataUrl) return "";
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image(); element.onload = () => resolve(element); element.onerror = reject; element.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
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
  const [reportIdentity, setReportIdentity] = useState({ name: "", institutionLogo: "" });
  const [advisorRoster, setAdvisorRoster] = useState<string[]>([]);
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; close: number; volume: number }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [factsheetLoading, setFactsheetLoading] = useState(false);
  const [factsheetError, setFactsheetError] = useState("");
  const [factsheetUploading, setFactsheetUploading] = useState(false);
  const [factsheetOverrides, setFactsheetOverrides] = useState<Record<string, KypProductRecord["uploadedFactsheet"]>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(FACTSHEET_OVERRIDES_KEY) || "{}"); } catch { return {}; }
  });
  const [pendingFactsheet, setPendingFactsheet] = useState<{ data: ExtractedFundFactsheet; products?: ExtractedFundFactsheet[]; source: { fileName: string; pageCount: number; extractedCount: number } } | null>(null);
  const [pendingSourcePdf, setPendingSourcePdf] = useState<File | null>(null);
  const [factsheetCreateMode, setFactsheetCreateMode] = useState(false);
  const [combinedPdfLoading, setCombinedPdfLoading] = useState(false);
  const [aiAssessmentLoading, setAiAssessmentLoading] = useState(false);
  const [aiAssessmentMessage, setAiAssessmentMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, Partial<Draft>>;
        const migrated = Object.fromEntries(Object.entries(stored).map(([id, draft]) => [id, migrateLegacyAiDraft(draft)]));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        setDrafts(migrated);
      } catch {
        setDrafts({});
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadRoster = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(ADVISOR_ROSTER_KEY) || "[]");
        const names = Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
        setAdvisorRoster(Array.from(new Set([reportIdentity.name, ...names, ...DEMO_ADVISORS].filter(Boolean))));
      } catch { setAdvisorRoster(Array.from(new Set([reportIdentity.name, ...DEMO_ADVISORS].filter(Boolean)))); }
    };
    loadRoster();
    const updateRoster = (event: Event) => {
      const detail = (event as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setAdvisorRoster(Array.from(new Set([reportIdentity.name, ...detail, ...DEMO_ADVISORS].filter(Boolean))));
    };
    window.addEventListener(ADVISOR_ROSTER_EVENT, updateRoster);
    return () => window.removeEventListener(ADVISOR_ROSTER_EVENT, updateRoster);
  }, [reportIdentity.name]);

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
    void deleteKypSourcePdf(id);
  };

  const baseItems: KypProductRecord[] = records.length ? records : allHoldings.map((holding): KypProductRecord => ({
    ...holding,
    status: "not_found" as const,
    asOf: "",
    identity: { performanceId: null, name: null, ticker: holding.symbol || null, exchange: holding.exchange || null },
    facts: { price: null, changePercent: null, currency: null, sector: null, industry: null, pe: null, priceToBook: null, priceToSales: null, priceToCashFlow: null, dividendYield: null, fairValue: null, starRating: null, economicMoat: null, marketCap: null, volume: null, averageVolume: null, fiftyTwoWeekLow: null, fiftyTwoWeekHigh: null, bid: null, ask: null },
    morningstar: { profileDescription: null, styleBox: null, employees: null, website: null, cusip: null, isin: null, analystReportTitle: null, analystName: null, reportPublishedAt: null, reportUpdatedAt: null, ratingAsOf: null, evaluatedPrice: null, fairValueAsOf: null, fairValueCurrency: null, fairValueUncertainty: null, oneStarPrice: null, twoStarPrice: null, fourStarPrice: null, fiveStarPrice: null, forwardDividendYield: null, totalYield: null, dividendMonths: [], returnOnAssets: null, returnOnEquity: null, returnOnCapital: null, quickRatio: null, currentRatio: null, interestCoverage: null, sharesOutstanding: null, competitors: [], availableComponents: [], lockedComponents: [], requestStatus: "unavailable" as const, retrievedAt: null },
  }));
  const items = baseItems.map((item) => {
    const originalUpload = factsheetOverrides[item.id];
    const storedComparison = originalUpload?.comparisonProducts?.length ? normalizeExtractedProducts(originalUpload.comparisonProducts) : [];
    const siblingUploads = originalUpload?.fileName ? normalizeExtractedProducts(Object.values(factsheetOverrides).filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate && candidate.fileName === originalUpload.fileName))) : [];
    const comparisonProducts = storedComparison.length > 1 ? storedComparison : siblingUploads;
    const uploaded = originalUpload && comparisonProducts.length > 1 ? {
      ...originalUpload,
      productName: `${comparisonProducts.length} security comparison`,
      ticker: comparisonProducts.map((candidate) => candidate.ticker || candidate.fundCode).filter(Boolean).join(" / "),
      comparisonProducts,
    } : originalUpload;
    if (!uploaded) return item;
    return {
      ...item,
      status: "verified" as const,
      asOf: uploaded.asOfDate || uploaded.extractedAt,
      identity: { ...item.identity, name: uploaded.productName || item.identity.name, ticker: uploaded.fundCode || uploaded.ticker || uploaded.cusip || uploaded.isin || item.identity.ticker },
      facts: { ...item.facts, price: uploaded.currentPrice ?? item.facts.price, currency: uploaded.currency || item.facts.currency, sector: uploaded.sector || item.facts.sector, pe: uploaded.peRatio ?? item.facts.pe, dividendYield: uploaded.dividendYield ?? item.facts.dividendYield, fairValue: uploaded.fairValue ?? item.facts.fairValue, fiftyTwoWeekLow: uploaded.fiftyTwoWeekLow ?? item.facts.fiftyTwoWeekLow, fiftyTwoWeekHigh: uploaded.fiftyTwoWeekHigh ?? item.facts.fiftyTwoWeekHigh, starRating: uploaded.morningstarRating ?? item.facts.starRating },
      morningstar: { ...item.morningstar, cusip: uploaded.cusip || item.morningstar.cusip, isin: uploaded.isin || item.morningstar.isin, profileDescription: uploaded.businessDescription || uploaded.investmentObjective || item.morningstar.profileDescription, returnOnAssets: uploaded.returnOnAssets ?? item.morningstar.returnOnAssets, returnOnEquity: uploaded.returnOnEquity ?? item.morningstar.returnOnEquity },
      uploadedFactsheet: uploaded,
    };
  }).filter((item, index, all) => {
    const fileName = item.uploadedFactsheet?.fileName;
    if (!fileName || (item.uploadedFactsheet?.comparisonProducts?.length || 0) <= 1) return true;
    return all.findIndex((candidate) => candidate.uploadedFactsheet?.fileName === fileName) === index;
  });

  const selected = items.find((item) => item.id === selectedId) || items[0];
  const draft = { ...EMPTY_DRAFT, ...(selected ? drafts[selected.id] : {}) };
  const completeFields = REQUIRED_FIELDS.filter((field) => Boolean(draft[field])).length;

  const visible = items.filter((item) => {
    const matchesFilter = filter === "all" || item.assetType === filter || (filter === "review" && !drafts[item.id]?.completed);
    const haystack = `${item.requestedName} ${item.symbol || ""} ${item.identity.name || ""}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  });

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

  const downloadFactsheet = async () => {
    if (!selected?.identity.performanceId) return;
    setFactsheetLoading(true);
    setFactsheetError("");
    try {
      const response = await fetch(`/api/kyp/factsheet?performanceId=${encodeURIComponent(selected.identity.performanceId)}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Fund factsheet is unavailable");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `morningstar-factsheet-${selected.identity.performanceId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFactsheetError(error instanceof Error ? error.message : "Fund factsheet is unavailable");
    } finally {
      setFactsheetLoading(false);
    }
  };

  const uploadFactsheet = async (file: File, createMode = false) => {
    if (!createMode && !selected) return;
    setFactsheetCreateMode(createMode);
    setFactsheetUploading(true); setFactsheetError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 35000);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/kyp/upload-factsheet", { method: "POST", body: form, signal: controller.signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The factsheet could not be analyzed.");
      setPendingSourcePdf(file);
      setPendingFactsheet(payload);
    } catch (error) {
      setFactsheetError(error instanceof DOMException && error.name === "AbortError" ? "The analysis timed out. Try again with the original text-based PDF." : error instanceof Error ? error.message : "The factsheet could not be analyzed.");
    } finally { window.clearTimeout(timeout); setFactsheetUploading(false); }
  };

  const requestCombinedPdf = async ({ source, recordId, assetType, productName, identifier, facts, reportDraft }: { source?: File | null; recordId: string; assetType: KypAssetType; productName: string; identifier?: string | null; facts: ExtractedFundFactsheet; reportDraft: Draft }) => {
    setCombinedPdfLoading(true); setFactsheetError("");
    try {
      const sourcePdf = source || await getKypSourcePdf(recordId);
      if (!sourcePdf) throw new Error("Re-upload the original Morningstar PDF to create the combined document.");
      let companyName = "";
      try { companyName = JSON.parse(localStorage.getItem(INSTITUTION_BRAND_KEY) || "{}").companyName || ""; } catch {}
      const institutionLogo = await logoAsPng(reportIdentity.institutionLogo).catch(() => "");
      const form = new FormData();
      form.append("source", sourcePdf);
      form.append("payload", JSON.stringify({
        assetType,
        productName,
        identifier,
        advisorName: reportIdentity.name,
        companyName,
        institutionLogo,
        generatedAt: new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }),
        sourceFileName: sourcePdf.name,
        draft: reportDraft,
        facts,
      }));
      const response = await fetch("/api/kyp/combined-pdf", { method: "POST", body: form });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "The combined PDF could not be generated.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const downloadName = productName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "product";
      anchor.download = `${/kyp$/i.test(downloadName) ? downloadName : `${downloadName}-KYP`}.pdf`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (error) { setFactsheetError(error instanceof Error ? error.message : "The combined PDF could not be generated."); }
    finally { setCombinedPdfLoading(false); }
  };

  const fillAssessmentWithAi = async () => {
    if (!selected?.uploadedFactsheet) {
      setAiAssessmentMessage("Upload and analyze a product PDF first.");
      return;
    }
    if (AI_ASSESSMENT_FIELDS.some((field) => typeof draft[field] === "string" && Boolean(draft[field].trim())) && !window.confirm("Replace the current assessment text with an AI draft based on the uploaded PDF? Review every answer before using it.")) return;
    setAiAssessmentLoading(true);
    setAiAssessmentMessage("");
    try {
      const response = await fetch("/api/kyp/ai-assessment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: selected.uploadedFactsheet.fileName,
          facts: selected.uploadedFactsheet,
          products: selected.uploadedFactsheet.comparisonProducts,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The AI assessment draft could not be completed.");
      const generated = payload.data as Partial<Draft>;
      setDrafts((current) => {
        const nextDraft = { ...EMPTY_DRAFT, ...current[selected.id], completed: false, completedAt: "" };
        for (const field of AI_ASSESSMENT_FIELDS) {
          const value = generated[field];
          if (typeof value === "string" && value.trim()) nextDraft[field] = value.trim() as never;
        }
        if (!nextDraft.reviewContext || nextDraft.reviewContext === "confirmation-required") nextDraft.reviewContext = "document-review";
        if (!nextDraft.firmApproval) nextDraft.firmApproval = "not-confirmed";
        const next = { ...current, [selected.id]: nextDraft };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setAiAssessmentMessage("AI draft added. Review and edit every answer before using the record.");
    } catch (error) {
      setAiAssessmentMessage(error instanceof Error ? error.message : "The AI assessment draft could not be completed.");
    } finally {
      setAiAssessmentLoading(false);
    }
  };

  const applyFactsheet = async (openPdf = false) => {
    if (!pendingFactsheet) return;
    const uploadedTitle = uploadedDocumentTitle(pendingFactsheet.source.fileName);
    const extractedProducts = normalizeExtractedProducts(pendingFactsheet.products?.length ? pendingFactsheet.products : [pendingFactsheet.data]);
    const makeDraft = (data: ExtractedFundFactsheet, targetId: string): Draft => {
      const assetType: KypAssetType = data.assetType === "stock" ? "stock" : "fund";
      const structure = assetType === "stock"
        ? [data.businessDescription, data.sector ? `Industry: ${data.sector}.` : "", data.profitability].filter(Boolean).join("\n\n")
        : [data.investmentObjective, data.investmentStrategy].filter(Boolean).join("\n\n");
      const costs = assetType === "stock"
        ? "No product-level MER or management fee is stated in the uploaded report. Confirm trading commissions, spreads, dealer fees and account charges."
        : [data.mer != null ? `MER: ${data.mer}%` : "", data.managementFee != null ? `Management fee: ${data.managementFee}%` : ""].filter(Boolean).join(". ");
      const risk = [data.specificRisks, data.riskMeasure].filter(Boolean).join(" ");
      const clientExplanation = [data.businessDescription || data.investmentObjective, data.historicalPerformance, risk, costs].filter(Boolean).join("\n\n");
      return { ...EMPTY_DRAFT, ...(drafts[targetId] || {}),
        structure: structure || "Not stated in the uploaded factsheet. Advisor review required.",
        risk: risk || "Not stated in the uploaded factsheet. Advisor review required.",
        costs: costs || "Not stated in the uploaded factsheet. Advisor review required.",
        liquidityComplexity: data.liquidity || (assetType === "stock" ? "Exchange-traded equity. Confirm current trading volume, spread and settlement before recommendation." : "Confirm liquidity, redemption, settlement and product complexity against current issuer disclosure."),
        conflicts: "Advisor must document compensation, proprietary-product and affiliate conflicts separately.",
        alternatives: data.comparables || "Advisor must compare a reasonable range of dealer-available alternatives.",
        lowerCostRationale: "Advisor must identify and assess lower-cost alternatives before completing this record.",
        rationale: "Advisor must document the client-specific recommendation rationale. It cannot be determined from a product factsheet.",
        clientExplanation: clientExplanation || "Advisor must prepare a plain-language explanation of product benefits, risks and costs.",
        changeMonitoring: "Monitor issuer notices, material product changes, fees, risk classification, strategy, manager changes and dealer shelf status.",
        evidenceSources: `${pendingFactsheet.source.fileName}, ${pendingFactsheet.source.pageCount} pages, analyzed ${new Date().toLocaleDateString("en-CA")}`,
        completed: false,
      };
    };
    if (extractedProducts.length > 1) {
      const tickers = extractedProducts.map((product) => product.ticker || product.fundCode).filter(Boolean);
      const names = extractedProducts.map((product) => product.productName).filter(Boolean);
      const holding: KypHolding = factsheetCreateMode
        ? { id: `custom-${crypto.randomUUID()}`, requestedName: uploadedTitle, searchQuery: tickers.join(" "), assetType: extractedProducts[0].assetType === "fund" ? "fund" : "stock", ...(extractedProducts[0].assetType === "stock" ? { symbol: tickers[0] || "", exchange: extractedProducts[0].primaryExchange || "" } : {}) }
        : selected || { id: `custom-${crypto.randomUUID()}`, requestedName: `${tickers.join(", ")} comparison`, searchQuery: tickers.join(" "), assetType: "stock" };
      const facts = { ...extractedProducts[0], comparisonProducts: extractedProducts, productName: uploadedTitle, ticker: tickers.join(" / "), fileName: pendingFactsheet.source.fileName, pageCount: pendingFactsheet.source.pageCount, extractedAt: new Date().toISOString() };
      const comparisonDraft = { ...makeDraft(extractedProducts[0], holding.id), alternatives: names.slice(1).join("; ") };
      const nextHoldings = factsheetCreateMode ? [...customHoldings, holding].slice(-10) : customHoldings;
      const nextOverrides = { ...factsheetOverrides, [holding.id]: facts };
      const nextDrafts = { ...drafts, [holding.id]: comparisonDraft };
      if (factsheetCreateMode) { setCustomHoldings(nextHoldings); localStorage.setItem(CUSTOM_HOLDINGS_KEY, JSON.stringify(nextHoldings)); }
      setFactsheetOverrides(nextOverrides); localStorage.setItem(FACTSHEET_OVERRIDES_KEY, JSON.stringify(nextOverrides));
      setDrafts(nextDrafts); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts));
      if (pendingSourcePdf) await saveKypSourcePdf(holding.id, pendingSourcePdf);
      const sourceForExport = pendingSourcePdf;
      setSelectedId(holding.id); setShowNewKyp(false); setPendingFactsheet(null); setFactsheetCreateMode(false); setPendingSourcePdf(null);
      if (openPdf) await requestCombinedPdf({ source: sourceForExport, recordId: holding.id, assetType: holding.assetType, productName: uploadedTitle, identifier: tickers.join(" / "), facts, reportDraft: comparisonDraft });
      return;
    }
    let targetId = selected?.id || "";
    if (factsheetCreateMode) {
      const requestedName = uploadedTitle;
      const identifier = pendingFactsheet.data.fundCode || pendingFactsheet.data.ticker || pendingFactsheet.data.cusip || pendingFactsheet.data.isin || `PDF-${crypto.randomUUID()}`;
      const assetType: KypAssetType = pendingFactsheet.data.assetType === "stock" ? "stock" : "fund";
      const holding: KypHolding = { id: `custom-${crypto.randomUUID()}`, requestedName, searchQuery: identifier, assetType, ...(assetType === "stock" ? { symbol: identifier, exchange: pendingFactsheet.data.primaryExchange || "" } : {}) };
      const nextHoldings = [...customHoldings, holding].slice(-10);
      setCustomHoldings(nextHoldings); localStorage.setItem(CUSTOM_HOLDINGS_KEY, JSON.stringify(nextHoldings));
      targetId = holding.id; setSelectedId(targetId); setShowNewKyp(false);
    }
    if (!targetId) return;
    const data = { ...pendingFactsheet.data, productName: uploadedTitle, fileName: pendingFactsheet.source.fileName, pageCount: pendingFactsheet.source.pageCount, extractedAt: new Date().toISOString() };
    const next = { ...factsheetOverrides, [targetId]: data };
    setFactsheetOverrides(next); localStorage.setItem(FACTSHEET_OVERRIDES_KEY, JSON.stringify(next));
    const populatedDraft = makeDraft(data, targetId);
    saveDraft(targetId, populatedDraft);
    if (pendingSourcePdf) await saveKypSourcePdf(targetId, pendingSourcePdf);
    const sourceForExport = pendingSourcePdf;
    const productName = uploadedTitle;
    const identifier = data.fundCode || data.ticker || data.cusip || data.isin;
    setPendingFactsheet(null); setFactsheetCreateMode(false);
    setPendingSourcePdf(null);
    const assetType: KypAssetType = data.assetType === "stock" ? "stock" : factsheetCreateMode ? "fund" : selected?.assetType || "fund";
    if (openPdf) await requestCombinedPdf({ source: sourceForExport, recordId: targetId, assetType, productName, identifier, facts: data, reportDraft: populatedDraft });
  };

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
            <button onClick={() => setShowNewKyp(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-on-primary"><Plus className="h-4 w-4" /> New KYP</button>
            <button onClick={() => window.print()} disabled={!selected || historyLoading} className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"><FileDown className="h-4 w-4" /> {historyLoading ? "Loading report" : "Print record"}</button>
            <button onClick={() => void refresh()} disabled={loading || !items.length} className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-60"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh data</button>
          </div>
        </div>
      </section>

      <div className="kyp-print-document grid min-h-[720px] min-w-0 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-outline-variant lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-outline-variant p-4">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-on-surface">My KYP documents</p><button onClick={() => setShowNewKyp(true)} aria-label="Create KYP document" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"><Plus className="h-4 w-4" /></button></div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-2">
              <Search className="h-4 w-4 text-on-surface-variant" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a KYP document" className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant" />
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
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-on-surface">{item.uploadedFactsheet ? uploadedDocumentTitle(item.uploadedFactsheet.fileName) : item.identity.name || item.requestedName}</span><span className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-on-surface-variant">{item.assetType} · {item.identity.ticker || (item.uploadedFactsheet ? "Source document added" : "Match pending")}</span></span>
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
          <motion.main key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }} className="kyp-report min-w-0 overflow-hidden p-5 md:p-7">
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
                <h2 className="font-display text-2xl font-bold text-on-surface">{selected.uploadedFactsheet ? uploadedDocumentTitle(selected.uploadedFactsheet.fileName) : selected.identity.name || selected.requestedName}</h2>
                <p className="mt-1 font-mono text-xs text-on-surface-variant">{selected.identity.ticker || selected.symbol || "Identifier pending"}{selected.identity.exchange ? ` · ${selected.identity.exchange}` : ""}</p>
                <label className="mt-3 block max-w-xs print:hidden"><span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-on-surface-variant">Prepared by</span><span className="relative block"><select value={reportIdentity.name} onChange={(event) => setReportIdentity((current) => ({ ...current, name: event.target.value }))} className="h-10 w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-low py-2 pl-3 pr-10 text-xs font-semibold text-on-surface outline-none focus:border-primary">{!reportIdentity.name && <option value="">Select advisor</option>}{advisorRoster.map((advisor) => <option key={advisor} value={advisor}>{advisor}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></span></label>
                {selected.assetType === "fund" && selected.identity.performanceId && (
                  <div className="mt-3 print:hidden">
                    <button onClick={() => void downloadFactsheet()} disabled={factsheetLoading} className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-3 py-2 text-[11px] font-semibold text-on-surface transition hover:bg-surface-container-high disabled:opacity-50">
                      <FileDown className="h-3.5 w-3.5" /> {factsheetLoading ? "Retrieving factsheet" : "Download Morningstar factsheet"}
                    </button>
                    {factsheetError && <p className="mt-2 max-w-md text-[10px] leading-4 text-error">{factsheetError}</p>}
                  </div>
                )}
                {(selected.assetType === "fund" || selected.assetType === "stock") && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-on-primary transition hover:brightness-105">
                      {factsheetUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {factsheetUploading ? "Analyzing factsheet" : `Upload ${selected.assetType === "stock" ? "stock" : "fund"} factsheet`}
                      <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={factsheetUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFactsheet(file, false); event.currentTarget.value = ""; }} />
                    </label>
                    {selected.uploadedFactsheet && <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-2 font-mono text-[9px] uppercase tracking-wide text-primary"><FileSearch className="h-3 w-3" /> Factsheet applied</span>}
                    {selected.uploadedFactsheet && <button onClick={() => void requestCombinedPdf({ recordId: selected.id, assetType: selected.assetType, productName: uploadedDocumentTitle(selected.uploadedFactsheet!.fileName), identifier: selected.identity.ticker || selected.identity.performanceId, facts: selected.uploadedFactsheet!, reportDraft: draft })} disabled={combinedPdfLoading || !reportIdentity.name} className="inline-flex items-center gap-2 rounded-full border border-primary px-3 py-2 text-[11px] font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"><FileDown className="h-3.5 w-3.5" />{combinedPdfLoading ? "Building combined PDF" : "Download combined PDF"}</button>}
                    {factsheetError && <p className="w-full text-[10px] leading-4 text-error">{factsheetError}</p>}
                  </div>
                )}
              </div>
              </div>
              <div className="min-w-32 text-left md:text-right"><p className="font-mono text-2xl font-semibold text-on-surface">{selected.facts.price == null ? "-" : `${selected.facts.currency || ""} ${formatPrice(selected.facts.price)}`}</p><p className="text-[10px] uppercase tracking-wide text-on-surface-variant">Current reference price</p></div>
            </div>

            <KypResearchReport
              record={selected}
              recordedAlternatives={draft.alternatives}
              onRecordAlternative={(name) => {
                const entry = `${name}: reviewed as a comparable alternative.`;
                const alternatives = draft.alternatives.includes(name) ? draft.alternatives : [draft.alternatives.trim(), entry].filter(Boolean).join("\n");
                saveDraft(selected.id, { alternatives, completed: false });
              }}
            />

            <section className="border-t border-outline-variant py-6">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px] md:items-end">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Advisor assessment</p><h3 className="mt-1 text-lg font-semibold text-on-surface">Complete the KYP record</h3><p className="mt-1 text-xs text-on-surface-variant">Your judgment stays separate from dealer approval and third-party product data.</p><button onClick={() => void fillAssessmentWithAi()} disabled={aiAssessmentLoading || !selected.uploadedFactsheet} className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-3.5 py-2 text-[11px] font-bold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className={cn("h-3.5 w-3.5", aiAssessmentLoading && "animate-pulse")} />{aiAssessmentLoading ? "Analyzing PDF" : "AI fill assessment"}</button>{aiAssessmentMessage && <p className="mt-2 max-w-xl text-[10px] leading-4 text-on-surface-variant">{aiAssessmentMessage}</p>}</div>
                <div><div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant"><span>Required fields</span><span className="font-mono">{completeFields} of {REQUIRED_FIELDS.length}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completeFields / REQUIRED_FIELDS.length) * 100}%` }} /></div></div>
              </div>
              <div className="mb-6 grid gap-3 md:grid-cols-2">
                <SelectField label="Review trigger" hint="Why this KYP review is being completed." value={draft.reviewContext} onChange={(reviewContext) => saveDraft(selected.id, { reviewContext, completed: false })}>
                  <option value="">Select a context</option>
                  <option value="document-review">PDF-based product review</option>
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
              </div>
            </section>
            <p className="border-t border-outline-variant pt-4 text-[10px] leading-5 text-on-surface-variant">BullBrief is a workflow aid-not a compliance determination. Completion does not approve a product or establish suitability. Dealer policies, books-and-records controls, KYC, suitability, conflict management and supervision still apply. Confirm all facts against current issuer disclosure, dealer research and Morningstar Direct.</p>
          </motion.main>
          ) : (
            <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[620px] place-items-center p-8 text-center"><div className="max-w-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><ClipboardCheck className="h-6 w-6" /></div><h2 className="mt-5 font-display text-2xl font-bold text-on-surface">Create your first KYP document</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Upload the current product PDF. BullBrief will analyze the document, prefill the KYP fields and preserve the source in the final record.</p><button onClick={() => setShowNewKyp(true)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-on-primary"><Plus className="h-4 w-4" />New KYP document</button></div></motion.main>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {pendingFactsheet && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-4 print:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="factsheet-review-title" className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-2xl md:p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Extracted facts</p><h2 id="factsheet-review-title" className="mt-1 font-display text-2xl font-bold text-on-surface">Review before applying</h2><p className="mt-1 text-xs text-on-surface-variant">{pendingFactsheet.source.fileName} · {pendingFactsheet.source.pageCount} pages · {pendingFactsheet.source.extractedCount} fields found</p></div><button aria-label="Close" onClick={() => setPendingFactsheet(null)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"><X className="h-4 w-4" /></button></div>
              {(pendingFactsheet.products?.length || 0) > 1 && <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-4"><p className="text-xs font-bold text-on-surface">{pendingFactsheet.products!.length} securities found</p><div className="mt-2 flex flex-wrap gap-2">{pendingFactsheet.products!.map((product) => <span key={`${product.ticker}-${product.productName}`} className="rounded-full bg-surface-container-lowest px-3 py-1.5 text-[11px] font-semibold text-on-surface">{product.productName} {product.ticker ? `(${product.ticker})` : ""}</span>)}</div><p className="mt-2 text-[11px] leading-5 text-on-surface-variant">BullBrief will create one comparison record and one combined PDF. Product facts remain separated inside the comparison.</p></div>}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">{[
                ["Product", pendingFactsheet.data.productName], ["Fund code", pendingFactsheet.data.fundCode], ["Category", pendingFactsheet.data.category], ["As of", pendingFactsheet.data.asOfDate],
                ["Risk level", pendingFactsheet.data.riskLevel], ["MER", pendingFactsheet.data.mer != null ? `${pendingFactsheet.data.mer}%` : null], ["Management fee", pendingFactsheet.data.managementFee != null ? `${pendingFactsheet.data.managementFee}%` : null], ["Morningstar rating", pendingFactsheet.data.morningstarRating != null ? `${pendingFactsheet.data.morningstarRating} / 5` : null],
                ["3-year return", pendingFactsheet.data.return3Y != null ? `${pendingFactsheet.data.return3Y}%` : null], ["5-year return", pendingFactsheet.data.return5Y != null ? `${pendingFactsheet.data.return5Y}%` : null], ["Manager", pendingFactsheet.data.manager], ["CUSIP / ISIN", pendingFactsheet.data.cusip || pendingFactsheet.data.isin],
              ].filter((row) => row[1]).map(([label, value]) => <div key={label} className="rounded-xl bg-surface-container-low p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-1 text-xs font-semibold text-on-surface">{value}</p></div>)}</div>
              <div className="mt-5 rounded-xl border border-warning/30 bg-warning/10 p-3 text-[11px] leading-5 text-on-surface-variant">Confirm extracted values against the visible source document. Applying the factsheet does not verify dealer approval, suitability or product availability.</div>
              <div className="mt-5 flex flex-wrap justify-end gap-2"><button onClick={() => { setPendingFactsheet(null); setPendingSourcePdf(null); setFactsheetCreateMode(false); }} className="rounded-full border border-outline-variant px-4 py-2.5 text-xs font-semibold">Cancel</button><button onClick={() => void applyFactsheet(false)} className="rounded-full border border-primary px-4 py-2.5 text-xs font-bold text-primary">{factsheetCreateMode ? (pendingFactsheet.products?.length || 0) > 1 ? "Create comparison record" : "Create KYP draft" : "Apply extracted properties"}</button><button onClick={() => void applyFactsheet(true)} disabled={!reportIdentity.name || combinedPdfLoading} className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-40">{combinedPdfLoading ? "Building combined PDF" : (pendingFactsheet.products?.length || 0) > 1 ? "Create and download one PDF" : factsheetCreateMode ? "Create and download combined PDF" : "Apply and download combined PDF"}</button></div>
            </motion.div>
          </motion.div>
        )}
        {showNewKyp && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 print:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.currentTarget === event.target) setShowNewKyp(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="new-kyp-title" className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-2xl md:p-6" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">New record</p><h2 id="new-kyp-title" className="mt-1 font-display text-2xl font-bold text-on-surface">Start a new KYP document</h2></div>
                <button aria-label="Close" onClick={() => setShowNewKyp(false)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"><X className="h-4 w-4" /></button>
              </div>

              <div className="mt-6">
                <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-primary/35 bg-primary/10 p-4 transition hover:border-primary hover:bg-primary/[0.14]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">{factsheetUploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-on-surface">Upload a product PDF</span><span className="mt-1 block text-[11px] leading-4 text-on-surface-variant">BullBrief analyzes the file, prefills the KYP record and preserves the source in the completed report.</span></span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                  <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={factsheetUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFactsheet(file, true); event.currentTarget.value = ""; }} />
                </label>
                {factsheetError && <p className="mt-2 text-[11px] font-semibold text-error">{factsheetError}</p>}
                <p className="mt-4 text-[11px] leading-5 text-on-surface-variant">A readable stock or fund PDF is required to create a new KYP document.</p>
              </div>

              <div className="mt-6 flex justify-end"><button onClick={() => setShowNewKyp(false)} className="rounded-full border border-outline-variant px-4 py-2.5 text-xs font-semibold text-on-surface">Cancel</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {selected && <KypPrintReport record={selected} draft={draft} identity={reportIdentity} history={priceHistory} />}
    </div>
  );
}
