import { z } from "zod";
export const importKinds = ["households", "accounts"] as const;
export type ImportKind = typeof importKinds[number];
export const accountTypes = ["RRSP", "TFSA", "FHSA", "RRIF", "RESP", "LIRA", "LIF", "non_registered", "corporate", "other"] as const;
const cell = (max: number) => z.string().trim().max(max);
const required = (max: number) => cell(max).min(1);
const calendarDate = cell(10).refine(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Use YYYY-MM-DD and a valid date.");
const household = z.object({ external_id: required(100), name: required(150).min(2), stage: z.enum(["prospect", "onboarding", "active", "inactive"]), service_tier: required(80), first_name: cell(100), last_name: cell(100), email: cell(254).refine(v => !v || z.email().safeParse(v).success, "Invalid contact email."), phone: cell(60) }).refine(v => v.first_name || !(v.last_name || v.email || v.phone), "A contact needs a first name.");
const account = z.object({ external_id: required(100), household_id: z.uuid(), institution: required(120), account_type: z.enum(accountTypes), last_four: z.string().regex(/^\d{4}$/, "Use only the last four account digits."), currency: z.enum(["CAD", "USD", "EUR", "GBP"]), balance: cell(30).refine(v => !v || /^-?\d{1,13}(\.\d{1,2})?$/.test(v), "Use a plain decimal balance, without currency signs or commas."), as_of: calendarDate }).refine(v => !v.balance || !!v.as_of, "A balance requires an as-of date.").refine(v => v.balance || !v.as_of, "An as-of date requires a balance.");
export const columns: Record<ImportKind, string[]> = { households: Object.keys(household.shape), accounts: Object.keys(account.shape) };
export type ImportRow = Record<string, string>;
export type ImportPreview = { rows: { row: number; name: string; status: "create" | "skip"; household_id?: string }[]; created: number; skipped: number; committed: boolean };
// RFC 4180-style CSV: quoted commas/newlines, escaped quotes, CRLF and UTF-8 BOM.
export function parseCsv(source: string): string[][] {
 if (source.length > 500000) throw new Error("Use a CSV smaller than 500 KB.");
 const result: string[][] = []; let row: string[] = [], value = "", quoted = false, closed = false;
 const input = source.replace(/^\uFEFF/, "");
 const endCell = () => { row.push(value.trim()); value = ""; closed = false; };
 const endRow = () => { endCell(); if (row.some(Boolean)) result.push(row); row = []; if (result.length > 201) throw new Error("Import at most 200 data rows at a time."); };
 for (let i = 0; i < input.length; i++) {
  const c = input[i];
  if (quoted) { if (c === '"') { if (input[i + 1] === '"') { value += '"'; i++; } else { quoted = false; closed = true; } } else value += c; }
  else if (c === '"') { if (value || closed) throw new Error("Malformed CSV quotation."); quoted = true; }
  else if (c === ',') endCell();
  else if (c === '\n' || c === '\r') { if (c === '\r' && input[i + 1] === '\n') i++; endRow(); }
  else { if (closed && c.trim()) throw new Error("Unexpected text after a quoted field."); if (!closed) value += c; }
 }
 if (quoted) throw new Error("CSV has an unclosed quoted field.");
 if (value || row.length || closed) endRow();
 return result;
}
export function prepareImport(kind: ImportKind, source: string): ImportRow[] {
 const table = parseCsv(source), headers = table.shift()?.map(v => v.toLowerCase()) || [], expected = columns[kind];
 if (headers.length !== expected.length || new Set(headers).size !== headers.length || expected.some(h => !headers.includes(h))) throw new Error(`Use the ${kind} template columns: ${expected.join(", ")}.`);
 if (!table.length) throw new Error("The CSV has no data rows.");
 const keys = new Set<string>(), names = new Set<string>();
 return table.map((values, index) => {
  if (values.length !== headers.length) throw new Error(`Row ${index + 2}: expected ${headers.length} columns.`);
  const raw = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  const parsed = (kind === "households" ? household : account).safeParse(raw);
  if (!parsed.success) throw new Error(`Row ${index + 2}: ${parsed.error.issues.map(i => `${i.path.join(".") || "record"}: ${i.message}`).join("; ")}`);
  const row = parsed.data as ImportRow;
  const key = `${kind === "accounts" ? row.institution.toLowerCase() + ":" : ""}${row.external_id}`;
  if (keys.has(key)) throw new Error(`Row ${index + 2}: duplicate external ID in this file.`); keys.add(key);
  if (kind === "households") { const name = row.name.toLowerCase(); if (names.has(name)) throw new Error(`Row ${index + 2}: duplicate household name. Combine or distinguish these households before importing.`); names.add(name); }
  return row;
 });
}
export function importTemplate(kind: ImportKind) { return columns[kind].join(",") + "\r\n"; }
