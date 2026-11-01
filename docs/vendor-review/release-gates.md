# Control evidence and live-client release gates

Status: 31 October 2026. “Implemented in source” is narrower than “verified in production.” Owner roles below are proposed; no assignment or approval is implied.

| Gate | Current evidence / gap | Proposed owner | Exit evidence |
|---|---|---|---|
| Dealer approval | Manulife Wealth internal process and permitted use unknown | Firm sponsor + dealer compliance | Written decision naming the product/version, permitted data and workflows, restrictions and review cadence |
| Privacy/legal | Current public privacy page is outdated and does not describe the CRM adequately | Privacy lead + counsel | Approved notice, processing agreement, lawful purposes, rights procedure, incident duties, subprocessors, liability/insurance and termination terms |
| Data residency | Runtime, database, storage, backups, logs, support access locations not verified | Infrastructure lead | Provider evidence for every location and cross-border flow; dealer acceptance |
| Identity | Supabase authentication exists; application-enforced MFA and enterprise SSO have not been established | Security lead | MFA/SSO decision and enforcement tests, session/idle expiry, revocation and recovery tests, privileged accounts protected |
| Tenant isolation | CRM RLS, role/household checks and database test scripts exist | Engineering + independent tester | Deployed-policy inventory, negative cross-firm/user tests including exports/archives/invites, service-role review |
| Browser storage | New KYP sensitive draft state moved to tab memory; old copies retained untouched; other browser storage remains | Engineering + privacy lead | Full storage inventory, legacy-copy handling, logout/account-switch and shared-device tests; approved server draft design if required |
| External AI | Both Groq HTTP entry points and all three Gemini HTTP entry points now fail closed unless explicitly enabled | Engineering + privacy/dealer reviewers | Approved provider terms, actual retention/training settings, permitted purposes, per-firm authorization, minimization/redaction tests; human review retained |
| Recordkeeping | Audit triggers, finalized-note protections and hash-checked KYP archives exist | Compliance + engineering | Record-category retention schedule, legal holds, correction/versioning, audit-read/export coverage, tamper-resistance assessment and regulator/dealer retrieval exercise |
| Resilience | Provider backups/restore and recovery objectives not verified | Infrastructure lead | Agreed RPO/RTO, backup/restore evidence, incident and business-continuity exercises |
| Incident response | No complete operational response program verified | Security/privacy lead | Named contacts, detection/escalation, breach register, legal/regulatory notification decision process, vendor notification SLA, tabletop exercise |
| Microsoft and messaging | OAuth and invitation safeguards exist; live authorization/delivery not verified | Engineering + Microsoft tenant admin | Approved scopes, token/key rotation, disconnect/revocation tests, controlled recipient send/reconcile tests, sender and content approval |
| Independent security review | No independent assessment established | Independent assessor | Threat model and penetration-test scope, findings, remediation and retest evidence |
| Deployment operations | Hosting permissions, logs, secrets, dependency and change management not fully reviewed | Engineering/security lead | Production access inventory, secret rotation, log redaction/retention, alerting, vulnerability process and rollback exercise |

## Order of work

1. Complete a fictional-data control audit and gather dealer requirements.
2. Implement MFA/session policy, approved server drafts and full data lifecycle controls; verify deployed database boundaries.
3. Finalize vendor/privacy/incident agreements and real infrastructure evidence.
4. Obtain independent testing, remediate findings and run recovery exercises.
5. Obtain documented approval, then conduct a tightly scoped authorized live-client pilot with rollback and incident contacts.

## Legal/reference basis for review (not an opinion of counsel)

- Manulife identifies Manulife Wealth Inc. as an investment and mutual fund dealer registered with CIRO: https://www.manulife.com/ca/en/about-us/legal
- CIRO outsourcing guidance discusses dealer due diligence, contracts and ongoing oversight: https://www.ciro.ca/newsroom/publications/outsourcing-arrangements-0
- OPC cloud guidance explains continuing accountability when information is outsourced: https://www.priv.gc.ca/en/privacy-topics/technology/gd_cc_201206
- OPC breach guidance describes reporting, individual notification and recordkeeping: https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/privacy-breaches-at-your-business/gd_pb_201810/?seq_no=2

Confirm applicable dealer rulebook, record classes, deadlines and provincial/federal requirements with counsel and Manulife. Do not apply a blanket seven-year retention period to all data or promise immediate deletion of legally required records. This package does not replace dealer approval or constitute certification.
