# Data inventory and flows

Scope: repository inspection, 31 October 2026. Production regions, contracts, provider console configuration, actual records and backups have not been inspected. No secrets are included in this inventory.

| Data | Flow / potential destination | Repository evidence | Required verification |
|---|---|---|---|
| Account identity and session | Browser → Next application → Supabase Auth; legacy local auth also exists | `src/lib/supabase/server.ts`, `src/lib/auth.ts`, auth API routes | Actual auth architecture, MFA/SSO, cookie/session policy, reset/recovery, sign-out/revocation |
| Households, contacts, notes, tasks, account imports, appointments | Browser → CRM API → Supabase Postgres | `src/app/api/crm`, `supabase/migrations/20261031040000_advisor_crm.sql` and later CRM migrations | Deployed RLS, firm/household isolation, privileged service-role use, data classification, region, encrypted transport/storage |
| CRM audit history | Record mutations → before/after JSON in audit tables | `crm_audit_change` triggers; subsequent migrations | Sensitive duplicate data, actor coverage, tamper resistance, administrator access, retention, retrieval |
| KYP draft rationale, holdings, extracted factsheet state | Browser tab memory; explicit archives go through server storage | `src/lib/privacy/transient-drafts.ts`, KYP components, `src/lib/kyp-review/store.ts` | Reload-loss UX, archive/export completeness, legacy local copies, user/firm separation, no sensitive drafts in diagnostics |
| Uploaded PDF / extracted facts / rendered PDF pages | Browser and upload API; potential external Groq extraction/assessment | `src/app/api/kyp/upload-factsheet`, `src/app/api/kyp/ai-assessment`, Groq client | File validation, resource limits, temporary file lifecycle, filenames/metadata, malicious documents, external-processing policy |
| Product research and note-pattern examples | Application → product sources; potential Groq processing of facts and free-text examples | `src/lib/kyp-simulation/ai.ts`, `src/lib/providers/groq/client.ts` | Examples can contain personal information despite a public-data intent. Data minimization and approved processing terms are required. Groq and Gemini currently gated off by default. |
| Chat prompts and generated responses | Browser → assistant API → potential external Groq or Gemini model | `src/app/api/assistant/route.ts` | User prompts can contain personal data; scope, logging, retention and authorization must be reviewed. Groq and Gemini currently gated off by default. |
| Outlook metadata, appointments, OAuth tokens | Microsoft Graph ↔ Next application ↔ private Supabase tables | `src/lib/microsoft`, Microsoft migrations | Actual authorization/tenant consent, required scopes, token/cached-content encryption, key rotation, expiry/purge, disconnect behavior |
| Meeting invites / recipient addresses | Reviewed send action → Microsoft Graph → recipients and their calendar systems | `src/app/api/crm/invitations`, `src/lib/microsoft/invitations.ts` | Wrong-recipient controls, minimum invitation content, real delivery/reconciliation, dealer-authorized organizer, metadata exposure |
| Logs / errors / telemetry | Application and hosting platform; diagnostics providers if enabled | Provider/CRM error handling; deployment configuration not inspected | No note bodies, PDFs, tokens, identifiers or AI prompts in logs; access, region and retention |
| Backups / exports / downloaded PDFs | Provider backups and user devices | Backup configuration not inspected; app export/report features | Backup region and encryption, restore evidence, legal holds, user-download handling, destruction and termination export |

## Expected architecture boundaries

Browser ↔ application hosting ↔ Supabase is the core client-record path. Application hosting, Supabase, Microsoft, Groq and Gemini are distinct review subjects. Research data APIs and any analytics/error-monitoring services also need inclusion in the actual subprocessor inventory. Whether each organization is legally a processor, service provider or other recipient must be established contractually.

A Canadian database location alone does not establish where server execution, logs, backups, support access or external AI processing occur. Fill these from provider evidence rather than inferring them from marketing claims.

## Data minimization for the pilot

Exclude SINs, government ID images, bank/custodian credentials, account passwords, medical information, payment details and real-client transcripts. Do not paste client data into support tickets, AI examples or test fixtures. Use `.invalid` addresses and reserved fictional phone numbers; do not send test invitations to uncontrolled recipients.
