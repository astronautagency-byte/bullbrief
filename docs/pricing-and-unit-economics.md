# BullBrief can support enterprise margins with disciplined data licensing

Prepared October 14, 2026. All prices are in Canadian dollars unless stated otherwise.

## Executive summary

- Position BullBrief as an advisor workflow and compliance productivity platform, not a consumer market-data subscription.
- Lead with a paid 90-day design partner pilot at **$15,000 for up to 50 advisors**.
- Price the standard advisor product at **$149 monthly**, or **$119 monthly on an annual commitment**.
- Use annual volume pricing from **$99 to $55 per advisor per month**, with implementation fees and a **$60,000 minimum annual contract** for dealer deployments.
- Target **70% or better gross margin**. At the recommended 250-seat enterprise price of $69, total cost of revenue must stay below $20.70 per advisor per month.
- Do not sign a fixed enterprise price until Morningstar confirms commercial display, caching, PDF generation, and redistribution rights. The current RapidAPI subscription price is not enough to establish those rights.

## Recommended commercial model

| Offer | Price | Intended buyer | Included scope |
| --- | ---: | --- | --- |
| Design partner pilot | $15,000 for 90 days | Dealer or regional advisor group | Up to 50 advisors, branded workspace, KYP workflow, onboarding, weekly feedback sessions, pilot results summary |
| Advisor Pro monthly | $149 per advisor per month | Individual advisor | Advisor desktop, portfolio monitoring, KYP records, research, client briefing tools, Bull AI |
| Advisor Pro annual | $119 per advisor per month | Individual or small practice | Same product, billed annually |
| Practice | $99 per advisor per month | 10 to 49 advisors | Pooled usage, practice administration, shared branding, priority support, $2,500 onboarding |
| Dealer | $89 per advisor per month | 50 to 249 advisors | Central administration, policy configuration, reporting, $10,000 implementation |
| Enterprise | $69 per advisor per month | 250 to 999 advisors | SSO planning, dealer controls, audit support, service review, $25,000 implementation |
| Enterprise scale | From $55 per advisor per month | 1,000 or more advisors | Negotiated data entitlements, support and security terms, custom implementation |

Enterprise contracts should be annual and invoiced. Apply a $60,000 annual platform minimum where the seat calculation would otherwise be lower. Keep custom integrations, data migration, SSO, security review support, and bespoke reporting outside the seat price.

### Pilot structure for Manulife advisors

The strongest offer for tomorrow is a paid design partner engagement:

1. 50 advisors for 90 days.
2. $15,000 pilot fee.
3. Branded advisor workspace and KYP workflow included.
4. Success measures: weekly active advisors, KYP records completed, time to prepare a client conversation, research reuse, and advisor satisfaction.
5. Credit $7,500 of the pilot fee against a 12-month agreement signed within 30 days of pilot completion.

This avoids an unpaid proof of concept while giving Manulife a low-risk path to validate workflow fit.

## Current run-cost baseline

The model uses a planning exchange rate of **US$1.00 = C$1.40**. Replace this with actual invoice rates before approval.

| Cost area | Planning basis | Estimated monthly cost |
| --- | --- | ---: |
| Vercel Pro | US$20 platform fee, including US$20 usage credit | $28 |
| Supabase Pro | US$25, including one Micro project through compute credit | $35 |
| Marketstack Professional | US$49.99 for 100,000 requests | $70 |
| Taddy Pro | US$75 for 100,000 requests | $105 |
| News API allowance | Marketaux contract or equivalent | $70 |
| Morningstar allowance | Placeholder until commercial quote is confirmed | $210 |
| Monitoring, transactional email and incident allowance | Planning allowance | $100 |
| **Estimated fixed platform cost** |  | **$618 per month** |

Use **$650 per month** as the operating baseline for planning. This excludes salaries, sales, legal work, compliance consulting, enterprise security tooling, taxes, and customer-specific integrations.

The application currently contains a Mediastack credential but its active news routes use Marketaux and RSS. Do not pay for both Marketaux and Mediastack unless each has a distinct production role.

## Variable cost assumptions

| Cost driver | Base assumption per active advisor per month | Planning cost |
| --- | --- | ---: |
| Groq AI | 440 interactions, about 2,000 input and 500 output tokens each | $0.40 |
| Hosting and database overage reserve | Normal advisor use with caching | $2.00 |
| Market and news data reserve | Shared cached requests | $3.00 |
| Morningstar data allowance | Must be validated by contract | $10.00 |
| Support and customer success allocation | Blended enterprise support | $4.00 |
| Billing and administration | Annual invoice allocation | $1.00 |
| **Modeled variable cost** |  | **$20.40** |

Groq's current GPT-OSS 120B price is US$0.15 per million input tokens and US$0.60 per million output tokens. AI generation is therefore not the primary cost risk. Licensed financial data and customer support are the material drivers.

### Required caching rule

Morningstar research should be cached by security and effective date, then reused across advisors. The current integration requests stock details with `cache: "no-store"`. At scale, repeated page views could create unnecessary paid requests and unpredictable margins.

Recommended policy:

- Intraday price: cache for 1 to 5 minutes, subject to the market-data agreement.
- Company fundamentals: cache for 24 hours.
- Fund facts and ratings: cache until the provider's next published effective date, or refresh daily.
- Generated KYP record: store the exact source values and as-of date used for the record.
- Refresh manually only when an advisor explicitly requests current data.

Caching must comply with Morningstar and market-data licensing terms.

## Unit economics

### Per-seat contribution

| Tier | Monthly price | Modeled variable cost | Contribution per seat | Contribution margin before fixed platform cost |
| --- | ---: | ---: | ---: | ---: |
| Advisor Pro monthly | $149 | $25, including card fees | $124 | 83% |
| Advisor Pro annual | $119 | $23 | $96 | 81% |
| Practice | $99 | $22 | $77 | 78% |
| Dealer | $89 | $21 | $68 | 76% |
| Enterprise | $69 | $20.40 | $48.60 | 70% |
| Enterprise scale | $55 | $18 | $37 | 67% |

The enterprise-scale tier only works if data is cached, support is standardized, and Morningstar costs remain within the allowance.

### Monthly scenarios

| Scenario | Advisors | Average seat price | Seat revenue | Variable cost | Fixed platform cost | Gross profit | Gross margin |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Early paid practices | 50 | $119 | $5,950 | $1,150 | $650 | $4,150 | 70% |
| Enterprise launch | 250 | $69 | $17,250 | $5,100 | $650 | $11,500 | 67% |
| Enterprise scale | 1,000 | $55 | $55,000 | $18,000 | $1,500 | $35,500 | 65% |

Implementation fees are excluded from these recurring-margin calculations. They should cover onboarding and customer-specific work, not subsidize an unprofitable subscription.

## Break-even view

There are two useful break-even definitions:

1. **Platform break-even:** At the $119 annual price and $96 contribution per seat, approximately **7 active seats** cover the modeled $650 monthly platform baseline.
2. **Company break-even:** A lean operating budget of $20,000 per month requires approximately **412 enterprise seats** at $48.60 contribution per seat. A $45,000 monthly team requires approximately **926 enterprise seats**.

Formula:

`Break-even seats = monthly operating expense / contribution per seat`

Founder compensation, development, sales, legal, insurance, compliance expertise, and security work must be included in the company break-even target. A platform-only calculation is not a profitability forecast.

## Margin guardrails

At the $69 enterprise price, a 70% gross-margin target permits total cost of revenue of **$20.70 per advisor per month**.

After reserving $8 per advisor for infrastructure, AI, support, and administration, the maximum affordable Morningstar and licensed-data cost is approximately **$12.70 per advisor per month**.

If the licensed-data quote exceeds that ceiling, use one or more of these levers:

- Raise enterprise pricing.
- Add a separately priced KYP and research module.
- Set contracted usage pools for KYP records or unique securities.
- Pass through customer-specific data entitlements.
- Let the institution provide its existing Morningstar entitlement where permitted.

## Recommendation

Use the paid pilot to prove time savings and workflow adoption, then sell an annual dealer agreement. Do not compete on low-cost market data. Sell the reduction in research preparation time, more consistent KYP records, branded advisor output, and a single advisor-facing workflow across markets, news, research, and compliance documentation.

Before issuing a binding enterprise quote:

1. Obtain a Morningstar commercial quote covering display, caching, generated PDFs, audit retention, and enterprise redistribution.
2. Add provider-level request metering and cost reporting.
3. Cache Morningstar research and shared market data.
4. Remove unused paid providers.
5. Set hard monthly spend alerts for infrastructure and every metered API.
6. Confirm whether enterprise SSO, audit logs, data residency, and security requirements change the infrastructure tier.

## Source notes

- [Vercel Pro](https://vercel.com/docs/plans/pro-plan): US$20 monthly platform fee, US$20 usage credit, 1 TB Fast Data Transfer and 10 million Edge Requests included.
- [Supabase pricing](https://supabase.com/pricing): Pro starts at US$25 per month and includes US$10 in compute credit for one Micro project.
- [Marketstack pricing](https://marketstack.com/pricing): Professional is US$49.99 monthly for 100,000 requests. Business is US$149.99 for 500,000 requests.
- [Taddy pricing](https://taddy.org/developers/pricing): Pro is US$75 monthly for 100,000 API requests. Business is US$150 for 350,000 requests.
- [Groq GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b): US$0.15 per million input tokens and US$0.60 per million output tokens.
- Morningstar cost and redistribution rights remain unverified and require a direct commercial quote.

