"use client";
import { transientDraftStorage } from "@/lib/privacy/transient-drafts";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Search, ShieldCheck, RefreshCw } from "lucide-react";
import { archiveInputSchema, categories, presets, compileRationale, metric, type ReviewAssetType, type ReviewResearch, type ReviewProduct } from "@/lib/kyp-review/model";

type Saved = { id: string; sha256: string; createdAt: string };
type Archived = Saved & { symbol: string };
const initialForm = { advisorName: "", firmName: "", regulatorId: "", presetIds: [] as string[], evidence: {} as Record<string, string>, customNotes: "", alternativesReason: "", evidenceSources: "", confirmed: false };
import { formControlClass as fieldClass, primaryControlClass as actionClass } from "@/lib/workspace-controls";
async function api(url: string, body?: unknown) {
  const response = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "The request could not be completed.");
  return payload;
}
function ProductMetric({ label, values }: { label: string; values: string[] }) {
  return <tr className="border-t border-outline-variant"><th scope="row" className="px-4 py-4 text-left text-xs font-medium text-on-surface-variant">{label}</th>{values.map((value, i) => <td key={i} className={`px-4 py-4 text-sm ${i === 0 ? "bg-primary/5 font-semibold" : ""}`}>{value}</td>)}</tr>;
}
export function KypReviewWizard() {
  const [step, setStep] = useState(0);
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState<ReviewAssetType>("etf");
  const [market, setMarket] = useState<"CA" | "US">("CA");
  const [category, setCategory] = useState("");
  const [peerOne, setPeerOne] = useState(""); const [peerTwo, setPeerTwo] = useState("");
  const [research, setResearch] = useState<ReviewResearch | null>(null);
  const [researchId, setResearchId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [archives, setArchives] = useState<Archived[]>([]);
  const [archiveError, setArchiveError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [storageKey, setStorageKey] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const update = (change: Partial<typeof initialForm>) => { setForm(current => ({ ...current, ...change })); setSaved(null); setRequestId(crypto.randomUUID()); };
  const loadArchives = async () => { try { const result = await api("/api/kyp/review/archive"); setArchives(result.data); setArchiveError(""); } catch (e) { setArchiveError(e instanceof Error ? e.message : "Archive unavailable."); } };
  useEffect(() => {
    let cancelled = false;
    void api("/api/auth/session").then(result => {
      if (cancelled || !result.user) return;
      const key = `bullbrief:kyp-review-draft:v1:${result.user.id}`;
      setStorageKey(key);
      try {
        const stored = transientDraftStorage.getItem(key);
        if (stored) {
          const draft = JSON.parse(stored);
          if (draft.form && typeof draft.symbol === "string") {
            setForm({ ...initialForm, ...draft.form, confirmed: false }); setSymbol(draft.symbol); setAssetType(draft.assetType || "etf"); setMarket(draft.market || "CA"); setCategory(draft.category || "");
          }
        } else setForm(current => ({ ...current, advisorName: result.user.name || "" }));
      } catch { /* A damaged browser draft must not prevent a new review. */ }
      setDraftReady(true);
    }).catch(() => { setDraftReady(true); });
    const timer = window.setTimeout(() => void loadArchives(), 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);
  useEffect(() => {
    if (!draftReady || !storageKey) return;
    try { transientDraftStorage.setItem(storageKey, JSON.stringify({ form, symbol, assetType, market, category })); } catch { /* Server archive remains the durable record. */ }
  }, [draftReady, storageKey, form, symbol, assetType, market, category]);
  async function fetchResearch() {
    setBusy(true); setError(""); setSaved(null); setResearch(null); setResearchId("");
    try {
      if ((peerOne && !peerTwo) || (!peerOne && peerTwo)) throw new Error("Enter both alternative symbols, or leave both blank for category suggestions.");
      const result = await api("/api/kyp/review/research", { symbol, assetType, market, ...(category ? { category } : {}), ...(peerOne && peerTwo ? { alternatives: [peerOne, peerTwo] } : {}) });
      setResearch(result.data); setResearchId(result.researchId); setStep(1); setRequestId(crypto.randomUUID()); setForm(current => ({ ...current, confirmed: false }));
    } catch (e) { setError(e instanceof Error ? e.message : "Research could not be fetched."); }
    finally { setBusy(false); }
  }
  async function archive() {
    setError("");
    const input = archiveInputSchema.safeParse({ ...form, researchId, requestId });
    if (!input.success) { setError(input.error.issues[0].message); return; }
    setBusy(true);
    try { const result = await api("/api/kyp/review/archive", input.data); setSaved(result); void loadArchives(); }
    catch (e) { setError(e instanceof Error ? e.message : "Archiving failed. Your draft is still available."); }
    finally { setBusy(false); }
  }
  const products: ReviewProduct[] = research ? [research.target, ...research.alternatives] : [];
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-5 border-b border-outline-variant pb-7 md:flex-row md:items-end">
      <div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-primary"><ShieldCheck size={15} /> Know your product · Advisor review</div><h2 className="font-display text-3xl font-bold italic text-on-surface md:text-4xl">A clear decision. A record to support it.</h2><p className="mt-3 text-sm leading-6 text-on-surface-variant">Research the exact instrument, compare reasonable alternatives, and document your judgment in a saved review.</p></div>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">NI 31-103 review workflow</span>
    </header>
    <nav aria-label="Review steps" className="grid grid-cols-3 overflow-hidden rounded-xl border border-outline-variant">{["Search & fetch", "Peer comparison", "Advisor rationale"].map((title, i) => <button key={title} disabled={busy || (i > 0 && !research) || (i === 2 && research?.alternatives.length !== 2)} onClick={() => { setStep(i); setError(""); }} aria-current={step === i ? "step" : undefined} className={`flex items-center gap-2 border-r border-outline-variant px-3 py-4 text-left text-xs last:border-0 disabled:opacity-40 md:gap-4 md:px-6 ${step === i ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}><span className="font-mono text-lg">0{i + 1}</span><span className="font-semibold">{title}</span></button>)}</nav>
    {error && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">{error}</p>}
    {step === 0 && <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 md:p-8"><p className="font-mono text-[10px] uppercase tracking-wider text-primary">01 / Identify the product</p><h2 className="mt-2 font-display text-2xl font-bold">Start with the exact security.</h2><p className="mt-2 text-sm text-on-surface-variant">Use the listed ticker or the precise fund series. CUSIPs and dealer fund codes need an instrument match before research.</p>
      <div className="mt-6 flex flex-wrap gap-2">{(["etf", "mutual-fund", "equity"] as const).map(type => <button key={type} aria-pressed={assetType === type} onClick={() => setAssetType(type)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${assetType === type ? "border-primary bg-primary/10 text-primary" : "border-outline-variant"}`}>{type === "etf" ? "ETF" : type === "mutual-fund" ? "Mutual fund" : "Equity"}</button>)}</div>
      <form onSubmit={event => { event.preventDefault(); void fetchResearch(); }} className="mt-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]"><label className="form-field">Ticker / exact fund symbol<input required value={symbol} onChange={e => setSymbol(e.target.value)} placeholder={assetType === "mutual-fund" ? "Exact Yahoo fund-series symbol" : market === "CA" ? "e.g. XIU or TD.TO" : "e.g. GOOG"} className={fieldClass} /></label><label className="form-field">Listing market<select value={market} onChange={e => setMarket(e.target.value as "CA" | "US")} className={fieldClass}><option value="CA">Canada · TSX</option><option value="US">United States</option></select></label><button disabled={busy || !symbol.trim()} className={`${actionClass} self-end`} type="submit">{busy ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />} {busy ? "Fetching evidence" : "Fetch product"}</button></div>
        <p className="text-xs text-on-surface-variant">Canada adds .TO only to unsuffixed ETF and equity tickers. Existing suffixes and mutual-fund symbols stay intact. Quotes may be delayed. Yahoo expense ratios are not independently verified Canadian MERs.</p>
        <details className="border-t border-outline-variant pt-4"><summary className="cursor-pointer text-xs font-semibold">Comparison category or specific alternatives</summary><div className="mt-4 grid gap-4 md:grid-cols-3"><label className="space-y-2 text-xs">Category override<select value={category} onChange={e => setCategory(e.target.value)} className={fieldClass}><option value="">Use source category / benchmark mapping</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label className="space-y-2 text-xs">Alternative 1<input value={peerOne} onChange={e => setPeerOne(e.target.value.toUpperCase())} placeholder="Exact symbol, e.g. XIC.TO" className={fieldClass} /></label><label className="space-y-2 text-xs">Alternative 2<input value={peerTwo} onChange={e => setPeerTwo(e.target.value.toUpperCase())} placeholder="Exact symbol, e.g. VCN.TO" className={fieldClass} /></label></div></details>
      </form></section>}
    {step === 1 && research && <section className="form-stack"><div><p className="font-mono text-[10px] uppercase tracking-wider text-primary">02 / Reasonable alternatives</p><h2 className="mt-2 font-display text-2xl font-bold">Compare the decision, including its costs.</h2><p className="mt-2 text-sm text-on-surface-variant">{research.categoryBasis}</p></div>
      <div className="overflow-x-auto rounded-xl border border-outline-variant"><table className="w-full min-w-[660px]"><thead><tr><th className="w-1/4 px-4 py-5 text-left text-xs text-on-surface-variant">Evidence snapshot</th>{products.map((p, i) => <th key={p.symbol} className={`w-1/4 px-4 py-5 text-left ${i === 0 ? "bg-primary/5" : ""}`}><span className="font-mono text-[9px] uppercase tracking-wider text-primary">{i === 0 ? "Selected product" : `Alternative ${i}`}</span><span className="mt-2 block text-lg font-bold">{p.symbol}</span><span className="mt-1 block text-xs font-normal leading-5">{p.name}</span></th>)}</tr></thead><tbody>
        <ProductMetric label="Product structure" values={products.map(p => p.type)} /><ProductMetric label="Currency / exchange" values={products.map(p => `${p.currency || "Not available"} / ${p.exchange || "Not available"}`)} /><ProductMetric label="Category" values={products.map(p => p.category || "Not available")} /><ProductMetric label="Reported expense ratio*" values={products.map(p => p.type === "equity" ? "N/A · direct equity" : metric(p.expenseRatio, true))} /><ProductMetric label="Beta · not a risk rating" values={products.map(p => metric(p.beta))} /><ProductMetric label="3-year average return" values={products.map(p => metric(p.return3Y, true))} /><ProductMetric label="Trailing annual dividend yield" values={products.map(p => metric(p.dividendYield, true))} /><ProductMetric label="Reference price · delayed" values={products.map(p => `${p.price?.toFixed(2) || "Not available"} ${p.currency || ""}`)} />
      </tbody></table></div>
      <p className="text-xs text-on-surface-variant">* Confirm current MER, trading expenses, sales charges and account-level costs against issuer and dealer disclosure. Unavailable fields are not zero.</p>
      {[...research.warnings, ...new Set(products.flatMap(p => p.warnings))].map(w => <p key={w} className="border-l-2 border-warning pl-3 text-xs leading-5 text-on-surface-variant">{w}</p>)}
      <div className="grid gap-3 md:grid-cols-3">{products.map(p => <a key={p.symbol} href={p.sourceUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-outline-variant p-4 text-xs"><strong>{p.symbol} · Yahoo Finance ↗</strong><span className="mt-2 block text-on-surface-variant">Retrieved {new Date(p.retrievedAt).toLocaleString("en-CA")}</span><span className="mt-1 block text-on-surface-variant">Market {p.marketAsOf ? new Date(p.marketAsOf).toLocaleString("en-CA") : "timestamp unavailable"}</span></a>)}</div>
      <label className="form-field">Why these alternatives are reasonable for this client<textarea value={form.alternativesReason} onChange={e => update({ alternativesReason: e.target.value })} rows={3} placeholder="Confirm dealer shelf availability, comparable mandate, currency, share class, and why these are reasonable alternative actions." className={fieldClass} /></label>
      <div className="form-actions"><button onClick={() => setStep(0)} className="flex items-center gap-2 text-xs font-semibold"><ArrowLeft size={15} /> Change product or alternatives</button><button disabled={research.alternatives.length !== 2 || form.alternativesReason.trim().length < 20} onClick={() => setStep(2)} className={actionClass}>Build rationale <ArrowRight size={15} /></button></div>
    </section>}
    {step === 2 && research && <section className="form-stack"><div><p className="font-mono text-[10px] uppercase tracking-wider text-primary">03 / Advisor rationale</p><h2 className="mt-2 font-display text-2xl font-bold">Make the reasoning specific.</h2><p className="mt-2 text-sm text-on-surface-variant">Select the considerations you assessed. Add supporting evidence and client context before saving a permanent review.</p></div>
      <div className="grid gap-4 md:grid-cols-3">{([['advisorName', 'Advisor name'], ['firmName', 'Firm name'], ['regulatorId', 'Regulator ID (optional)']] as const).map(([key, label]) => <label key={key} className="form-field">{label}<input value={form[key]} onChange={e => update({ [key]: e.target.value })} className={fieldClass} /></label>)}</div>
      <div className="grid items-start gap-6 xl:grid-cols-2"><div className="space-y-3">{presets.map(p => { const selected = form.presetIds.includes(p.id); return <div key={p.id} className={`rounded-xl border p-4 ${selected ? "border-primary/50 bg-primary/5" : "border-outline-variant"}`}><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={selected} onChange={() => update({ presetIds: selected ? form.presetIds.filter(id => id !== p.id) : [...form.presetIds, p.id] })} className="mt-1 accent-primary" /><span><span className="font-mono text-[9px] uppercase tracking-wide text-on-surface-variant">{p.group} · {p.id}</span><strong className="mt-1 block text-sm">{p.title}</strong><span className="mt-2 block text-xs leading-5 text-on-surface-variant">{p.text}</span></span></label>{selected && <label className="mt-4 block space-y-2 text-xs font-semibold">Supporting evidence for {p.id}<textarea rows={3} value={form.evidence[p.id] || ""} onChange={e => update({ evidence: { ...form.evidence, [p.id]: e.target.value } })} placeholder="Cite the source, date, figures and limitations supporting this statement." className={fieldClass} /></label>}</div>; })}</div>
        <div className="space-y-5"><label className="form-field">Client-specific context<textarea rows={6} value={form.customNotes} onChange={e => update({ customNotes: e.target.value })} placeholder="Record objectives, horizon, capacity for loss, portfolio impact and why this action is reasonable. Use a client reference instead of unnecessary personal details." className={fieldClass} /></label><label className="form-field">Evidence reviewed<textarea rows={4} value={form.evidenceSources} onChange={e => update({ evidenceSources: e.target.value })} placeholder="Issuer Fund Facts/prospectus, disclosure dates, dealer research, KYC reference and any unavailable metrics requiring follow-up." className={fieldClass} /></label>
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5"><p className="font-mono text-[10px] uppercase tracking-wide text-primary">Compiled rationale · preview</p><p className="mt-4 whitespace-pre-wrap text-xs leading-6">{form.presetIds.length ? compileRationale(form.presetIds, form.evidence, form.customNotes) : "Select a consideration to begin your rationale."}</p></div>
        </div></div>
      <label className="flex items-start gap-3 rounded-xl border border-outline-variant p-5 text-xs leading-6"><input type="checkbox" checked={form.confirmed} onChange={e => update({ confirmed: e.target.checked })} className="mt-1.5 accent-primary" /><span>I confirm the exact instrument and series, dealer availability, the alternatives reviewed, and the accuracy of my recorded evidence. I have addressed unavailable data and client-specific risks. This record supports my review and does not replace firm approval, KYC, suitability or supervision.</span></label>
      <div className="form-actions"><button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-semibold"><ArrowLeft size={15} /> Back to comparison</button><button onClick={() => void archive()} disabled={busy || !form.confirmed || !!saved} className={actionClass}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={15} />}{busy ? "Saving review" : saved ? "Review archived" : "Archive review"}</button></div>
      {saved && <div role="status" className="rounded-xl border border-primary/40 bg-primary/5 p-5"><p className="flex items-center gap-2 font-semibold text-primary"><Check size={17} /> Review saved to your archive</p><p className="mt-2 break-all font-mono text-[10px] text-on-surface-variant">{saved.id} · {new Date(saved.createdAt).toLocaleString("en-CA")}<br />SHA-256 {saved.sha256}</p><div className="mt-4 flex flex-wrap gap-4"><a href={`/api/kyp/review/archive/${saved.id}`} className={actionClass}><Download size={15} /> Download PDF</a><a href={`/api/kyp/review/archive/${saved.id}?format=json`} target="_blank" rel="noreferrer" className="py-3 text-xs font-semibold text-primary">Verify saved snapshot ↗</a></div><p className="mt-3 text-xs text-on-surface-variant">The saved record cannot be edited in the app. Create a new review for corrections. The PDF itself is not a digitally signed or legally certified document.</p></div>}
    </section>}
    <section className="border-t border-outline-variant pt-6"><div className="flex justify-between gap-3"><h2 className="text-sm font-semibold">Saved review archive</h2><button onClick={() => void loadArchives()} className="text-xs text-primary">Refresh archive</button></div>{archiveError ? <p role="alert" className="mt-3 text-xs text-error">{archiveError}</p> : !archives.length ? <p className="mt-3 text-xs text-on-surface-variant">Your archived reviews will appear here. Browser drafts are separate from saved reviews.</p> : <div className="mt-3 divide-y divide-outline-variant">{archives.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><span><strong>{r.symbol}</strong><span className="ml-3 text-on-surface-variant">{new Date(r.createdAt).toLocaleString("en-CA")}</span></span><div className="flex gap-4"><a href={`/api/kyp/review/archive/${r.id}?format=json`} target="_blank" rel="noreferrer" className="text-on-surface-variant">Verify snapshot</a><a href={`/api/kyp/review/archive/${r.id}`} className="font-semibold text-primary">Download PDF</a></div></div>)}</div>}</section>
    <p className="text-[11px] leading-5 text-on-surface-variant">Rationale templates are drafting aids, not compliance-vetted legal statements. Two suggested products do not establish an adequate alternatives review for every client or product. Review current <a href="https://www.ciro.ca/firms/current-members/dealer-compliance/client-focused-reforms-cfrs" target="_blank" rel="noreferrer" className="underline">CFR guidance</a> and your dealer’s policies.</p>
  </div>;
}
