import type { KypProductRecord } from "@/lib/kyp";
import { formatPrice, formatVolume } from "@/lib/types";

type Draft = {
  reviewContext: string; firmApproval: string; structure: string; risk: string; costs: string;
  liquidityComplexity: string; conflicts: string; alternatives: string; lowerCostRationale: string;
  rationale: string; clientExplanation: string; changeMonitoring: string; evidenceSources: string;
  nextReview: string; completed: boolean; completedAt: string;
};

type HistoryPoint = { date: string; close: number; volume: number };
type Identity = { name: string; institutionLogo: string };

const NA = "Not available";

function Cell({ label, value, wide = false }: { label: string; value?: string | number | null; wide?: boolean }) {
  return <div className={wide ? "kyp-pdf-cell kyp-pdf-wide" : "kyp-pdf-cell"}><span>{label}</span><strong>{value === null || value === undefined || value === "" ? NA : value}</strong></div>;
}

function Page({ children, page, total, title, identity }: { children: React.ReactNode; page: number; total: number; title: string; identity: Identity }) {
  return <div className={`kyp-pdf-page${page === total ? " kyp-pdf-last" : ""}`}>
    <div className="kyp-pdf-header"><div className="kyp-pdf-institution">{identity.institutionLogo ? <InstitutionLogo src={identity.institutionLogo} /> : <span>Institution logo</span>}</div><div><p>Know Your Product report</p><h1>{title}</h1></div><div className="kyp-pdf-prepared"><span>Prepared by</span><strong>{identity.name || "Advisor name not set"}</strong><small>{new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</small></div></div>
    <div className="kyp-pdf-body">{children}</div>
    <footer className="kyp-pdf-footer"><span>Created using BullBrief - Your Daily Market Brief is Here</span><span>{page} / {total}</span></footer>
  </div>;
}

function InstitutionLogo({ src }: { src: string }) {
  // The user-supplied image can be a local data URL, including SVG.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" />;
}

function Heading({ children }: { children: React.ReactNode }) { return <h2 className="kyp-pdf-heading">{children}</h2>; }

function LineChart({ points }: { points: HistoryPoint[] }) {
  if (points.length < 2) return <div className="kyp-pdf-chart-empty">Historical price series unavailable</div>;
  const sample = points.filter((_, index) => index % Math.max(1, Math.floor(points.length / 80)) === 0);
  const prices = sample.map((point) => point.close);
  const min = Math.min(...prices); const max = Math.max(...prices); const span = max - min || 1;
  const path = sample.map((point, index) => `${index ? "L" : "M"} ${(index / (sample.length - 1)) * 700} ${150 - ((point.close - min) / span) * 130}`).join(" ");
  return <div className="kyp-pdf-chart"><svg viewBox="0 0 700 175" role="img" aria-label="Historical price chart"><line x1="0" y1="150" x2="700" y2="150" /><line x1="0" y1="20" x2="0" y2="150" /><path d={path} fill="none" stroke="#168a46" strokeWidth="3" /><text x="4" y="169">{new Date(sample[0].date).getFullYear()}</text><text x="650" y="169">{new Date(sample.at(-1)!.date).getFullYear()}</text><text x="6" y="15">{formatPrice(max)}</text><text x="6" y="145">{formatPrice(min)}</text></svg></div>;
}

function BarChart({ items }: { items: Array<{ label: string; value: number | null }> }) {
  const max = Math.max(1, ...items.map((item) => Math.abs(item.value || 0)));
  return <div className="kyp-pdf-bars">{items.map((item) => <div key={item.label}><span>{item.label}</span><i><b style={{ width: item.value == null ? "0" : `${Math.max(4, Math.abs(item.value) / max * 100)}%` }} /></i><strong>{item.value == null ? "N/A" : item.value.toFixed(2)}</strong></div>)}</div>;
}

function StyleBox({ style }: { style: string | null }) {
  const labels = ["Large value", "Large core", "Large growth", "Mid value", "Mid core", "Mid growth", "Small value", "Small core", "Small growth"];
  const selected = style?.toLowerCase().replace("blend", "core") || "";
  return <div className="kyp-style-box">{labels.map((label) => <div key={label} className={selected === label.toLowerCase() ? "active" : ""}>{label}</div>)}</div>;
}

function DraftSummary({ draft }: { draft: Draft }) {
  return <>
    <div className="kyp-pdf-grid"><Cell label="Review trigger" value={draft.reviewContext} /><Cell label="Dealer shelf status" value={draft.firmApproval} /><Cell label="Structure, features and potential return" value={draft.structure} wide /><Cell label="Material risks and potential loss" value={draft.risk} wide /><Cell label="Costs and impact" value={draft.costs} wide /><Cell label="Liquidity and complexity" value={draft.liquidityComplexity} wide /><Cell label="Material conflicts" value={draft.conflicts} wide /></div>
    <Heading>Alternatives and recommendation rationale</Heading>
    <div className="kyp-pdf-grid"><Cell label="Comparison 1" value={draft.alternatives} /><Cell label="Comparison 2" value={draft.alternatives} /><Cell label="Comparison 3" value={draft.alternatives} /><Cell label="Lower-cost alternative assessment" value={draft.lowerCostRationale} wide /><Cell label="Rationale for choosing this product" value={draft.rationale} wide /><Cell label="Plain-language client explanation" value={draft.clientExplanation} wide /><Cell label="Next review date" value={draft.nextReview} /><Cell label="Monitoring plan" value={draft.changeMonitoring} wide /><Cell label="Evidence reviewed" value={draft.evidenceSources} wide /></div>
  </>;
}

function StockPages({ record, draft, identity, history }: { record: KypProductRecord; draft: Draft; identity: Identity; history: HistoryPoint[] }) {
  const f = record.facts; const m = record.morningstar; const title = record.identity.name || record.requestedName; const total = 4;
  return <>
    <Page page={1} total={total} title={title} identity={identity}>
      <div className="kyp-pdf-title-row"><div><p className="kyp-pdf-kicker">Equity detail report</p><h3>{title} <span>{record.identity.ticker || record.symbol}</span></h3><p>{m.profileDescription || NA}</p></div><div className="kyp-pdf-price"><span>Current reference price</span><strong>{f.price == null ? NA : `${f.currency || ""} ${formatPrice(f.price)}`}</strong></div></div>
      <Heading>Issuer profile and KYP essentials</Heading>
      <div className="kyp-pdf-grid kyp-pdf-grid-4"><Cell label="Issuer" value={title} /><Cell label="CUSIP" value={m.cusip} /><Cell label="ISIN" value={m.isin} /><Cell label="Primary exchange" value={record.identity.exchange} /><Cell label="Sector" value={f.sector} /><Cell label="Industry" value={f.industry} /><Cell label="P/E" value={f.pe?.toFixed(2)} /><Cell label="Dividend yield" value={f.dividendYield == null ? null : `${f.dividendYield.toFixed(2)}%`} /><Cell label="52-week low" value={f.fiftyTwoWeekLow == null ? null : formatPrice(f.fiftyTwoWeekLow)} /><Cell label="52-week high" value={f.fiftyTwoWeekHigh == null ? null : formatPrice(f.fiftyTwoWeekHigh)} /><Cell label="Market capitalization" value={f.marketCap == null ? null : formatVolume(f.marketCap)} /><Cell label="Shares outstanding" value={m.sharesOutstanding == null ? null : formatVolume(m.sharesOutstanding)} /></div>
      <div className="kyp-pdf-two"><div><Heading>Price performance</Heading><LineChart points={history} /></div><div><Heading>Equity style</Heading><StyleBox style={m.styleBox} /><div className="kyp-pdf-range"><span>52-week range</span><i><b style={{ left: f.price != null && f.fiftyTwoWeekLow != null && f.fiftyTwoWeekHigh != null ? `${Math.max(0, Math.min(100, (f.price - f.fiftyTwoWeekLow) / (f.fiftyTwoWeekHigh - f.fiftyTwoWeekLow || 1) * 100))}%` : "0%" }} /></i><small>{f.fiftyTwoWeekLow == null ? "N/A" : formatPrice(f.fiftyTwoWeekLow)} to {f.fiftyTwoWeekHigh == null ? "N/A" : formatPrice(f.fiftyTwoWeekHigh)}</small></div></div></div>
    </Page>
    <Page page={2} total={total} title={title} identity={identity}>
      <div className="kyp-pdf-two"><div><Heading>Profitability analysis</Heading><BarChart items={[{ label: "Return on assets", value: m.returnOnAssets }, { label: "Return on equity", value: m.returnOnEquity }, { label: "Return on capital", value: m.returnOnCapital }]} /></div><div><Heading>Financial position</Heading><div className="kyp-pdf-grid"><Cell label="Quick ratio" value={m.quickRatio?.toFixed(2)} /><Cell label="Current ratio" value={m.currentRatio?.toFixed(2)} /><Cell label="Interest coverage" value={m.interestCoverage?.toFixed(2)} /><Cell label="Trading volume" value={f.volume == null ? null : formatVolume(f.volume)} /></div></div></div>
      <Heading>Valuation analysis</Heading><div className="kyp-pdf-grid kyp-pdf-grid-4"><Cell label="Price / earnings" value={f.pe?.toFixed(2)} /><Cell label="Price / book" value={f.priceToBook?.toFixed(2)} /><Cell label="Price / sales" value={f.priceToSales?.toFixed(2)} /><Cell label="Price / cash flow" value={f.priceToCashFlow?.toFixed(2)} /><Cell label="Trailing dividend yield" value={f.dividendYield == null ? null : `${f.dividendYield.toFixed(2)}%`} /><Cell label="Forward dividend yield" value={m.forwardDividendYield == null ? null : `${m.forwardDividendYield.toFixed(2)}%`} /><Cell label="Total yield" value={m.totalYield == null ? null : `${m.totalYield.toFixed(2)}%`} /><Cell label="Fair value" value={f.fairValue == null ? null : `${m.fairValueCurrency || f.currency || ""} ${formatPrice(f.fairValue)}`} /></div>
      <Heading>Close competitors</Heading><table className="kyp-pdf-table"><thead><tr><th>Company</th><th>Ticker</th><th>Exchange</th><th>Comparison status</th></tr></thead><tbody>{m.competitors.length ? m.competitors.map((item) => <tr key={item.ticker}><td>{item.name}</td><td>{item.ticker}</td><td>{item.exchange}</td><td>Review as a reasonable alternative</td></tr>) : <tr><td colSpan={4}>{NA}</td></tr>}</tbody></table>
      <Heading>Analyst research</Heading><div className="kyp-pdf-grid"><Cell label="Analyst report" value={m.analystReportTitle} wide /><Cell label="Analyst" value={m.analystName} /></div>
    </Page>
    <Page page={3} total={total} title={title} identity={identity}><p className="kyp-pdf-kicker">Advisor assessment</p><h3 className="kyp-pdf-page-title">Product due diligence and selection record</h3><DraftSummary draft={draft} /></Page>
    <Page page={4} total={total} title={title} identity={identity}><Heading>Record notes and disclosures</Heading><div className="kyp-pdf-grid"><Cell label="Evidence recorded by advisor" value={draft.evidenceSources} wide /></div><Heading>Important information</Heading><p className="kyp-pdf-copy">BullBrief is a workflow aid and does not approve a product, establish suitability or replace dealer supervision. Confirm product facts against current issuer disclosure, the dealer-approved product shelf and applicable policies before making or maintaining a recommendation. Past performance does not guarantee future results. Market values and third-party research can change without notice.</p></Page>
  </>;
}

function FundPages({ record, draft, identity }: { record: KypProductRecord; draft: Draft; identity: Identity }) {
  const title = record.identity.name || record.requestedName; const f = record.facts; const total = 6;
  const unavailableBars = ["US equity", "Canadian equity", "International equity", "Fixed income", "Cash", "Other"].map((label) => ({ label, value: null }));
  return <>
    <Page page={1} total={total} title={title} identity={identity}><p className="kyp-pdf-kicker">Investment fund detail report</p><h3 className="kyp-pdf-page-title">Fund profile and KYP essentials</h3><div className="kyp-pdf-grid"><Cell label="Product name" value={title} wide /><Cell label="Fund company" /><Cell label="Fund code / CUSIP" value={record.identity.ticker || record.identity.performanceId} /><Cell label="Manager / subadvisor" /><Cell label="PortfolioAid risk rating" /><Cell label="Investment objective" value={draft.structure} wide /><Cell label="Time horizon" /><Cell label="Current MER" /><Cell label="Management fee" /><Cell label="Discounts / householding" /><Cell label="Performance fees and calculation" value={draft.costs} wide /><Cell label="Unique features" value={draft.structure} wide /><Cell label="Historical performance and outlook" wide /></div></Page>
    <Page page={2} total={total} title={title} identity={identity}><Heading>Portfolio</Heading><div className="kyp-pdf-two"><div><Heading>Asset allocation</Heading><BarChart items={unavailableBars} /></div><div><Heading>Equity style box</Heading><StyleBox style={null} /><Heading>Fixed-income style</Heading><StyleBox style={null} /></div></div><div className="kyp-pdf-two"><div><Heading>World regions</Heading><BarChart items={[{ label: "Americas", value: null }, { label: "Europe", value: null }, { label: "Asia", value: null }]} /></div><div><Heading>Stock sectors</Heading><BarChart items={[{ label: "Cyclical", value: null }, { label: "Sensitive", value: null }, { label: "Defensive", value: null }]} /></div></div><Heading>Bond statistics and sectors</Heading><div className="kyp-pdf-grid kyp-pdf-grid-4"><Cell label="Effective duration" /><Cell label="Effective maturity" /><Cell label="Weighted coupon" /><Cell label="Weighted price" /><Cell label="Government" /><Cell label="Municipal" /><Cell label="Corporate" /><Cell label="Securitized" /></div></Page>
    <Page page={3} total={total} title={title} identity={identity}><Heading>Morningstar ratings, risk and fees</Heading><div className="kyp-pdf-grid kyp-pdf-grid-4"><Cell label="Overall rating" value={f.starRating ? `${f.starRating} / 5` : null} /><Cell label="Overall risk" /><Cell label="Overall return" /><Cell label="Morningstar category" /><Cell label="3-year rating and risk" /><Cell label="5-year rating and risk" /><Cell label="10-year rating and risk" /><Cell label="MER / expense ratio" /></div><Heading>Risk and return profile</Heading><div className="kyp-pdf-grid kyp-pdf-grid-4"><Cell label="Standard deviation" /><Cell label="Mean return" /><Cell label="Sharpe ratio" /><Cell label="Up capture" /><Cell label="Down capture" /><Cell label="Alpha" /><Cell label="Beta" /><Cell label="R-squared" /></div><Heading>Performance</Heading><LineChart points={[]} /><div className="kyp-pdf-grid kyp-pdf-grid-4"><Cell label="1-year return" /><Cell label="3-year return" /><Cell label="5-year return" /><Cell label="10-year return" /></div></Page>
    <Page page={4} total={total} title={title} identity={identity}><Heading>Strategy and special-product features</Heading><div className="kyp-pdf-grid"><Cell label="Investment objective and strategy" value={draft.structure} wide /><Cell label="Specific risks" value={draft.risk} wide /><Cell label="Alternative fund: maximum leverage" /><Cell label="Leverage notes and use" value={draft.liquidityComplexity} /><Cell label="Shorting approach" /><Cell label="ETF: bid / ask" value={f.bid == null && f.ask == null ? null : `${formatPrice(f.bid)} / ${formatPrice(f.ask)}`} /><Cell label="ETF: trading volume and liquidity" value={f.volume == null ? null : formatVolume(f.volume)} /><Cell label="Premium / discount to NAV" /><Cell label="Tracking error" /><Cell label="LSIF tax credit features" /><Cell label="Valuation policy" wide /></div></Page>
    <Page page={5} total={total} title={title} identity={identity}><p className="kyp-pdf-kicker">Advisor assessment</p><h3 className="kyp-pdf-page-title">Product due diligence and selection record</h3><DraftSummary draft={draft} /></Page>
    <Page page={6} total={total} title={title} identity={identity}><Heading>Record notes and disclosures</Heading><div className="kyp-pdf-grid"><Cell label="Evidence recorded by advisor" value={draft.evidenceSources} wide /></div><Heading>Important information</Heading><p className="kyp-pdf-copy">Confirm all fund information against the current Fund Facts, prospectus, issuer materials and dealer research. Review material changes, costs, liquidity, leverage, conflicts and reasonable alternatives. Past performance does not guarantee future results. BullBrief is a workflow aid and does not replace KYP, KYC, suitability, conflicts or supervision obligations.</p></Page>
  </>;
}

export function KypPrintReport({ record, draft, identity, history }: { record: KypProductRecord; draft: Draft; identity: Identity; history: HistoryPoint[] }) {
  return <div className="kyp-pdf-report hidden">{record.assetType === "stock" ? <StockPages record={record} draft={draft} identity={identity} history={history} /> : <FundPages record={record} draft={draft} identity={identity} />}</div>;
}
