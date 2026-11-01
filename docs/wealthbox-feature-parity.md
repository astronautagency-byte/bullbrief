# BullBrief CRM: Wealthbox capability plan

Reference review: October 31, 2026. This maps publicly documented Wealthbox capabilities into BullBrief's Canadian, multi-advisor workflow. It describes functional coverage, not an identical implementation or a claim of full parity. Keep BullBrief's existing interface and KYP evidence model.

## Capability map

| Capability | BullBrief status | Remaining work and acceptance criteria |
| --- | --- | --- |
| Households, people, relationship history | Available: households, primary/additional contacts, team permissions, meeting records, audit activity, search by household name | Contact-wide search, organizations/relationship graph, tags, life events, custom fields, saved segments and duplicate reconciliation |
| Imports | Available: template-based household/contact and financial account CSV preview + transactional import | Flexible column mapping, migration from other CRMs, reversible batch reconciliation, periodic balance updates and position imports |
| Opportunities | Available in this expansion: household-linked board, six stages, assignee, potential assets, currency, expected close and notes | Custom pipelines/stages, multiple value types, source attribution, probability, stage-triggered follow-ups and pipeline CSV exports |
| Workflows | Available in this expansion: editable firm templates, ordered task steps, calendar-day deadlines, assignee, saved template snapshots and progress | Per-step assignees/roles, branches, recurring work, scheduled reminders, email/event/stage-change actions, cancellation and bulk reassignment |
| Reporting | Available in this expansion: permission-scoped household/task totals, overdue work, reviews due, workflow starts and pipeline by stage/currency | Custom report builder, saved reports, exports, scheduled delivery and historical trends |
| Email and calendar | Internal calendar at `/schedule`; read-only Microsoft OAuth, encrypted private metadata cache, manual sync and disconnect implemented at `/connections`; Entra registration and live mailbox verification pending | Live mailbox verification, explicit household sharing, consent revocation in Microsoft, two-way calendar sync, event creation and conflict handling |
| AI assistant | Existing KYP draft generation and approved-note pattern support | CRM meeting preparation with citations to authorized records, reviewable proposed actions, safe execution and author-level source access |
| AI notetaker | Existing manual meeting notes and follow-up tasks; no recording/transcription | Consent-aware recording/transcript intake, grounded draft notes, suggested tasks, advisor approval and retention controls |
| Files / vault | KYP sources and archived review exports exist; no general CRM document vault | Private object storage, household ACLs, upload validation/malware handling, version history, retention, signed downloads and audit |
| Collaboration | Assigned household teams, role access, tasks, meeting records and audit | Shared feed, comments, mentions and notifications with recipient-level access enforcement |
| Administration | Multi-firm membership, invitations, role access and audit exist | SSO/MFA policy, configurable fields, retention/export policies and delegated firm administration |
| Mobile | Responsive browser application | Native applications, offline support and push notifications |
| Integrations / API | Internal authenticated CRM APIs exist | Public integration API with scoped credentials, webhooks, audit, connector-specific reconciliation and rate limits |

See `advisor-calendar.md` for the subsequent cockpit, calendar, source-backed prep, scratchpad and draft-note/follow-up implementation. General AI generation remains pending. The read-only Outlook implementation is described in `microsoft-365-setup.md`; a live connection still requires Entra registration.

## Implemented expansion

Migration `20261031060000_crm_practice.sql` adds opportunities, workflow templates/runs/steps and permission-scoped reporting. New endpoints: `GET/POST /api/crm/practice`. Mutation actions: opportunity.create/update, template.create/update and workflow.start. Only active owners/admins can change firm templates. Active members may operate on their accessible households; assignees must also have household access. All writes are server-validated, audited and idempotent. Opportunity/template edits use record versions to reject stale changes.

Workflows create all task steps atomically. Task updates enforce earlier-step completion at the database boundary, including updates through the existing task editor. A completed prerequisite cannot be reopened while a later step has started. Cancelled tasks leave later steps blocked and show Needs attention; there is no automatic cancellation or resolution policy. Dates use calendar-day offsets, not business days. Template changes only affect future runs. They do not send emails, modify calendar appointments, open accounts or approve KYP/suitability work.

Reports use SQL invoker security, so household RLS applies to every aggregate. Counts are not calculated from the visible board subset. CAD and USD estimates remain separate; no FX conversion, account funding inference or revenue/AUM claim is made. The board lists the latest 100 opportunities, workflows the latest 50 runs and templates up to 100; selectors list up to 1,000 accessible households. These limits are visible in the interface. Larger books need server-side pagination/filtering.

## Release sequence

1. Validate this pipeline/workflow/reporting expansion end-to-end in the demo firm.
2. Register the Entra app using `microsoft-365-setup.md` and verify the implemented read-only connection with an authorized test mailbox; explicit household linking remains future work.
3. Add configurable contact fields/tags and shared activity/comments, then a general document vault.
4. Add reviewed CRM AI drafts and transcript intake with explicit source boundaries.
5. Extend workflow actions/recurrence, custom reporting and integration/public API coverage.

## Source pages

- https://www.wealthbox.com/
- https://www.wealthbox.com/features/contact-management/
- https://www.wealthbox.com/features/workflows-tasks/
- https://www.wealthbox.com/features/opportunity-tracking/
- https://www.wealthbox.com/features/dashboards-reporting/
- https://www.wealthbox.com/features/meetings-calendar/

The public pages are product descriptions, not evidence that every behavior has been tested in a Wealthbox account. No Wealthbox account was accessed.

Client meeting invitation follow-up: `/schedule` now provides household contact selection, a client-facing agenda/preview, optional Teams link creation, provider acceptance receipts and duplicate-submission protection. Optional delegated `Calendars.ReadWrite` and Entra setup are required; no live invitation has been sent. Outlook remains the place for post-send rescheduling/cancellation; RSVP and reverse synchronization remain outstanding.
