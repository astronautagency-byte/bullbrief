# Calendar, meeting preparation and cockpit

This expansion follows the supplied Stitch calendar, meeting-brief and cockpit screens while using BullBrief's live CRM records. Green branding is retained in the sidebar, mobile lockup and authentication pages using a CSS treatment; the original image files are unchanged.

`/cockpit` is the practice landing workspace, with today's saved sessions, real open follow-ups and links to market research/KYP. `/brief` retains the existing market briefing. `/schedule` supports day, seven-day and thirty-day list views, calendar navigation, type filters, household search, owner assignment, agenda, location and HTTPS meeting links. Dates display in Toronto time; the form labels entry in the browser's local timezone. Each calendar range is bounded, with a visible first-250-record limit.

Appointment changes persist to `crm_appointments`, protected by household RLS and audited using the existing CRM actor context. The server binds the signed-in actor and validates inputs. The service-only RPC is idempotent, checks versions on updates, verifies firm/household ownership and active assignee access, and blocks overlapping scheduled meetings for the same owner. Adjacent sessions are allowed. Cancelled/completed sessions cannot be rescheduled through the edit form.

The prep panel shows the saved agenda, household service context, open commitments, KYP review counts and latest recorded decisions with source labels. It is source-backed preparation, not AI-generated advice or verified KYC. It does not claim custody synchronization, legal/tax conclusions or missing client facts.

Scratchpads save explicitly and use optimistic concurrency. A reviewed note can be saved as a draft CRM meeting record with an optional assigned follow-up. Record/task/link creation is one transaction, remains idempotent on retries, and leaves finalization as a separate CRM action. Once linked to a note, the scratchpad is closed to edits. Corrections are made using the existing meeting-note/amendment workflow.

Calendar `.ics` exports escape content, fold UTF-8 lines and include UTC timestamps. They are downloads only: no Outlook event or email invitation is sent. Microsoft 365 OAuth, two-way synchronization, AI note/email generation, voice capture, general document vault, reminders and additional reference-screen features remain outstanding. This release does not claim full feature parity.

Migration: `20261031070000_crm_schedule.sql` applied to the existing project. Tests: `npm run test:crm-schedule` and `npm run test:crm-schedule:db`. SQL tests run in a rolled-back transaction with synthetic users/records and cover retry idempotency, overlap/adjacency, stale scratchpad edits, household isolation, draft preservation and atomic follow-up creation.

Browser validation: created the explicitly fictional “Demo: Patel planning walkthrough” session for the demo Patel household, 10:00–10:45 Toronto time on 2026-10-31. Saved an agenda and scratchpad stating that no real client meeting or investment instruction occurred. Reviewed and saved a draft meeting record with one owner-assigned follow-up due 2026-11-02. Reload preserved the note link and closed scratchpad. Week view displayed the seven dates; list view and calendar fit a 390px viewport. The cockpit showed the session and new follow-up; completing that fictional task reduced open work from 7 to 6. Cockpit also fit a 390px viewport. Desktop viewport restored. No external messages or invitations were sent.

Cockpit task completion uses the existing authenticated task mutation, including record versions, stable retry IDs, household permissions and workflow prerequisite guards. It does not bypass ordered workflow completion.

## Read-only Microsoft connection follow-up

`/connections` now implements delegated Microsoft OAuth, private email/calendar metadata snapshots, encrypted server-side token caching, manual sync and disconnect. See `microsoft-365-setup.md`. Entra registration and live mailbox verification remain pending; this does not add two-way event synchronization or invitations.

## Client invitations follow-up

The meeting prep panel now supports selecting client contact emails (with phone details visible), adding contacts, reviewing a client-facing agenda and sending an Outlook calendar invitation with an optional generated Teams link. Internal notes are excluded. This is implemented but not live-connected: follow `microsoft-365-setup.md` for optional calendar-write authorization and the remaining live pilot gate. Accepted by Microsoft does not establish recipient delivery. Post-send rescheduling/cancellation is managed in Outlook and the BullBrief calendar remains a snapshot.

## Traditional calendar views and scheduling picker

Meetings now defaults to a Sunday-first month grid, with previous/next month and Today navigation. Week/day views show a scrollable 24-hour Toronto timeline; List view remains available. Selecting a day opens a scheduling form with that date, and selecting an hourly slot pre-fills a 45-minute appointment. Existing event buttons open the meeting preparation/details dialog; scheduled events can open the existing editor from there. Cancelled appointments are omitted from calendar event tiles; completed meetings have a muted treatment.

The scheduling/editor form includes the same month-grid date picker, month navigation and dots for visible saved meetings. Times are consistently entered in Toronto time and converted to UTC for storage. DST gaps are rejected; ambiguous fall-back wall times explicitly choose the first occurrence. There is no drag-and-drop, recurring-event or Outlook free/busy implementation in this change. Calendar dots do not establish that a whole day is unavailable, and only accessible BullBrief appointments are shown. Existing server overlap checking remains authoritative.

A six-week month is fetched in contiguous requests of at most 32 days, preserving the existing API range limit. Existing 250-record-per-request limits still apply and the UI warns when a loaded period may be truncated. Cross-midnight meetings appear on the touched days; simultaneous visible meetings use separate timeline lanes.

Verified month length/navigation, leap-year clamping, split request boundaries, Toronto summer/winter conversions, DST gaps/ambiguity, cross-midnight events and overlapping lanes in `test:crm-schedule`. Calendar database and invitation regression checks passed. Browser checks confirmed 42 month cells, selected-date changes in the form, 11:00–11:45 Toronto prefill from a week slot, event details/edit opening and a 390px calendar/dialog without horizontal page overflow. No meeting or invitation was created during the browser checks. TypeScript, targeted lint and Webpack production build passed. Screenshots: `meetings-month-calendar.png` and `meeting-scheduling-calendar.png` in the session visualization directory.
