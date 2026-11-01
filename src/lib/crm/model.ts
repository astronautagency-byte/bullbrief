import { z } from "zod";
export const roles = ["owner", "admin", "advisor", "staff", "supervisor"] as const;
export type CrmRole = typeof roles[number];
export const householdStages = ["prospect", "onboarding", "active", "inactive"] as const;
export const taskStatuses = ["open", "in_progress", "done", "cancelled"] as const;
export const reviewStatuses = ["open", "needs_evidence", "review_requested", "reviewed"] as const;
const uuid = z.string().uuid();
const date = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(v + "T00:00:00Z"); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v; }, "Use a valid calendar date.")]);
const version = z.number().int().min(1);
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const householdData = z.object({ name: text(2, 150), stage: z.enum(householdStages), service_tier: text(1, 80).default("Core"), lead_advisor_id: uuid, review_due: date.default(""), summary: text(0, 4000).default(""), member_ids: z.array(uuid).max(100).default([]) });
const contactData = z.object({ first_name: text(1, 100), last_name: text(0, 100).default(""), relationship: text(1, 80).default("Primary contact"), email: z.union([z.literal(""), z.string().trim().email().max(254)]).default(""), phone: text(0, 60).default("") });
const taskData = z.object({ title: text(2, 200), details: text(0, 5000).default(""), assigned_to: uuid, due_on: date.default(""), priority: z.enum(["low", "normal", "high"]).default("normal") });
const meetingData = z.object({ title: text(2, 180), occurred_at: z.string().datetime({ offset: true }), attendees: text(0, 1500).default(""), discussion: text(10, 15000), decisions: text(0, 8000).default(""), supersedes_id: uuid.optional(), followups: z.array(taskData).max(10).default([]) });
const kypUpdate = z.object({ assigned_to: uuid, due_on: date.default(""), review_notes: text(0, 6000).default(""), review_status: z.enum(reviewStatuses) });
export const crmActionSchema = z.discriminatedUnion("action", [
 z.object({ action: z.literal("firm.create"), data: z.object({ name: text(2, 120), is_demo: z.boolean().default(false) }) }),
 z.object({ action: z.literal("household.create"), data: householdData }),
 z.object({ action: z.literal("household.update"), data: householdData.extend({ id: uuid, version }) }),
 z.object({ action: z.literal("contact.create"), data: contactData.extend({ household_id: uuid }) }),
 z.object({ action: z.literal("contact.update"), data: contactData.extend({ id: uuid, version }) }),
 z.object({ action: z.literal("meeting.create"), data: meetingData.extend({ household_id: uuid }) }),
 z.object({ action: z.literal("meeting.update"), data: meetingData.extend({ id: uuid, version }) }),
 z.object({ action: z.literal("meeting.finalize"), data: z.object({ id: uuid, version, confirmed: z.literal(true) }) }),
 z.object({ action: z.literal("task.create"), data: taskData.extend({ household_id: uuid }) }),
 z.object({ action: z.literal("task.update"), data: taskData.extend({ id: uuid, version, status: z.enum(taskStatuses) }) }),
 z.object({ action: z.literal("kyp.attach"), data: z.object({ household_id: uuid, source_kind: z.enum(["simulation", "archive"]), source_id: uuid, holding_id: text(1, 80).optional(), assigned_to: uuid, due_on: date.default(""), review_notes: text(0, 6000).default(""), confirmed_sharing: z.literal(true) }).refine(v => v.source_kind !== "simulation" || !!v.holding_id, "Select the source holding.") }),
 z.object({ action: z.literal("kyp.update"), data: kypUpdate.extend({ id: uuid, version }) }),
 z.object({ action: z.literal("invite.create"), data: z.object({ email: z.string().trim().toLowerCase().email().max(254), role: z.enum(["admin", "advisor", "staff", "supervisor"]) }) }),
 z.object({ action: z.literal("member.update"), data: z.object({ user_id: uuid, role: z.enum(["admin", "advisor", "staff", "supervisor"]), status: z.enum(["active", "disabled"]) }) }),
]);
export type CrmAction = z.infer<typeof crmActionSchema>;
export const actionEnvelopeSchema = z.object({ firmId: uuid.optional(), requestId: uuid }).and(crmActionSchema).refine(v => v.action === "firm.create" || !!v.firmId, "Choose a firm workspace.");
export type Member = { firm_id: string; user_id: string; name: string; email: string; role: CrmRole; status: "active" | "disabled" };
export type Firm = { id: string; name: string; is_demo: boolean; timezone: string; created_at: string };
export type Household = { id: string; firm_id: string; name: string; stage: typeof householdStages[number]; service_tier: string; lead_advisor_id: string; review_due: string | null; summary: string; is_demo: boolean; version: number; created_by: string; updated_at: string };
export type Contact = { id: string; household_id: string; first_name: string; last_name: string; relationship: string; email: string; phone: string; version: number };
export type Task = { id: string; household_id: string; title: string; details: string; assigned_to: string; due_on: string | null; priority: "normal" | "high" | "low"; status: typeof taskStatuses[number]; version: number; meeting_id: string | null };
export type Meeting = { id: string; household_id: string; title: string; occurred_at: string; attendees: string; discussion: string; decisions: string; status: "draft" | "final"; version: number; created_by: string; finalized_by: string | null; finalized_at: string | null; supersedes_id: string | null };
export type KypLink = { id: string; household_id: string; product_name: string; identifier: string; source_kind: "simulation" | "archive"; source_metadata: { identity?: string; source_date?: string; sharing: string }; review_status: typeof reviewStatuses[number]; review_notes: string; assigned_to: string; due_on: string | null; reviewed_by: string | null; reviewed_at: string | null; version: number };
export type KypSource = { key: string; source_kind: "simulation" | "archive"; source_id: string; holding_id?: string; name: string; identifier: string; state: string };
export type AuditEvent = { id: number; actor_id: string; action: string; entity_id: string; created_at: string };
export type FinancialAccount = { id: string; household_id: string; institution: string; account_type: string; last_four: string; currency: string; balance: number | string | null; as_of: string | null };
export type CrmState = { user: { id: string; email: string; name: string }; firms: Firm[]; firm: Firm | null; role: CrmRole | null; members: Member[]; households: Household[]; householdCount: number; page: number; household: Household | null; team: string[]; accounts: FinancialAccount[]; contacts: Contact[]; tasks: Task[]; taskQueue: Task[]; meetings: Meeting[]; kyp: KypLink[]; audit: AuditEvent[]; sources: KypSource[]; householdNames: Record<string, string>; taskCount: number; kypPendingCount: number };
export function canManageFirm(role: CrmRole | null) { return role === "owner" || role === "admin"; }
export function canReviewKyp(role: CrmRole | null) { return role === "owner" || role === "admin" || role === "supervisor"; }
export function canManageHousehold(role: CrmRole | null, userId: string, household: Household | null) { return canManageFirm(role) || !!household && role === "advisor" && household.lead_advisor_id === userId; }
export function torontoToday(now = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
