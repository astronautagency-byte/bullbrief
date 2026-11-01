"use client";
import { useRef, useState } from "react";
import { columns, importTemplate, prepareImport, type ImportKind, type ImportPreview } from "@/lib/crm/import";
import type { CrmState } from "@/lib/crm/model";
import { Dialog, Field, fieldClass, primaryClass, secondaryClass } from "./crm-forms";
export function CrmImport({ state, onClose, onSaved, initialKind = "households" }: { state: CrmState; initialKind?: ImportKind; onClose: () => void; onSaved: () => Promise<void> }) {
 const [kind, setKind] = useState<ImportKind>(initialKind), [csv, setCsv] = useState(""), [lead, setLead] = useState(state.user.id), [busy, setBusy] = useState(false), [error, setError] = useState("");
 const [preview, setPreview] = useState<(ImportPreview & { preview_hash: string }) | null>(null), [confirmed, setConfirmed] = useState(false);
 const request = useRef("");
 function reset(text: string) { setCsv(text); setPreview(null); setConfirmed(false); setError(""); request.current = ""; }
 async function run(commit: boolean) {
  setBusy(true); setError("");
  try {
   prepareImport(kind, csv);
   request.current ||= crypto.randomUUID();
   const response = await fetch("/api/crm/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firmId: state.firm!.id, kind, csv, leadId: kind === "households" ? lead : null, requestId: request.current, commit, previewHash: preview?.preview_hash }) });
   const result = await response.json(); if (!response.ok) throw new Error(result.error || "Import failed.");
   setPreview(result.data); if (commit) await onSaved();
  } catch (e) { setError(e instanceof Error ? e.message : "Import failed."); }
  finally { setBusy(false); }
 }
 const previewRows = preview ? prepareImport(kind, csv) : [];
 function download() {
  const url = URL.createObjectURL(new Blob([importTemplate(kind)], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `crm-${kind}-template.csv`; anchor.click(); URL.revokeObjectURL(url);
 }
 return <Dialog title="Import client records" busy={busy} onClose={onClose}><div className="space-y-5">
  <p className="text-xs leading-6 text-on-surface-variant">Add records from a CSV in two steps: check the preview, then save. Up to 200 rows per file. Existing records are never overwritten or merged automatically.</p>
  <Field title="Import type"><select disabled={busy || preview?.committed} value={kind} onChange={e => { setKind(e.target.value as ImportKind); reset(""); }} className={fieldClass}><option value="households">Households + primary contacts</option><option value="accounts">Financial accounts</option></select></Field>
  {kind === "households" ? <Field title="Lead advisor for new households"><select disabled={busy || preview?.committed} value={lead} onChange={e => { setLead(e.target.value); setPreview(null); setConfirmed(false); request.current = ""; }} className={fieldClass}>{state.members.filter(m => m.status === "active" && ["owner", "admin", "advisor"].includes(m.role)).map(m => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}</select></Field> : <div className="rounded-xl border border-outline-variant p-4 text-xs leading-6"><p>Use each household’s exact CRM ID. Import households first. Use a stable, non-sensitive external reference and only the last four account digits.</p>{state.household && <p className="mt-2">Selected household: {state.household.name}<code className="mt-1 block select-all break-all">{state.household.id}</code></p>}<p className="mt-2">Types: RRSP, TFSA, FHSA, RRIF, RESP, LIRA, LIF, non_registered, corporate, other. Currency: CAD, USD, EUR or GBP. Balances need an as_of date (YYYY-MM-DD).</p></div>}
  <button type="button" onClick={download} className={secondaryClass}>Download blank CSV template</button>
  <p className="break-words font-mono text-[10px] leading-5 text-on-surface-variant">Columns: {columns[kind].join(", ")}</p>
  <Field title="Choose CSV file"><input disabled={busy || preview?.committed} type="file" accept=".csv,text/csv" className={fieldClass} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 500000) { reset(""); setError("Use a CSV smaller than 500 KB."); return; } try { reset(await file.text()); } catch { setError("Could not read the file."); } }} /></Field>
  <Field title="CSV contents"><textarea disabled={busy || preview?.committed} rows={7} value={csv} onChange={e => reset(e.target.value)} spellCheck={false} className={`${fieldClass} font-mono text-[11px]`} placeholder={importTemplate(kind).trim()} /></Field>
  {error && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs leading-6 text-error">{error}</p>}
  {!preview?.committed && <button disabled={busy || !csv.trim()} onClick={() => void run(false)} className={secondaryClass}>{busy ? "Checking…" : "Preview import"}</button>}
  {preview && <section className="space-y-3 rounded-xl border border-outline-variant p-4"><h3 className="text-sm font-semibold">{preview.committed ? "Import saved" : "Import preview"}</h3><p role="status" className="text-xs">{preview.created} {preview.committed ? "created" : "to create"} · {preview.skipped} unchanged records skipped</p><div className="max-h-60 overflow-y-auto divide-y divide-outline-variant">{preview.rows.map(r => <div key={r.row} className="py-3 text-xs"><p className="font-semibold">Row {r.row} · {r.name} · {r.status === "skip" ? "Skip: already imported" : preview.committed ? "Created" : "Create new record"}</p><dl className="mt-2 space-y-1 text-[10px] leading-5 text-on-surface-variant">{Object.entries(previewRows[r.row - 2] || {}).map(([key, value]) => <div key={key} className="break-words"><dt className="inline font-semibold">{key.replaceAll("_", " ")}: </dt><dd className="inline">{key === "household_id" ? `${state.householdNames[value] || (state.household?.id === value ? state.household.name : "Household ID")} · ${value}` : value || "Not supplied"}</dd></div>)}</dl></div>)}</div>{!preview.committed && preview.created > 0 && <><label className="flex items-start gap-2 text-xs leading-6"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy} className="mt-1 accent-primary" />I checked the household links, source references and values. Save these records to {state.firm?.name}.</label><button disabled={busy || !confirmed} onClick={() => void run(true)} className={primaryClass}>{busy ? "Saving…" : `Save ${preview.created} ${preview.created === 1 ? "record" : "records"}`}</button></>}{preview.committed && <button onClick={onClose} className={primaryClass}>Done</button>}</section>}
 </div></Dialog>;
}
