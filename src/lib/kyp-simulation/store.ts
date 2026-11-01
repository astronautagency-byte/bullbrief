import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { reviewSession } from "@/lib/kyp-review/store";
import type { NotePattern, SimulationRun } from "./model";
type Session = Awaited<ReturnType<typeof reviewSession>>;
export function simulationWriter() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY, url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) throw new Error("Server storage is not configured.");
  return createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} }, auth: { persistSession: false, autoRefreshToken: false } });
}
export async function getRun(session: Session, id: string) {
  const { data, error } = await session.client.from("kyp_simulation_runs").select("document").eq("id", id).maybeSingle();
  if (error) throw new Error("Simulation storage could not be read.");
  return data?.document as SimulationRun | undefined;
}
export async function saveRun(session: Session, run: SimulationRun, expectedVersion?: number) {
  const writer = simulationWriter();
  if (expectedVersion != null) {
    const { data, error } = await writer.from("kyp_simulation_runs").update({ document: run, version: run.version, updated_at: new Date().toISOString() }).eq("id", run.id).eq("owner_id", session.user.id).eq("version", expectedVersion).select("id").maybeSingle();
    if (error || !data) throw new Error("This simulation changed in another tab. Reload it before saving; your edits have not been saved.");
  } else {
    const { error } = await writer.from("kyp_simulation_runs").insert({ id: run.id, owner_id: session.user.id, document: run, version: run.version });
    if (error) throw new Error("The simulation could not be saved. Please retry.");
  }
}
export async function getPatterns(session: Session): Promise<NotePattern[]> {
  const { data, error } = await session.client.from("kyp_note_patterns").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error("Note patterns could not be loaded.");
  return (data || []).map(r => ({ ...r.document, id: r.id, createdAt: r.created_at, version: r.version }));
}
