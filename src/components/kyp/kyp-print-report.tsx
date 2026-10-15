import type { KypProductRecord } from "@/lib/kyp";
import { formatPrice, formatVolume } from "@/lib/types";
import { AdvisorPulseMark } from "@/components/advisor-pulse-mark";

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
    <div className="kyp-pdf-header"><div className="kyp-pdf-institution">{identity.institutionLogo ? <InstitutionLogo src={identity.institutionLogo} /> : <span>Institution logo</span>}</div><div className="kyp-pdf-report-brand"><AdvisorPulseMark compact /><p>Know Your Product report</p><h1>{title}</h1></div><div className="kyp-pdf-prepared"><span>Prepared by</span><strong>{identity.name || "Advisor name not set"}</strong><small>{new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</small></div></div>
    <div className="kyp-pdf-body">{children}</div>
    <footer className="kyp-pdf-footer"><span>AdvisorPulse by BullBrief | Advisor intelligence and reporting</span><span>{page} / {total}</span></footer>
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

function DemoFlag({ children = "Demonstration data" }: { children?: React.ReactNode }) {
  return <span className="kyp-pdf-demo-flag">{children}</span>;
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="kyp-pdf-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function FundGrowthChart() {
  return <div className="kyp-pdf-fund-chart">
    <div className="kyp-pdf-chart-legend"><span><i className="selected" />Selected fund</span><span><i className="category" />Category</span><span><i className="benchmark" />Benchmark</span></div>
    <svg viewBox="0 0 720 210" role="img" aria-label="Sample growth of ten thousand dollars">
      {[30, 75, 120, 165].map((y) => <line key={y} x1="44" y1={y} x2="700" y2={y} />)}
      <path className="benchmark" d="M44 165 C125 153, 155 145, 220 134 S330 111, 390 106 S510 74, 565 66 S650 48,700 39" />
      <path className="category" d="M44 165 C112 158, 170 143, 220 140 S315 120, 385 112 S480 91, 540 85 S642 65,700 58" />
      <path className="selected" d="M44 165 C110 150, 158 151, 220 126 S310 118, 378 94 S475 86, 535 62 S635 54,700 28" />
      <text x="4" y="169">$10K</text><text x="4" y="34">$18K</text><text x="44" y="199">2021</text><text x="668" y="199">2026</text>
    </svg>
  </div>;
}

function AllocationGraphic() {
  const items = [
    { label: "Health care", value: 72, className: "primary" },
    { label: "Technology", value: 12, className: "secondary" },
    { label: "Consumer", value: 9, className: "tertiary" },
    { label: "Cash and other", value: 7, className: "muted" },
  ];
  return <div className="kyp-pdf-allocation"><div className="kyp-pdf-donut"><span><strong>93%</strong><small>invested</small></span></div><div className="kyp-pdf-allocation-list">{items.map((item) => <div key={item.label}><span><i className={item.className} />{item.label}</span><strong>{item.value}%</strong></div>)}</div></div>;
}

function FundComparablesPrint({ title }: { title: string }) {
  const peers = [
    { name: title, code: "Selected", return5Y: "9.0%", risk: "Medium", mer: "1.32%", score: "4 / 5" },
    { name: "Maple Health Leaders F", code: "MHL401", return5Y: "9.4%", risk: "Medium", mer: "0.96%", score: "4 / 5" },
    { name: "North Harbour Global Health A", code: "NHG210", return5Y: "8.8%", risk: "Medium", mer: "1.74%", score: "3 / 5" },
    { name: "Dominion Healthcare Index", code: "DHI115", return5Y: "9.1%", risk: "Medium to high", mer: "0.55%", score: "4 / 5" },
  ];
  return <table className="kyp-pdf-table kyp-pdf-peer-table"><thead><tr><th>Comparable product</th><th>Peer score</th><th>5-year return</th><th>Risk</th><th>MER</th></tr></thead><tbody>{peers.map((peer, index) => <tr key={peer.code} className={index === 0 ? "selected" : ""}><td><strong>{peer.name}</strong><small>{peer.code}</small></td><td>{peer.score}</td><td>{peer.return5Y}</td><td>{peer.risk}</td><td>{peer.mer}</td></tr>)}</tbody></table>;
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
  const title = record.identity.name || record.requestedName; const total = 3;
  const u = record.uploadedFactsheet;
  const fundCode = record.identity.ticker || record.identity.performanceId || "Identifier pending";
  const structure = draft.structure || [u?.investmentObjective, u?.investmentStrategy].filter(Boolean).join(" ") || "Product structure has not been recorded.";
  const risks = draft.risk || u?.specificRisks || "Material risks have not been recorded.";
  const recommendation = draft.rationale || "Advisor rationale has not been completed. Review the reasonable alternatives and document why this product serves the client’s interests.";
  return <>
    <Page page={1} total={total} title={title} identity={identity}>
      <div className="kyp-pdf-cover-line"><div><p className="kyp-pdf-kicker">Investment fund KYP review</p><h3 className="kyp-pdf-page-title">Decision summary</h3><p>{title} <span>{fundCode}</span></p></div>{u ? <DemoFlag>Uploaded factsheet</DemoFlag> : <DemoFlag>Data incomplete</DemoFlag>}</div>
      <div className="kyp-pdf-decision-spine"><Metric label="Review status" value={draft.completed ? "Advisor attested" : "Assessment in progress"} note={draft.reviewContext || "New recommendation"} /><Metric label="Dealer shelf" value={draft.firmApproval || "Confirmation required"} /><Metric label="Risk level" value={u?.riskLevel || "Not available"} note="Factsheet classification" /><Metric label="Current MER" value={u?.mer != null ? `${u.mer}%` : "Not available"} note={u ? "Uploaded factsheet" : undefined} /></div>
      <div className="kyp-pdf-summary-grid"><section><Heading>Mandate and structure</Heading><p className="kyp-pdf-lead">{structure}</p><Heading>Material risks</Heading><p className="kyp-pdf-copy">{risks}</p><Heading>Advisor decision</Heading><p className="kyp-pdf-decision-copy">{recommendation}</p></section><section><Heading>Portfolio snapshot</Heading><AllocationGraphic /><div className="kyp-pdf-grid kyp-pdf-grid-4 kyp-pdf-quiet-grid"><Cell label="Fund category" value="Health Care Equity" /><Cell label="Inception" value="June 2014" /><Cell label="Fund assets" value="$1.24B" /><Cell label="Distribution" value="Quarterly" /></div></section></div>
      <div className="kyp-pdf-source-note"><strong>Evidence status</strong><span>{u ? `Extracted from ${u.fileName}. Advisor confirmation is required against the original document.` : "No uploaded factsheet is attached. Confirm every figure against current issuer disclosure and licensed provider data."}</span></div>
    </Page>
    <Page page={2} total={total} title={title} identity={identity}>
      <div className="kyp-pdf-cover-line"><div><p className="kyp-pdf-kicker">Product evidence</p><h3 className="kyp-pdf-page-title">Performance, risk and reasonable alternatives</h3></div><DemoFlag /></div>
      <div className="kyp-pdf-performance-row"><section><Heading>Growth of $10,000</Heading><FundGrowthChart /></section><section><Heading>Risk and return</Heading><div className="kyp-pdf-metric-stack"><Metric label="3-year return" value={u?.return3Y != null ? `${u.return3Y}%` : "Not available"} /><Metric label="5-year return" value={u?.return5Y != null ? `${u.return5Y}%` : "Not available"} /><Metric label="Standard deviation" value={u?.standardDeviation != null ? `${u.standardDeviation}%` : "Not available"} /><Metric label="Sharpe ratio" value={u?.sharpeRatio != null ? String(u.sharpeRatio) : "Not available"} /></div></section></div>
      <Heading>Comparable products reviewed</Heading><FundComparablesPrint title={title} />
      <div className="kyp-pdf-two kyp-pdf-analysis-notes"><div><Heading>Cost observation</Heading><p className="kyp-pdf-copy">The selected fund’s sample MER is higher than two peers. Document the service, strategy or portfolio-construction benefit that supports the additional cost.</p></div><div><Heading>Risk observation</Heading><p className="kyp-pdf-copy">All peers carry meaningful sector-concentration risk. Confirm that the client’s time horizon and loss capacity remain appropriate.</p></div></div>
    </Page>
    <Page page={3} total={total} title={title} identity={identity}>
      <div className="kyp-pdf-cover-line"><div><p className="kyp-pdf-kicker">Advisor record</p><h3 className="kyp-pdf-page-title">Assessment and supervision evidence</h3></div><span className={`kyp-pdf-status ${draft.completed ? "complete" : ""}`}>{draft.completed ? "Complete" : "Action required"}</span></div>
      <div className="kyp-pdf-assessment-grid"><section><Heading>Product understanding</Heading><Cell label="Structure and potential return" value={draft.structure} wide /><Cell label="Material risks and potential loss" value={draft.risk} wide /><Cell label="Costs and their impact" value={draft.costs} wide /><Cell label="Liquidity and complexity" value={draft.liquidityComplexity} wide /></section><section><Heading>Selection record</Heading><Cell label="Alternatives reviewed" value={draft.alternatives} wide /><Cell label="Lower-cost assessment" value={draft.lowerCostRationale} wide /><Cell label="Client-first rationale" value={draft.rationale} wide /><Cell label="Client explanation" value={draft.clientExplanation} wide /></section></div>
      <Heading>Monitoring and evidence</Heading><div className="kyp-pdf-grid kyp-pdf-monitor-grid"><Cell label="Next review date" value={draft.nextReview} /><Cell label="Monitoring plan" value={draft.changeMonitoring} /><Cell label="Evidence reviewed" value={draft.evidenceSources} wide /></div>
      <div className="kyp-pdf-signoff"><div><span>Prepared by</span><strong>{identity.name || "Advisor name not set"}</strong></div><div><span>Advisor attestation</span><strong>{draft.completedAt ? new Date(draft.completedAt).toLocaleDateString("en-CA") : "Pending"}</strong></div><div><span>Record status</span><strong>{draft.completed ? "Complete" : "Draft"}</strong></div></div>
      <div className="kyp-pdf-disclosure"><strong>Important information</strong><p>Confirm all fund information against the current Fund Facts, prospectus, issuer materials and dealer research. BullBrief supports the KYP workflow but does not establish suitability, approve a product or replace dealer supervision.</p></div>
    </Page>
  </>;
}

export function KypPrintReport({ record, draft, identity, history }: { record: KypProductRecord; draft: Draft; identity: Identity; history: HistoryPoint[] }) {
  return <div className="kyp-pdf-report hidden">{record.assetType === "stock" ? <StockPages record={record} draft={draft} identity={identity} history={history} /> : <FundPages record={record} draft={draft} identity={identity} />}</div>;
}
