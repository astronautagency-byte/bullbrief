import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
export type ArchiveRow = { id: string; owner_id: string; kind: "research" | "audit"; document: string; sha256: string; created_at: string };
export function digest(document: string) { return createHash("sha256").update(document, "utf8").digest("hex"); }
export async function reviewSession() {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("AUTH_REQUIRED");
  return { client, user: data.user };
}
export async function readArchive(client: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data, error } = await client.from("kyp_review_archive").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Archive storage is unavailable. Please retry; no record has been confirmed saved.");
  const row = data as ArchiveRow | null;
  if (row && digest(row.document) !== row.sha256) throw new Error("Archive integrity verification failed.");
  return row;
}
export async function appendArchive(session: Awaited<ReturnType<typeof reviewSession>>, id: string, kind: ArchiveRow["kind"], payload: object) {
  const document = JSON.stringify({ version: 1, recordId: id, ownerId: session.user.id, generatedAt: new Date().toISOString(), ...payload });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) throw new Error("Server archive storage is not configured. Your review has not been saved.");
  const writer = createServerClient(url, serviceKey, { cookies: { getAll: () => [], setAll: () => {} }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await writer.from("kyp_review_archive").insert({ id, owner_id: session.user.id, kind, document, sha256: digest(document) }).select().single();
  if (error || !data) throw new Error("Archive storage is unavailable. Please retry; no record has been confirmed saved.");
  return data as ArchiveRow;
}
