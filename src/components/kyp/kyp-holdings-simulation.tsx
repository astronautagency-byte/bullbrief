"use client";
import { transientDraftStorage } from "@/lib/privacy/transient-drafts";
import { useEffect, useRef, useState } from "react";
import { Check, FileText, Play, RefreshCw, Sparkles, Square, WandSparkles } from "lucide-react";
import { TOP_HOLDINGS } from "@/lib/kyp-top-holdings";
import { defaultRules, sectionKeys, sectionLabels, type NotePattern, type SimulationRun, type SimulationRow } from "@/lib/kyp-simulation/model";
import { planKypDraftFill } from "@/lib/kyp-simulation/bridge";
import { metric } from "@/lib/kyp-review/model";
import { formControlClass as inputClass, primaryControlClass as buttonClass, secondaryControlClass as outlineClass } from "@/lib/workspace-controls";
class SimulationRequestError extends Error {
  constructor(message: string, public status: number, public retryAfterMs: number) { super(message); }
}
async function request(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const result = await res.json();
  if (!res.ok) throw new SimulationRequestError(result.error || "The request could not be completed.", res.status, result.retryAfterMs || 15000);
  return result;
}
function IdentityBadge({ row }: { row: SimulationRow }) {
  return <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${row.identity === "matched" ? "bg-primary/10 text-primary" : row.identity === "mismatch" ? "bg-error/10 text-error" : "bg-warning/10 text-on-surface-variant"}`}>{row.identity === "matched" ? "Identifier matched" : row.identity === "candidate" ? "Candidate match" : row.identity === "mismatch" ? "Identifier mismatch" : "Source documents needed"}</span>;
}
export function KypHoldingsSimulation({ onOpenHolding }: { onOpenHolding: (id: string) => void }) {
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [selectedId, setSelectedId] = useState(TOP_HOLDINGS[0].id);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [query, setQuery] = useState(""); const [dirty, setDirty] = useState(false);
  const [progress, setProgress] = useState(""); const stop = useRef(false);
  const [patterns, setPatterns] = useState<NotePattern[]>([]); const [profileId, setProfileId] = useState("");
  const [patternName, setPatternName] = useState("My KYP note style");
  const [rules, setRules] = useState(defaultRules.join("\n")); const [examples, setExamples] = useState("");
  const [approved, setApproved] = useState(false); const [learned, setLearned] = useState(false);
  const selected = run?.rows.find(r => r.holding.id === selectedId) || run?.rows[0];
  async function load() {
    setError("");
    try {
      const [runs, profiles] = await Promise.all([request("/api/kyp/simulation"), request("/api/kyp/note-patterns")]);
      setRun(runs.data); setPatterns(profiles.data); setDirty(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the simulation."); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);
  async function simulate() {
    setBusy(true); setError(""); setMessage(""); setProgress("Matching source identifiers and fetching candidate evidence for the 20 holdings…");
    try { const result = await request("/api/kyp/simulation", "POST", { enrich: true }); setRun(result.data); setDirty(false); setMessage("All 20 holdings have editable template notes. Every record remains a simulation draft."); }
    catch (e) { setError(e instanceof Error ? e.message : "Simulation failed."); }
    finally { setBusy(false); setProgress(""); }
  }
  async function aiDraft(all: boolean) {
    if (!run || !selected) return;
    setBusy(true); setError(""); setMessage(""); stop.current = false;
    let current = run;
    const targets = all ? current.rows.filter(r => r.generation === "template" || (r.generation === "ai" && r.aiSafetyVersion !== 1)).map(r => r.holding.id) : [selected.holding.id];
    let completed = 0; const failed: string[] = [];
    for (let i = 0; i < targets.length; i++) {
      if (stop.current) break;
      const row = current.rows.find(r => r.holding.id === targets[i])!;
      setProgress(`AI drafting ${i + 1} of ${targets.length}: ${row.holding.requestedName}`);
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const result = await request(`/api/kyp/simulation/${current.id}/ai`, "POST", { holdingId: targets[i], version: current.version, ...(profileId ? { profileId } : {}) });
          current = result.data; setRun(current); completed++; break;
        } catch (e) {
          if (e instanceof SimulationRequestError && e.status === 429 && attempt < 3 && !stop.current) {
            const wait = Math.min(55000, Math.max(2000, e.retryAfterMs));
            setProgress(`AI rate limit: retrying ${row.holding.requestedName} in ${Math.ceil(wait / 1000)} seconds. Saved notes are preserved.`);
            await new Promise(resolve => window.setTimeout(resolve, wait));
            if (stop.current) break;
          } else { failed.push(`${row.holding.requestedName}: ${e instanceof Error ? e.message : "Draft failed."}`); if (e instanceof SimulationRequestError && e.status === 409) stop.current = true; break; }
        }
      }
    }
    setMessage(`${completed} AI drafts saved. ${all ? "Advisor edits and AI drafts that passed the current quality check were preserved." : "Advisor review is still required."}${stop.current ? " Batch stopped after the current request." : ""}`);
    if (failed.length) setError(`${failed.length} drafts failed; original notes remain available. ${failed[0]}`);
    setBusy(false); setProgress("");
  }
  async function recheck() {
    if (!run) return;
    setBusy(true); setError("");
    try { const result = await request(`/api/kyp/simulation/${run.id}`, "POST", { action: "recheck", version: run.version }); setRun(result.data); setMessage(`Evidence check saved. ${result.replaced} unsupported generated sections reverted to source-based templates. Advisor edits were preserved.`); }
    catch (e) { setError(e instanceof Error ? e.message : "Quality check failed."); }
    finally { setBusy(false); }
  }
  async function saveEdits() {
    if (!run || !selected) return;
    setBusy(true); setError("");
    try { const result = await request(`/api/kyp/simulation/${run.id}`, "PATCH", { holdingId: selected.holding.id, version: run.version, notes: selected.notes }); setRun(result.data); setDirty(false); setMessage("Edited simulation draft saved. It has not been approved or archived as a completed review."); }
    catch (e) { setError(e instanceof Error ? e.message : "Save failed."); }
    finally { setBusy(false); }
  }
  function updateNote(key: typeof sectionKeys[number], value: string) {
    if (!run || !selected) return;
    setRun({ ...run, rows: run.rows.map(row => row.holding.id === selected.holding.id ? { ...row, notes: { ...row.notes, [key]: value }, sectionOrigins: { ...row.sectionOrigins, [key]: "advisor" } } : row) }); setDirty(true); setMessage("");
  }
  const exampleList = () => examples.trim() ? examples.split(/\n---\n/).map(note => ({ assetType: "any" as const, note: note.trim() })).filter(e => e.note) : [];
  async function learnStyle() {
    setBusy(true); setError("");
    try { const result = await request("/api/kyp/note-patterns/learn", "POST", { examples: exampleList(), approvedForAi: approved }); setRules(result.data.rules.join("\n")); setLearned(true); setApproved(false); setMessage("Suggested writing rules extracted. Review and approve them before saving a pattern."); }
    catch (e) { setError(e instanceof Error ? e.message : "Style extraction failed."); }
    finally { setBusy(false); }
  }
  async function savePattern() {
    setBusy(true); setError("");
    try { const result = await request("/api/kyp/note-patterns", "POST", { name: patternName, rules: rules.split("\n").map(r => r.trim()).filter(Boolean), examples: exampleList(), approved }); setPatterns(current => [result.data, ...current]); setProfileId(result.data.id); setMessage("Approved note pattern saved and selected for future AI drafts."); }
    catch (e) { setError(e instanceof Error ? e.message : "Pattern could not be saved."); }
    finally { setBusy(false); }
  }
  function fillKyp(all = false) {
    if (!run || !selected) return;
    try {
      const holdings = JSON.parse(transientDraftStorage.getItem("bullbrief:kyp-custom-holdings:v1") || "[]");
      const drafts = JSON.parse(transientDraftStorage.getItem("bullbrief:kyp-drafts:v2") || "{}");
      const result = planKypDraftFill(run, holdings, drafts, all ? undefined : selected.holding.id);
      transientDraftStorage.setItem("bullbrief:kyp-custom-holdings:v1", JSON.stringify(result.holdings));
      transientDraftStorage.setItem("bullbrief:kyp-drafts:v2", JSON.stringify(result.drafts));
      setMessage(`${result.filled} empty fields filled; ${result.refreshed} unchanged generated fields refreshed. Manual notes and ${result.skippedCompleted} completed reviews were preserved. Approval and completion remain unset.`);
    } catch { setError("The browser KYP draft could not be saved. Your server simulation is unchanged."); }
  }
  const matched = run?.rows.filter(r => r.identity === "matched").length || 0;
  const aiCount = run?.rows.filter(r => r.generation === "ai").length || 0;
  const totalValue = TOP_HOLDINGS.reduce((sum, h) => sum + h.portfolioHolding!.marketValue, 0);
  return <div className="space-y-6">
    <header className="border-b border-outline-variant pb-6"><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-primary"><FileText size={15} /> Your holdings · Simulation workspace</p><h2 className="mt-3 font-display text-3xl font-bold italic md:text-4xl">Turn the holdings list into a working KYP draft.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">Using your October 16 extract. Templates fill the research sections first; AI can adapt the wording to approved note patterns. Nothing here is marked reviewed, suitable or complete.</p>
      <div className="mt-5 flex flex-wrap gap-3 text-xs"><span className="rounded-full border border-outline-variant px-3 py-2">20 holdings · 21.23% of reported assets</span><span className="rounded-full border border-outline-variant px-3 py-2">${totalValue.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} reported value · currency unspecified</span>{run && <span className="rounded-full border border-outline-variant px-3 py-2">{matched} identifier matches · {aiCount} AI drafts · 0 completed reviews</span>}</div>
    </header>
    {error && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">{error}</p>}
    {message && <p role="status" className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs leading-5"><Check size={15} className="mt-0.5 shrink-0 text-primary" />{message}</p>}
    <section aria-label="Simulation controls" className="simulation-controls rounded-2xl border border-outline-variant bg-surface-container-lowest p-5"><div className="simulation-setup"><label className="form-field"><span className="form-field-label">Writing pattern</span><select value={profileId} disabled={busy} onChange={e => setProfileId(e.target.value)} className={inputClass}><option value="">Built-in research pattern</option>{patterns.map(p => <option key={p.id} value={p.id}>{p.name} · v{p.version}</option>)}</select></label><button onClick={() => void simulate()} disabled={busy || loading || dirty} className={buttonClass}>{busy && progress.startsWith("Matching") ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}{run ? "Start a new simulation" : "Simulate all 20 holdings"}</button></div><div className="simulation-actions" role="group" aria-label="Actions for all holdings"><button disabled={busy || !run || dirty || !run.rows.some(r => r.generation === "template" || (r.generation === "ai" && r.aiSafetyVersion !== 1))} onClick={() => void aiDraft(true)} className={outlineClass}><Sparkles size={15} /> AI draft remaining holdings</button><button onClick={() => void recheck()} disabled={busy || !run || dirty} className={outlineClass}><Check size={15} /> Check generated notes</button><button onClick={() => fillKyp(true)} disabled={busy || !run || dirty} className={outlineClass}><FileText size={15} /> Fill all KYP drafts</button>{busy && progress.startsWith("AI") && <button onClick={() => { stop.current = true; }} className={outlineClass}><Square size={13} /> Stop after current</button>}</div>
      <p className="simulation-help text-sm leading-6 text-on-surface-variant">AI uses public product evidence and your selected approved examples through Groq. Book weights, client counts, market values and client circumstances are excluded from the AI request. This uses approved examples as context; it does not train or fine-tune a model.</p>{progress && <p role="status" className="mt-3 flex items-center gap-2 text-xs text-primary"><RefreshCw size={13} className="animate-spin" />{progress}</p>}
    </section>
    <details className="rounded-xl border border-outline-variant p-5"><summary className="cursor-pointer text-sm font-semibold">Note patterns · add approved examples or writing rules</summary><p className="mt-3 text-xs leading-5 text-on-surface-variant">No historical advisor notes were supplied with the sheet. Start with built-in patterns, or paste anonymized, advisor-approved product notes below. Remove client names, account details and confidential circumstances. AI extracts writing structure and tone; it must not transfer facts between products.</p><div className="mt-4 grid gap-5 lg:grid-cols-2"><div className="space-y-4"><label className="form-field">Pattern name<input value={patternName} disabled={busy} onChange={e => { setPatternName(e.target.value); setApproved(false); }} className={inputClass} /></label><label className="form-field">Anonymized approved examples · optional<textarea rows={7} value={examples} disabled={busy} onChange={e => { setExamples(e.target.value); setApproved(false); setLearned(false); }} placeholder="Paste up to three examples. Separate examples with a line containing ---" className={inputClass} /></label><button onClick={() => void learnStyle()} disabled={busy || !approved || !examples.trim()} className={outlineClass}><WandSparkles size={15} /> Extract writing patterns with AI</button></div><div className="space-y-4"><label className="form-field">{learned ? "Suggested rules · review before approval" : "Writing rules · one per line"}<textarea rows={10} value={rules} disabled={busy} onChange={e => { setRules(e.target.value); setApproved(false); }} className={inputClass} /></label><label className="flex items-start gap-3 text-xs leading-5"><input type="checkbox" checked={approved} disabled={busy} onChange={e => setApproved(e.target.checked)} className="mt-1 accent-primary" />I approve these rules and examples for reuse. The examples are anonymized and may be sent to Groq for style extraction and note drafting.</label><button onClick={() => void savePattern()} disabled={busy || !approved} className={buttonClass}>Save approved pattern</button></div></div></details>
    {loading ? <p className="py-8 text-sm text-on-surface-variant">Loading your saved simulation…</p> : !run ? <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center"><p className="text-sm font-semibold">The 20-holding source is ready.</p><p className="mt-2 text-xs text-on-surface-variant">Run the simulation to create 11 editable sections per holding, research candidate instruments, and show identity and evidence gaps.</p></div> : <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]"><aside className="min-w-0 overflow-hidden rounded-xl border border-outline-variant"><div className="border-b border-outline-variant p-4"><label className="text-xs font-semibold">Find a source holding<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, CUSIP or fund code" className={`${inputClass} mt-2`} /></label><p className="mt-2 text-[10px] text-on-surface-variant">Source: {run.sourceFile} · {run.reportDate}</p></div><div className="max-h-[650px] overflow-y-auto">{run.rows.filter(r => `${r.holding.requestedName} ${r.holding.portfolioHolding!.identifier}`.toLowerCase().includes(query.toLowerCase())).map(row => <button key={row.holding.id} disabled={dirty || busy} onClick={() => { setSelectedId(row.holding.id); setMessage(""); }} className={`block w-full border-b border-outline-variant p-4 text-left last:border-0 disabled:opacity-60 ${row.holding.id === selected?.holding.id ? "bg-primary/5" : "hover:bg-surface-container-low"}`}><span className="block text-xs font-semibold">{row.holding.portfolioHolding!.rank}. {row.holding.requestedName}</span><span className="mt-1 block font-mono text-[10px] text-on-surface-variant">{row.holding.portfolioHolding!.identifier} · {row.holding.portfolioHolding!.assetsPercent.toFixed(2)}% · {row.generation === "ai" ? "AI draft" : row.generation === "advisor" ? "Edited draft" : "Template draft"}</span><span className="mt-2 block"><IdentityBadge row={row} /></span></button>)}</div></aside>
      {selected && <main className="min-w-0 space-y-5"><section className="rounded-xl border border-outline-variant p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-wider text-primary">Simulation draft · {selected.pattern.replaceAll("-", " ")} pattern</p><h2 className="mt-2 font-display text-xl font-bold">{selected.holding.requestedName}</h2><p className="mt-2 text-xs text-on-surface-variant">{selected.holding.portfolioHolding!.identifier} · {selected.holding.portfolioHolding!.clientCount} client IDs · {selected.holding.portfolioHolding!.assetsPercent.toFixed(2)}% of reported book assets</p></div><IdentityBadge row={selected} /></div>
        {selected.identityEvidence && <p className="mt-3 text-xs leading-5 text-on-surface-variant">{selected.identityEvidence.provider} returned identifier {selected.identityEvidence.identifier} for {selected.candidateSymbol}. Retrieved {new Date(selected.identityEvidence.retrievedAt).toLocaleString("en-CA")}.</p>}
        {selected.research && <details className="mt-4 border-t border-outline-variant pt-4"><summary className="cursor-pointer text-xs font-semibold">{selected.identity === "matched" ? "Matched instrument research" : "Provisional candidate research · excluded from source-holding facts"}: {selected.research.symbol}</summary><p className="mt-3 text-xs leading-6">{selected.research.name} · {selected.research.currency || "Currency unavailable"} · reference price {selected.research.price ?? "Unavailable"}<br />Reported expense ratio {metric(selected.research.expenseRatio, true)} · beta {metric(selected.research.beta)}<br /><a href={selected.research.sourceUrl} target="_blank" rel="noreferrer" className="underline">Yahoo source ↗</a> · retrieved {new Date(selected.research.retrievedAt).toLocaleString("en-CA")}</p></details>}
        <div className="mt-4 space-y-1 border-l-2 border-warning pl-3">{selected.gaps.map(gap => <p key={gap} className="text-xs leading-5 text-on-surface-variant">{gap}</p>)}</div>
        {selected.aiIssue && <p className="mt-4 rounded-lg border border-warning/30 p-3 text-xs leading-5 text-on-surface-variant">{selected.aiIssue}</p>}
        <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => void aiDraft(false)} disabled={busy || dirty} className={outlineClass}><Sparkles size={14} />{selected.generation === "template" ? "AI draft this holding" : "Replace with new AI draft"}</button><button onClick={() => fillKyp()} disabled={busy || dirty} className={outlineClass}><FileText size={14} /> Fill empty KYP fields</button><button onClick={() => onOpenHolding(selected.holding.id)} disabled={busy || dirty} className={outlineClass}>Open KYP document</button></div><p className="mt-3 text-[10px] text-on-surface-variant">{selected.aiProfile ? `AI pattern: ${selected.aiProfile.name} v${selected.aiProfile.version}.` : selected.generation === "ai" ? "AI used built-in writing rules; no learned advisor examples." : "Built-in template. No AI-generated research claims."} Completion and dealer approval remain unset.</p>
      </section>
      {dirty && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 p-4"><p className="text-xs">Unsaved edits. Save or discard before switching holdings or drafting again.</p><div className="flex gap-3"><button onClick={() => void saveEdits()} disabled={busy} className={buttonClass}>Save edited draft</button><button onClick={() => void load()} disabled={busy} className="text-xs text-on-surface-variant">Discard unsaved edits</button></div></div>}
      {sectionKeys.map(key => <label key={key} className="block space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"><span className="flex items-center justify-between gap-3 text-xs font-semibold">{sectionLabels[key]}<span className="font-mono text-[9px] uppercase tracking-wide text-on-surface-variant">{(selected.sectionOrigins?.[key] || selected.generation) === "ai" ? "AI suggestion" : (selected.sectionOrigins?.[key] || selected.generation) === "advisor" ? "Advisor-edited draft" : "Template draft"}</span></span><textarea value={selected.notes[key]} disabled={busy} onChange={e => updateNote(key, e.target.value)} rows={key === "rationale" || key === "evidenceSources" ? 6 : 4} className={inputClass} /></label>)}
      <p className="text-[11px] leading-5 text-on-surface-variant">This simulation uses source holdings dated October 16, 2026 and separately timestamped current research. No client discussion, recommendation, suitability decision, dealer approval or completed KYP is inferred. Verify source disclosure and review all generated text.</p>
      </main>}
    </div>}
  </div>;
}
