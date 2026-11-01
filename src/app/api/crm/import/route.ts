import { NextResponse } from "next/server";
import { z } from "zod";
import { importKinds, prepareImport } from "@/lib/crm/import";
import { crmError, crmSession, crmWriter, sameOrigin, storageError } from "@/lib/crm/server";
const schema = z.object({ firmId: z.uuid(), kind: z.enum(importKinds), csv: z.string().max(500000), leadId: z.uuid().nullable(), requestId: z.uuid(), commit: z.boolean(), previewHash: z.string().regex(/^[a-f0-9]{64}$/).optional() }).refine(v => !v.commit || !!v.previewHash, "Preview the import before saving.");
export async function POST(request: Request) {
 try {
  sameOrigin(request); const session = await crmSession(); const raw = await request.text();
  if (raw.length > 600000) return NextResponse.json({ error: "Use a CSV smaller than 500 KB." }, { status: 413 });
  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const v = parsed.data, rows = prepareImport(v.kind, v.csv);
  const { data, error } = await crmWriter().rpc("crm_import", { p_actor: session.user.id, p_firm: v.firmId, p_kind: v.kind, p_rows: rows, p_lead: v.leadId, p_commit: v.commit, p_request: v.requestId, p_preview_hash: v.previewHash || null });
  storageError(error);
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
 } catch (e) { return crmError(e); }
}
