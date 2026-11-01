# BullBrief functional readiness — 2026-10-31

The next milestone is a working advisor pilot: create a household and contacts, schedule a meeting, send and manage its invitation, capture a reviewed note, assign follow-ups and preserve the activity trail. This is not a claim of production readiness or complete competitor parity.

## Verified foundation

The automated KYP review/simulation, CRM, import, workflow/pipeline, calendar, Microsoft OAuth and invitation checks pass. All six CRM/Microsoft transactional database suites pass; their synthetic records roll back. These checks cover authenticated actors, role/household boundaries, optimistic concurrency and idempotency, workflow sequencing, private provider caches and invitation receipts. Provider calls in automated tests are mocked. No live Microsoft mailbox has been authorized and no real invitation delivery has been verified.

The browser audit found and repaired a contact-creation integration bug: the meeting panel posted mutations to `/api/crm` instead of `/api/crm/action`. The panel now supports adding and editing contacts inline, requires email for invitation contacts, preserves phone details and reuses the mutation request ID on uncertain retries. Missing Microsoft setup, absent/expired connections and missing calendar-write permission disable sending with an actionable explanation. Invitation-load failures have an explicit retry action.

Saving or rescheduling a meeting now selects its Toronto calendar date and writes the firm/date/appointment into the URL, so a meeting on another day is visible immediately and can be reopened after a reload. Saving remains separate from sending an invitation.

## Priorities to make the pilot operational

1. **Activate and verify Microsoft.** Complete `microsoft-365-setup.md`, authorize an eligible test organizer, send to a controlled test recipient and confirm the actual Outlook invitation, Teams join URL and time zone. Store credentials privately. This external setup is the immediate gate to live invitation sending.
2. **Complete the invitation lifecycle.** Add reviewed reschedule/cancel operations and RSVP/provider reconciliation. Today those operations happen in Outlook; BullBrief deliberately keeps the original snapshot and blocks conflicting local changes after submission. Uncertain submissions require reconciliation, not blind retries.
3. **Meeting intake and reviewed notes.** Add manual transcript import first, then Teams/Zoom webhook ingestion after their authorization and public callback setup. Preserve the source, suggest household matching, apply firm note templates, and propose drafts/tasks for advisor review. External AI processing must be explicitly enabled for the selected source; imported text must not become an instruction to the app or an automatically finalized record.
4. **Run a multi-user pilot.** Verify owner/advisor/staff views with controlled accounts, end-to-end task ownership and completion, failed/expired invitation recovery, real login/reset flows and separate firms. Add operational error monitoring, restore/export exercises and agreed retention settings before real client rollout.

Client portals, SMS reminders, document vault/e-signatures, custodian integration and billing are later additions. A phone field alone does not enable SMS. Existing internal workflow automation creates tasks; it does not send messages or approve KYP work.

## Browser verification in the fictional demo firm

Created `Demo Jordan Patel` from the meeting panel with a `.invalid` email and reserved fictional phone, then edited the phone inline to `+1 416 555 0101`. Created `Demo: Functional workflow check` for November 3, 2026, 11:00–11:45 Toronto time while viewing November 2. The calendar switched to November 3 and the URL retained its firm/date/appointment. No invitation was sent. These are demonstration records, not evidence of a real client meeting.
