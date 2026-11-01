import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { crmSession, crmWriter, crmError, storageError, sameOrigin } from "@/lib/crm/server";
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export async function GET(request: Request) {
 try {
  const session = await crmSession(); const token = tokenSchema.safeParse(new URL(request.url).searchParams.get("token"));
  if (!token.success) return NextResponse.json({ error: "Invalid invitation link." }, { status: 400 });
  const writer = crmWriter();
  const result = await writer.from("crm_invites").select("firm_id,email,role,expires_at,used_at,used_by,created_by").eq("token_hash", createHash("sha256").update(token.data).digest("hex")).maybeSingle(); storageError(result.error);
  const invite = result.data;
  if (!invite || new Date(invite.expires_at).getTime() < Date.now()) throw new Error("This invitation is invalid or expired.");
  if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) return NextResponse.json({ error: "This invitation belongs to another email address. Sign in with the invited account." }, { status: 403 });
  const firm = await writer.from("crm_firms").select("name").eq("id", invite.firm_id).single(); storageError(firm.error);
  return NextResponse.json({ data: { firmName: firm.data?.name, role: invite.role, expiresAt: invite.expires_at, used: !!invite.used_at } }, { headers: { "Cache-Control": "no-store" } });
 } catch (e) { return crmError(e); }
}
export async function POST(request: Request) {
 try {
  sameOrigin(request); const session = await crmSession();
  const input = z.object({ token: tokenSchema }).safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Invalid invitation." }, { status: 400 });
  const { data, error } = await crmWriter().rpc("crm_accept_invite", { p_actor: session.user.id, p_hash: createHash("sha256").update(input.data.token).digest("hex") }); storageError(error);
  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
 } catch (e) { return crmError(e); }
}
