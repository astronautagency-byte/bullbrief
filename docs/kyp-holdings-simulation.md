# Holdings simulation and automatic note drafting

Open `/kyp?view=simulation`. The input is the supplied `Top 20 Holdings_20261016.csv`, represented in `src/lib/kyp-top-holdings.ts`. All 20 positions retain source identifiers, report date, book weights, client counts, reported trade quantities and market values. Currency is unspecified. Client counts must not be summed across securities and trade quantity must not be treated as units held.

## Workflow

1. **Simulate all 20 holdings** fetches current candidate research, checks available Morningstar CUSIPs, and saves 11 editable template sections for each holding in Supabase. Exact CUSIP matches, candidates, mismatches and unresolved fund series are distinct states. GOOG is the candidate for Alphabet Class C; MSFT.NE is the candidate for the Microsoft CDR. The parent MSFT security is not substituted. CDR and ETF class matches are not inferred from the parent issuer.
2. **AI draft remaining holdings** processes template rows sequentially and saves each successful result. Existing advisor-edited or AI-drafted rows are preserved by the batch. A single-row replacement is an explicit action. Stop waits for the current request; failures leave existing notes in place.
3. **Save edited draft** persists advisor edits with an optimistic version check. Another tab's edits cannot be silently overwritten.
4. **Fill KYP drafts for all holdings** creates the existing KYP documents and fills blank sections. Previously generated text can be refreshed only if it still exactly matches its recorded baseline. Manual edits and completed records are preserved. Imported notes remain labelled simulation drafts; firm approval, review trigger and completion are not inferred.

Templates cover direct equity, banks, pipelines, energy, technology, partnerships, ETFs, funds, investment savings, private credit, CDRs and power. These are review checklists, not proof of a product's legal structure or risk exposure. Candidate market facts are excluded from the source-holding notes until the source identifier is matched. Alternatives are explicitly labelled benchmark alternative actions; direct peer equivalence and dealer availability require advisor review.

## Learning writing patterns

The spreadsheet contains no historical note examples. Initial drafts therefore use built-in rules, not a learned advisor history.

An advisor can paste up to three **anonymized, approved** product notes and approve their use with Groq. The AI extracts suggested style rules concerning tone, organization, attribution and handling of gaps. The advisor reviews and approves those rules before saving a named pattern. Pattern versions are new records. Future drafts use the selected approved rules and relevant examples as context. This is few-shot drafting, not fine-tuning or model training. Example facts, client circumstances and prior decisions must not be transferred to another product. No automatic ingestion of every edit is performed.

The AI context includes source product identity, matched public research, public alternative candidates, a review-checklist type and selected approved writing examples. **Book weights, client counts, market values, quantities and client circumstances are excluded.** Source evidence containing those book figures is composed deterministically on the server after AI drafting. Advisors must remove confidential information from pasted examples before approving them for AI use.

## Storage and access

Apply `supabase/migrations/20261031030000_kyp_simulation_notes.sql` once. It has been applied to the existing BullBrief Supabase project. `kyp_simulation_runs` and `kyp_note_patterns` use owner-scoped RLS; authenticated clients can read only their own records. Server routes authenticate the user, validate inputs and use a server-only service-role writer with explicit owner filters. Simulation notes are editable drafts and never enter the append-only compliance archive automatically.

Required environment is the existing Supabase URL, anon key, server service-role key, and `GROQ_API_KEY`. Optional `RAPIDAPI_MORNINGSTAR_KEY` enables CUSIP corroboration. Yahoo source timestamps are independent of the historical CSV date. Missing data or failed provider identity requests remain visible gaps.

## Checks

- `npm run test:kyp-simulation` covers 20 holdings/220 sections; exact class/CDR candidate handling; unsupported fund identities; source/candidate separation; private-field exclusion from AI requests; approval requirements; optimistic locking; authenticated editing; preservation of manual notes and completed reviews.
- `npm run test:kyp` covers the guided archive and PDF regression checks.
- Database tests use rolled-back transactions to confirm own-record visibility, cross-account isolation and denied client mutations for both new tables.
- Live simulation and AI generation are verified separately from deterministic template tests. All output requires advisor verification before any completed review is recorded.

## Generation quality checks

AI drafts retain per-section provenance. Common unsupported strength/performance assertions, claims that reviews or approvals already occurred, and percentages not present in supplied public evidence fall back to the deterministic section template. Unresolved instruments retain template wording for structure, costs and liquidity. The source-evidence section is always server-composed. The UI identifies fallback sections and the reason; the model is not a substitute for checking all factual or legal statements. Older AI drafts without the current safety marker are eligible for re-drafting; advisor-edited drafts remain protected.

Rate-limited requests return retry guidance. Batches wait and retry a holding up to three times, preserving successful drafts, and stop on a version conflict. Closing the tab stops client orchestration; saved results remain available and the remaining template rows can be resumed. Starting a new simulation creates a new server record rather than editing the original input.

## Verified sample run (October 30, 2026)

The supplied 20-holding extract produced 220 populated sections and 20 saved AI-assisted draft records. The final run showed 9 exact provider identifier matches, 7 provisional candidates and 4 holdings requiring source documents. The Microsoft CAD CDR retained identifier `59516M104` and unverified-identity template wording; MSFT parent-stock facts were excluded. Evidence checks were rerun after generation, and 209 newly filled KYP fields were refreshed only where they still matched generated baselines. Existing notes were preserved. The populated CDR KYP document displayed the simulation banner and 9 of 11 required fields, leaving review trigger and dealer approval unconfirmed.

A live style-extraction smoke check used only an explicitly synthetic example and returned 6 suggested writing rules. It did not create an approved user pattern. No historical advisor examples were supplied, so the actual holding drafts used the built-in rules. Database isolation checks, both test scripts, targeted lint, TypeScript and the final production build passed. The app changes remain local; this was not a public deployment or a completed compliance review.

The final evidence pass retained deterministic templates for risk, total costs, liquidity, conflicts and lower-cost conclusions because the holdings extract does not supply the necessary issuer/dealer evidence. It also retained unresolved-instrument rationale templates. Sixty-nine remaining generated sections were replaced on the final pass; the unchanged generated KYP fields were refreshed afterward. Per-section provenance distinguishes those templates from AI wording. A responsive check confirmed a 390px viewport with no horizontal page overflow.
