# Canadian Product-Risk Audit (Counsel Review Draft)

This is a product and engineering risk review, not legal advice, a legal opinion, or a certification of compliance.

## Controls implemented in this change

- General-information disclaimer is shown globally; it states that content is not investment advice, a recommendation, or an offer.
- AI prompts prohibit personalized recommendations, trading instructions, suitability conclusions, and position-sizing advice.
- Unsupported “real-time” and institutional/compliance claims were removed from key watchlist, market, subscription, research, and calculator surfaces.
- Watchlist quotes preserve venue, currency, observation time, data status, and Yahoo Finance source. Delayed data is labeled “Delayed”; otherwise it is “Unknown,” not real-time.
- News retains publisher attribution. Users are prompted to verify important information with primary sources.
- Signed-in watchlists and account records use HTTP-only sessions and account-scoped server storage; the data file is written with owner-only permissions. Device-local caches are scoped by account.
- Users can export profile, watchlist, and billing data with an informational-use disclaimer.
- Users can permanently delete the server-side account record after an explicit confirmation.
- The product remains read-only and does not expose order-entry or broker-routing controls.

## Policy and operational matters requiring counsel/owner decisions

- Determine whether the product’s AI labels, “bias,” conviction scores, alerts, or advisor-oriented workflows could constitute advice, a recommendation, or registrable activity in any intended province or user segment. Product copy alone cannot resolve this.
- Approve complete Terms of Use, privacy notice, AI disclosure, market-data attribution/licensing language, limitation-of-liability language, conflicts disclosure, and complaint/escalation process.
- Define the legal basis and consent flow for account processing, analytics, cookies, email marketing, and preference withdrawal. The current product has no marketing subscription workflow.
- Establish identity verification and production authentication. The current demo accepts a profile without validating credentials; the HTTP-only session protects synchronization but is not a production identity system.
- Define retention, backup deletion, legal hold, breach response, access-correction timelines, and deletion exceptions. The current delete control removes the active JSON account record only; operational backups are outside this repository.
- Select a Canadian data-residency/hosting posture, encryption-at-rest/key-management standard, audit logging, access controls, rate limiting, CSRF protection, session revocation policy, and security monitoring.
- Confirm Yahoo Finance and publisher licensing/redistribution rights, permitted delay labels, exchange attribution, and whether professional/non-display usage requires separate agreements.
- Validate all historical/performance displays against sourced data. Several dashboard datasets are illustrative mock data and should be visibly labeled or replaced before production use.
- Define conflicts policies for subscriptions, issuer relationships, sponsored content, affiliate compensation, model/provider incentives, and any future brokerage integration.
- Review invoice/export formatting, tax requirements, accessibility, French-language obligations, CASL workflows, provincial consumer-protection requirements, and Quebec-specific requirements where applicable.

## Release recommendation

Do not characterize this build as “compliant” or production-ready based on these controls. Require legal, privacy, security, data-licensing, and operational review before a Canadian public launch.
