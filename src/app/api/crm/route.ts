import { NextResponse } from "next/server";
import { z } from "zod";
import { crmSession, crmError, storageError } from "@/lib/crm/server";
import type { CrmState, Firm, Member, Household, Contact, Task, Meeting, KypLink, AuditEvent, KypSource, FinancialAccount } from "@/lib/crm/model";
export async function GET(request: Request) {
 try {
  const session = await crmSession(), client = session.client;
  const params = new URL(request.url).searchParams;
  const firmId = params.get("firmId"), householdId = params.get("householdId");
  if ([firmId, householdId].some(id => id && !z.string().uuid().safeParse(id).success)) return NextResponse.json({ error: "Invalid workspace or household." }, { status: 400 });
  const page = Math.max(1, Math.min(10000, Number(params.get("page")) || 1));
  const search = (params.get("search") || "").slice(0, 100);
  const own = await client.from("crm_members").select("*").eq("user_id", session.user.id).eq("status", "active"); storageError(own.error);
  const ownMembers = (own.data || []) as Member[];
  const firmResult = ownMembers.length ? await client.from("crm_firms").select("*").in("id", ownMembers.map(m => m.firm_id)).order("created_at") : { data: [], error: null }; storageError(firmResult.error);
  const firms = (firmResult.data || []) as Firm[];
  const firm = firmId ? firms.find(f => f.id === firmId) : firms[0];
  if (firmId && !firm) throw new Error("CRM_FORBIDDEN");
  const state: CrmState = { user: { id: session.user.id, email: session.user.email || "", name: typeof session.user.user_metadata?.name === "string" ? session.user.user_metadata.name : "" }, firms, firm: firm || null, role: ownMembers.find(m => m.firm_id === firm?.id)?.role || null, members: [], households: [], householdCount: 0, page, household: null, team: [], accounts: [], contacts: [], tasks: [], taskQueue: [], meetings: [], kyp: [], audit: [], sources: [], householdNames: {}, taskCount: 0, kypPendingCount: 0 };
  if (!firm) return NextResponse.json({ data: state }, { headers: { "Cache-Control": "no-store" } });
  let houseQuery = client.from("crm_households").select("*", { count: "exact" }).eq("firm_id", firm.id).order("updated_at", { ascending: false }).order("id").range((page - 1) * 25, page * 25 - 1);
  if (search) houseQuery = houseQuery.ilike("name", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
  const [houses, members, queue, taskCount, kypCount] = await Promise.all([
    houseQuery,
    client.from("crm_members").select("*").eq("firm_id", firm.id).order("name").limit(300),
    client.from("crm_tasks").select("*").eq("firm_id", firm.id).in("status", ["open", "in_progress"]).order("due_on", { nullsFirst: false }).order("created_at").limit(100),
    client.from("crm_tasks").select("id", { count: "exact", head: true }).eq("firm_id", firm.id).in("status", ["open", "in_progress"]),
    client.from("crm_kyp_reviews").select("id", { count: "exact", head: true }).eq("firm_id", firm.id).neq("review_status", "reviewed"),
  ]);
  for (const result of [houses, members, queue, taskCount, kypCount]) storageError(result.error);
  state.households = (houses.data || []) as Household[]; state.householdCount = houses.count || 0; state.members = (members.data || []) as Member[]; state.taskQueue = (queue.data || []) as Task[]; state.taskCount = taskCount.count || 0; state.kypPendingCount = kypCount.count || 0;
  const selectedId = householdId || state.households[0]?.id;
  if (selectedId) {
    const selected = await client.from("crm_households").select("*").eq("firm_id", firm.id).eq("id", selectedId).maybeSingle(); storageError(selected.error);
    if (!selected.data && householdId) throw new Error("CRM_FORBIDDEN");
    state.household = selected.data as Household | null;
  }
  if (state.household) {
    const id = state.household.id;
    const [accounts, team, contacts, tasks, meetings, kyp, audit] = await Promise.all([
      client.from("crm_accounts").select("id,household_id,institution,account_type,last_four,currency,balance,as_of").eq("firm_id", firm.id).eq("household_id", id).order("created_at").limit(200),
      client.from("crm_household_team").select("user_id").eq("firm_id", firm.id).eq("household_id", id),
      client.from("crm_contacts").select("*").eq("firm_id", firm.id).eq("household_id", id).order("created_at").limit(100),
      client.from("crm_tasks").select("*").eq("firm_id", firm.id).eq("household_id", id).order("created_at", { ascending: false }).limit(100),
      client.from("crm_meetings").select("*").eq("firm_id", firm.id).eq("household_id", id).order("occurred_at", { ascending: false }).limit(50),
      client.from("crm_kyp_reviews").select("*").eq("firm_id", firm.id).eq("household_id", id).order("created_at", { ascending: false }).limit(100),
      client.from("crm_audit_events").select("id,actor_id,action,entity_id,created_at").eq("firm_id", firm.id).eq("household_id", id).order("created_at", { ascending: false }).limit(100),
    ]);
    for (const result of [team, contacts, tasks, meetings, kyp, audit, accounts]) storageError(result.error);
    state.accounts = (accounts.data || []) as FinancialAccount[]; state.team = (team.data || []).map(r => r.user_id); state.contacts = (contacts.data || []) as Contact[]; state.tasks = (tasks.data || []) as Task[]; state.meetings = (meetings.data || []) as Meeting[]; state.kyp = (kyp.data || []) as KypLink[]; state.audit = (audit.data || []) as AuditEvent[];
  }
  const houseIds = Array.from(new Set([...state.taskQueue.map(t => t.household_id), ...state.households.map(h => h.id)]));
  if (houseIds.length) { const names = await client.from("crm_households").select("id,name").eq("firm_id", firm.id).in("id", houseIds); storageError(names.error); state.householdNames = Object.fromEntries((names.data || []).map(h => [h.id, h.name])); }
  const [sim, archived] = await Promise.all([
    client.from("kyp_simulation_runs").select("id,document").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("kyp_review_archive").select("id,document").eq("kind", "audit").order("created_at", { ascending: false }).limit(30),
  ]);
  if (sim.data) {
    const document = sim.data.document as { rows: Array<{ holding: { id: string; requestedName: string; portfolioHolding: { identifier: string } }; identity: string }> };
    state.sources.push(...document.rows.map((r): KypSource => ({ key: `${sim.data!.id}:${r.holding.id}`, source_kind: "simulation", source_id: sim.data!.id, holding_id: r.holding.id, name: r.holding.requestedName, identifier: r.holding.portfolioHolding.identifier, state: `Simulation draft · ${r.identity}` })));
  }
  if (archived.data) for (const r of archived.data) { const doc = JSON.parse(r.document); state.sources.push({ key: r.id, source_kind: "archive", source_id: r.id, name: doc.research.target.name, identifier: doc.research.target.symbol, state: "Archived product review" }); }
  return NextResponse.json({ data: state }, { headers: { "Cache-Control": "no-store" } });
 } catch (e) { return crmError(e); }
}
