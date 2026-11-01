# Guided KYP review

`/kyp` opens a three-step review. The Holdings & existing documents tab retains the previous workflow and imported holdings. `?product=<holding-id>` opens that existing workspace.

1. Select ETF, mutual fund or equity and a listing market. Canada adds `.TO` only for unsuffixed ETF/equity tickers. CUSIPs and dealer fund codes require a confirmed Yahoo instrument; no automatic substitution to an underlying stock or another series.
2. Fetch a server-stored Yahoo snapshot. Category suggestions come from source categories or a maintained benchmark mapping. Advisors can override the category or enter two exact alternatives. Suggested ETFs are candidates; liquidity, shelf availability and equivalence are not certified.
3. Select rationale considerations, add evidence for each, document client context and alternatives, and confirm the review. Archiving reads the stored source snapshot, not client-submitted prices or fees.

## Persistence and integrity

Apply `supabase/migrations/20261031023000_kyp_review_archive.sql` once to the existing Supabase project. The migration was applied to BullBrief during local implementation. It creates an RLS-protected append-only table; authenticated clients can only read their own records. Only the server writer can insert. Database triggers reject UPDATE and DELETE, including service-role attempts. Corrections require a new record. Project administrators still control the database and can change its schema; this is not WORM storage or a digital signature.

Required server environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only, never `NEXT_PUBLIC_`. Configured in ignored `.env.local` for this local preview. Configure separately before any production release.

Each source and review snapshot has a UUID, server UTC timestamp, database creation timestamp, account owner and SHA-256 hash. PDF and JSON exports require a Supabase-authenticated account and verify the stored document hash. Audit creation is idempotent for a request UUID. The JSON export contains the exact archived data and recorded source provenance. Browser drafts are account-scoped local storage, not the durable archive; the rationale must be reconfirmed after a reload.

## Data boundaries

Yahoo quotes may be delayed. Quote-summary uses a server-side Yahoo session cookie and crumb; these never appear in an archive or browser response. Sessions expire and are retried once after 401. Failures show null metrics, not invented figures. Ratios are stored as decimals and displayed as percentages. A reported expense ratio is not asserted to be independently verified Canadian MER; confirm issuer and dealer disclosure. Direct equities have no fund expense ratio. Beta is not a complete risk or suitability assessment. Different currencies are not FX-normalized. Three-year returns come from `fundPerformance.trailingReturns.threeYear` or `defaultKeyStatistics.threeYearAverageReturn`.

Presets are evidence-backed drafting aids, not legally vetted statements. Two comparisons do not prove a reasonable range in every case. Firm approval, KYC, client suitability, costs, retention policies and supervision remain separate responsibilities. PDF output has no editable form fields but can be altered with editing software; use the archived JSON and its digest for integrity checks. Toronto display time observes EST/EDT, while the canonical timestamp stays UTC.

## Validation

- `npm run test:kyp`: normalization, malformed symbols, missing/zero metrics, profile-session failure, peer selection, asset mismatch, rationale evidence, source authority, hash tampering, unauthenticated writes, PDF pagination and absent form fields.
- `npx tsc --noEmit` and targeted ESLint.
- Real database transaction (rolled back): owner reads, cross-account isolation, denied authenticated INSERT/UPDATE/DELETE.
- Live local Yahoo research: XIU.TO with XIC.TO and VCN.TO; quote and profile metrics displayed. No fabricated client review was permanently archived for QA.
- PDF fixture under `output/pdf/kyp-review-qa.pdf` is clearly labelled QA and rendered for visual inspection.

This is an implementation of the supplied PRD inside BullBrief, not a separate deployment or a claim of regulatory approval. Existing Prisma profile/preferences connectivity is a separate outstanding issue; the guided archive uses Supabase directly.
