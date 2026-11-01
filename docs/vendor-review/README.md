# BullBrief vendor review package

Prepared: 31 October 2026. Intended pilot: Ontario advisors operating through Manulife Wealth Inc. Status: **internal preparation, fictional data only; not submitted, certified or approved**.

The user confirmed that no real client information has been entered. This is a statement of intended/current use, not an independently audited database inventory. Manulife Wealth's internal approval criteria and permitted software list have not been obtained. No communication has been sent to Manulife.

## Review materials

- [Data inventory and flows](data-flows.md)
- [Control evidence and release gates](release-gates.md)
- [Questions and draft request for the dealer](dealer-review-request.md)

## Current operational limits

- Use fictional households, contacts, holdings and notes. No real mailbox or transcript integration during preparation.
- The visible demo notice is guidance, not a content filter or technical prevention of entering personal information. Existing CRM create/import endpoints still accept valid entries.
- New KYP draft/holding/factsheet state is tab-memory only. Reloading the tab clears that unsaved state; archive server records before relying on a durable record. Account identity changes and the app's logout clear tab-memory drafts. No server records were deleted.
- Legacy localStorage copies are no longer read for these KYP keys. They have not been erased or migrated. Before a controlled pilot, inventory and securely remove/export old copies under an approved process. Other features still use local storage, including preferences, report identity and portfolio watchlist settings; a complete browser-storage inventory remains a gate.
- All Groq and Gemini network calls are blocked unless `BULLBRIEF_EXTERNAL_AI_ENABLED` is exactly `true`, independently of whether an API key exists. Some deterministic extraction/template features can continue. This environment variable is a technical switch, not legal approval, an individual consent mechanism, or a per-firm policy engine. Do not enable it for client data until the review gates are satisfied.
- Supabase server archives, CRM records, audit history and Microsoft connection records remain separate from tab-memory drafts. Their deployed controls and retention must be verified.

## Evidence standard

A code control is not evidence that its migration has been deployed, that the hosting service is configured correctly, or that an independent test passed. Mark each gate with its owner, environment, evidence date, artifact and reviewer. No live-client release until all applicable gates are approved by authorized stakeholders. A vendor's SOC report does not certify BullBrief or establish dealer approval.

## Validation of this preparation change

On 31 October 2026: `npm run test:privacy`, KYP review, KYP simulation and CRM API suites passed, as did TypeScript, targeted ESLint, `git diff --check` and the production build. Privacy tests cover no persistent-storage access by the draft adapter, server-render safety, account changes/logout clearing and zero Groq/Gemini HTTP calls when the gate is unset or not exactly `true`. A local assistant API smoke check returned 503 with the policy explanation. Browser inspection confirmed the notice and that a synthetic unsaved ticker edit disappeared after reload. These are local application checks, not an independent assessment or production audit.
