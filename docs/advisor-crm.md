# Advisor CRM — first firm release

## Product scope

The first release serves Canadian advisory firms with multiple advisors and staff. Its core workflow is:

**Firm → household team → contacts → meeting note → assigned follow-up → household KYP review → activity trail.**

The reference is [AdvisorEngine CRM](https://www.advisorengine.com/wealth-management-technology/crm), particularly contact management, practice workflows and dashboards. AdvisorEngine's broader [digital onboarding](https://www.advisorengine.com/wealth-management-technology/digital-onboarding) and [client portal](https://www.advisorengine.com/wealth-management-technology/client-portal) are later scope here. Custodian connectivity, account opening, e-signatures, email/calendar synchronization, billing and client portals are not implemented by this first release.

## What is implemented

- `/crm`, with desktop and mobile navigation.
- Real Supabase-backed firm workspaces and memberships; no in-memory CRM store.
- Households with stage, service tier, lead advisor, explicit household team, review date and service context.
- Household contacts with name, relationship, email and phone. Contact labels do not establish a statutory/legal designation or verified KYC.
- Draft meeting notes with attendees, discussion, decisions and optional assigned follow-up. Notes and follow-ups save in one database transaction.
- Final meeting notes protected against update/delete by a database trigger. Corrections use new amendments referencing the original record.
- Tasks with assignee, due date, priority, workflow status and completion timestamp; a firm service queue shows the next 100 accessible open tasks.
- Household KYP references with reviewer, due date, evidence notes and review workflow. Simulation references cannot be signed off as reviewed. Archived product references require owner/admin/supervisor sign-off and a recorded review basis.
- Append-only activity events recording actor, before/after data and server timestamp.
- Email-bound, seven-day invitation links. No invitation email is sent by this implementation. New teammates must authenticate with the invited email before accepting. Disabled invitation issuers cannot grant access, and disabled members cannot reuse old invitations to rejoin.
- Request idempotency and version checks to prevent duplicate notes/tasks and stale overwrites.

## Access model

| Role | Household visibility | Administration / review |
| --- | --- | --- |
| Owner | Entire firm | Firm team administration; household management; archived-product review |
| Admin | Entire firm | Household management; advisor/staff access administration; archived-product review |
| Supervisor | Entire firm | Archived-product review; shared household work; no team administration |
| Advisor | Assigned households | Shared household work; lead advisors can manage their household/team |
| Staff | Assigned households | Contacts, authored meeting records, tasks and open KYP workflow work |

Members can author household meeting notes and manage shared work where they have access. Only a note's author or a firm owner/admin can edit or finalize its draft. Reviewed KYP work cannot be reopened by advisor/staff roles. The owner cannot be demoted or disabled through this screen. Disabled members lose this firm's access, but historical attribution and records remain. Existing private KYP sources outside the CRM are not silently transferred into firm ownership.

RLS enforces firm and household reads. Authenticated clients cannot write tables directly or invoke actor-parameter mutation functions. Server routes authenticate the Supabase user and invoke service-only transactional functions. The actor comes from the verified session, never the request body. Every assignment must be to an active member with household access. Foreign keys include firm IDs to prevent cross-firm references.

## KYP privacy boundary

The top-20 CSV is aggregate practice-level product coverage. It does not identify individual households, clients, accounts, allocations or balances. No actual client identities or financial accounts are inferred from it.

A household attachment shares product name, identifier, source state/date and the household review notes explicitly entered by the advisor. It excludes the private original simulation notes, archived notes, book values and client counts. The original source must belong to the attaching user. Archived source hashes are verified before their metadata can be attached. Product-reference tracking does not establish an actual household position, dealer approval or suitability.

A later controlled publication/document-sharing workflow will be needed if full private source documents are to become firm-owned evidence. Current reviewers can record household review work and an externally reviewed evidence basis, while the original private source remains access-controlled.

## Setup and operations

Apply, in order, to the existing BullBrief project:

1. `supabase/migrations/20261031040000_advisor_crm.sql`
2. `supabase/migrations/20261031040500_crm_review_permissions.sql`

Both were applied during implementation. They depend on the earlier KYP archive and simulation migrations. Runtime uses the existing Supabase URL/anon key and server-only `SUPABASE_SERVICE_ROLE_KEY`. Optional `CRM_INVITE_SECRET` can separate invite token derivation from the service key; the token hash alone is stored. The mutations do not depend on the older localhost Prisma database. Existing profile/preferences database connectivity remains separate from this CRM implementation.

Create a real firm with its actual name, then add contacts and households. Or choose **Explore a fictional sample practice**. The latter creates an explicitly marked demo firm, two fictional households/contacts and sample tasks; it creates no other authentication accounts, sends no messages and connects no financial accounts.

Firm owners can create invite links, then share them with the named recipient through their chosen channel. Advisors/staff receive no household access until assigned. Team administrators can disable members and reassign outstanding work. Invitation callbacks survive the login/signup flow; confirmation-required signup responses are displayed rather than silently treated as a completed sign-in.

## Routes and boundaries

- `GET /api/crm`: membership-scoped firms, paginated household search, selected household, work queues, members and private-source metadata options.
- `POST /api/crm/action`: validated CRM actions, same-origin check, authenticated actor, request UUID and transactional dispatch.
- `GET /api/crm/invite`: invitation details only after the authenticated email matches.
- `POST /api/crm/invite`: explicit authenticated invitation acceptance.

Households paginate at 25. Other lists are bounded: 100 tasks/contacts/KYP references/activity events, 50 meeting records, 300 team members, and 30 recent archived KYP sources. The service queue explicitly labels its 100-task limit. Larger-firm paging and search for the other collections are follow-up work. No email delivery, calendar creation, automated reminders, client account sync or regulatory certification is implied.

## Validation

- `npm run test:crm`: input/date validation, role capabilities, callback protection, authenticated actor binding, cross-origin denial, idempotency handoff and deterministic hashed invite links with no email sending.
- `npm run test:crm:db`: transactional live-database tests. All synthetic users, firms, memberships and records roll back. Covers firm/household isolation, disabled membership, access assignment, atomic notes/tasks, retry idempotency, version conflicts, final-note immutability, amendments, private KYP source protection, supervisory review restrictions, email-bound invitations, disabled inviters, RLS and denied client writes.
- Existing `npm run test:kyp` and `npm run test:kyp-simulation` remain regression checks.
- TypeScript, targeted lint, production build and browser workflow checks.

The browser walkthrough uses the labelled demo practice. It records a clearly synthetic draft meeting, creates a DYN3361 disclosure follow-up with it, and attaches a product-reference metadata record marked **needs evidence**. No actual client discussion, advice or product approval is fabricated. No real teammate invitation is issued during QA.

## Browser verification result

The labelled demo firm loaded from saved storage after a full reload with 2 fictional households, 3 open service tasks and 1 pending KYP review. A synthetic draft meeting and its DYN3361 disclosure follow-up saved together; the follow-up was updated to in progress. The DYN3361 reference remained a simulation marked needs evidence, with private source notes and book totals excluded. The household activity trail displayed the saved note, task creation/update and KYP attachment with actor/timestamps. No meeting note was finalized and no teammate invitation was issued by the browser walkthrough. A 390px mobile viewport had no horizontal page overflow; desktop sizing was restored afterward.

## CSV imports and financial accounts

Firm owners and admins can use **Import CSV** at `/crm`. This is a template-based, add-only importer, not a custodian connection. Download a blank template, fill the named columns (any order), upload or paste CSV, preview all values, then confirm the save. Files are limited to 500 KB / 200 records. UTF-8 BOM, CRLF, quoted commas/newlines and escaped quotes are supported. Headers, dates, email, currency, balances and account types are validated on the server.

Household imports create one household with an optional primary contact per row. Choose the lead advisor before previewing. Required fields: external_id, name, stage and service_tier. All template columns must be present; contact columns may be blank. The source ID must be a stable, non-sensitive reference unique across that firm's household imports. Existing names block the batch for manual review; there is no automatic matching or merging. Imported household stages are source data, not a KYC assessment.

Account imports require an existing CRM household_id (shown in its Accounts tab), institution, account_type, last_four, currency and external_id. Use a non-sensitive source reference; never put a full account number in it. Account source keys are scoped by institution and firm. Optional balance is a plain decimal, with an explicit as_of date. CAD, USD, EUR and GBP are supported; currency conversion and aggregate AUM are not performed. No security positions are inferred from the aggregate top-20 holdings file. The Accounts tab displays up to 200 records per household and keeps currency and valuation dates visible.

Imports preserve a receipt keyed by authenticated actor and request ID. A repeated source key with identical values is skipped; changed values block instead of overwriting. Potential duplicate accounts (household + institution + type + last four) are blocked, including duplicates within one file. The user must reconcile collisions manually; balance updates and source remapping are not part of this first importer. Preview creates no records. Its hash must still match at commit, and the whole batch rolls back if any row fails. Household and account changes enter the existing audit trail. Client credentials have read-only account access under household RLS; import RPC execution is service-only and restricted to active owners/admins.

Applied migrations: `20261031050000_crm_imports.sql` and `20261031050500_crm_import_household_scope.sql`. The follow-up explicitly verifies that account target households exist in the selected firm during preview, in addition to the database's composite foreign key.

Validation: `npm run test:crm-import` checks CSV parsing, duplicates, validation, mandatory preview and API actor/origin handling. `npm run test:crm-import:db` checks preview-only behavior, idempotency, unchanged-source skipping, changed-source and name/account collision rejection, cross-firm isolation, atomic rollback, stale preview rejection, account audit and client RPC privileges. Database QA creates synthetic users/records inside a transaction and rolls everything back.

Browser verification (local `/crm`, authenticated demo firm): imported the clearly fictional Demo - Patel import household and its Taylor Patel contact, then a Fictional Demo Institution TFSA ending 4242 with CAD 25,000.00 as of 2026-10-30. Full-page reload preserved the records. Uploading the same account CSV through the native file picker produced 0 creates / 1 unchanged skip. Blank account template download was verified in Downloads. At a 390px viewport, document width stayed 390px and the import dialog was 352px wide; desktop viewport restored afterward. No real client/account data was imported, and no public frontend deployment was performed.

## Opportunities, workflows and practice reporting

The Wealthbox-inspired expansion is described in `wealthbox-feature-parity.md`, including the remaining scope. `/crm?view=pipeline`, `/crm?view=workflows` and `/crm?view=reports` open the new sections directly. Microsoft 365 / Outlook is the selected email/calendar provider; `microsoft-365-setup.md` documents the implemented read-only OAuth connection, encrypted private metadata cache, manual sync and disconnect at `/connections`. No live mailbox is connected: Entra registration and authorized mailbox verification remain pending.

Migration `20261031060000_crm_practice.sql` has been applied. Test commands: `npm run test:crm-practice` and `npm run test:crm-practice:db`. The latter creates synthetic users/records and rolls back every change. Coverage includes cross-firm and same-firm household isolation, permission-scoped aggregate reporting, active-assignee checks, idempotent workflow starts, ordered task completion, protection of completed prerequisites, template snapshots and stale opportunity edits.

Browser demo verification: saved “Demo: Patel planning opportunity” for the fictional Patel household with CAD 150,000 potential assets, moved Discovery → Proposal and verified target date 2026-12-15. Saved “Demo onboarding checklist” from the editable starter, started its four ordered tasks on 2026-10-31, and completed only the first fictional step. The second step unlocked; the third and fourth stayed disabled. This demonstration does not represent client instructions, actual client verification or a suitability decision.

Full browser reload preserved the workflow at 1/4 complete and the second step remained available. Reports showed 3 accessible households, 1 workflow, 1 done / 1 in-progress / 5 open tasks, and 1 CAD 150,000 Proposal opportunity. Pipeline, workflow and report views each fit a 390px viewport with document width 390px; desktop viewport restored. Screenshot: `crm-workflows.png` in the session visualization folder. Public frontend deployment, Outlook OAuth, calendar/email sync, generalized vault and full Wealthbox feature parity remain outstanding.
