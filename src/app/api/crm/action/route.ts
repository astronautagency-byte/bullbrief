import { createHash, createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { actionEnvelopeSchema } from "@/lib/crm/model";
import { crmError, crmSession, crmWriter, storageError, sameOrigin } from "@/lib/crm/server";
export async function POST(request: Request) {
 try {
  sameOrigin(request);
  const session = await crmSession();
  const raw = await request.text();
  if (raw.length > 100000) return NextResponse.json({ error: "This CRM entry is too large." }, { status: 413 });
  const input = actionEnvelopeSchema.safeParse(JSON.parse(raw));
  if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
  const value = input.data;
  let payload: Record<string, unknown> = value.data; let inviteToken: string | null = null;
  if (value.action === "invite.create") {
   const secret = process.env.CRM_INVITE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
   if (!secret) throw new Error("CRM_STORAGE: Invite signing is unavailable.");
   inviteToken = createHmac("sha256", secret).update(`${session.user.id}:${value.requestId}`).digest("hex");
   payload = { ...payload, token_hash: createHash("sha256").update(inviteToken).digest("hex") };
  }
  const { data, error } = await crmWriter().rpc("crm_dispatch", { p_actor: session.user.id, p_firm: value.firmId || null, p_action: value.action, p: payload, p_request: value.requestId });
  storageError(error);
  const inviteUrl = inviteToken ? `${new URL(request.url).origin}/crm?invite=${inviteToken}` : undefined;
  return NextResponse.json({ data, ...(inviteUrl ? { inviteUrl, delivery: "copy_link_only_no_email_sent" } : {}) }, { headers: { "Cache-Control": "no-store" } });
 } catch (e) { return crmError(e); }
}
