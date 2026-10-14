import type { KypProductRecord } from "@/lib/kyp";
import { formatPercent, formatPrice, formatVolume } from "@/lib/types";
import { Check, Plus } from "lucide-react";

const EMPTY = "Not available";

function ValueCell({ label, value, note }: { label: string; value?: string | number | null; note?: string }) {
  const available = value !== null && value !== undefined && value !== "";
  return (
    <div className="border-t border-outline-variant pt-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
      <p className={available ? "mt-1 text-xs font-semibold text-on-surface" : "mt-1 text-[11px] text-on-surface-variant"}>{available ? value : EMPTY}</p>
      {note && <p className="mt-1 text-[10px] leading-4 text-on-surface-variant">{note}</p>}
    </div>
  );
}

function ReportSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="research-section border-t border-outline-variant py-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-[9px] font-bold text-primary">{number}</span>
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function StockReport({ record }: { record: KypProductRecord }) {
  const f = record.facts;
  const m = record.morningstar;
  const percent = (value: number | null) => value == null ? null : `${value.toFixed(2)}%`;
  return (
    <div className="research-report">
      <ReportSection number="01" title="Company profile and research snapshot">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCell label="Sector" value={f.sector} />
          <ValueCell label="Industry" value={f.industry} />
          <ValueCell label="Stock style" value={m.styleBox} />
          <ValueCell label="Employees" value={m.employees == null ? null : formatVolume(m.employees)} />
          <ValueCell label="Economic moat" value={f.economicMoat} />
          <ValueCell label="Morningstar rating" value={f.starRating ? `${f.starRating} / 5` : null} />
          <ValueCell label="Market capitalization" value={f.marketCap == null ? null : formatVolume(f.marketCap)} />
          <ValueCell label="Fair value" value={f.fairValue == null ? null : `${f.currency || ""} ${formatPrice(f.fairValue)}`} />
          <ValueCell label="Current price" value={f.price == null ? null : `${f.currency || ""} ${formatPrice(f.price)}`} />
          <ValueCell label="Daily change" value={f.changePercent == null ? null : formatPercent(f.changePercent)} />
          <ValueCell label="CUSIP" value={m.cusip} />
          <ValueCell label="ISIN" value={m.isin} />
        </div>
        {m.profileDescription && <p className="mt-4 border-t border-outline-variant pt-3 text-[11px] leading-5 text-on-surface-variant">{m.profileDescription}</p>}
      </ReportSection>

      <ReportSection number="02" title="Growth, profitability and financial position">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCell label="Return on assets" value={percent(m.returnOnAssets)} />
          <ValueCell label="Return on equity" value={percent(m.returnOnEquity)} />
          <ValueCell label="Return on capital" value={percent(m.returnOnCapital)} />
          <ValueCell label="Quick ratio" value={m.quickRatio?.toFixed(2)} />
          <ValueCell label="Current ratio" value={m.currentRatio?.toFixed(2)} />
          <ValueCell label="Interest coverage" value={m.interestCoverage?.toFixed(2)} />
          <ValueCell label="Shares outstanding" value={m.sharesOutstanding == null ? null : formatVolume(m.sharesOutstanding)} />
          <ValueCell label="Dividend schedule" value={m.dividendMonths.length ? m.dividendMonths.map((month) => new Date(2000, month - 1).toLocaleString("en-CA", { month: "short" })).join(", ") : null} />
        </div>
      </ReportSection>

      <ReportSection number="03" title="Valuation analysis">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCell label="Price / earnings" value={f.pe?.toFixed(2)} />
          <ValueCell label="Price / book" value={f.priceToBook?.toFixed(2)} />
          <ValueCell label="Price / sales" value={f.priceToSales?.toFixed(2)} />
          <ValueCell label="Price / cash flow" value={f.priceToCashFlow?.toFixed(2)} />
          <ValueCell label="Dividend yield" value={f.dividendYield == null ? null : `${f.dividendYield.toFixed(2)}%`} />
          <ValueCell label="Forward dividend yield" value={percent(m.forwardDividendYield)} />
          <ValueCell label="Total yield" value={percent(m.totalYield)} />
          <ValueCell label="Fair value" value={f.fairValue == null ? null : formatPrice(f.fairValue)} />
          <ValueCell label="Bid / ask" value={f.bid == null && f.ask == null ? null : `${formatPrice(f.bid)} / ${formatPrice(f.ask)}`} />
          <ValueCell label="Average volume" value={f.averageVolume == null ? null : formatVolume(f.averageVolume)} />
        </div>
      </ReportSection>

      <ReportSection number="04" title="Stock performance, risk and comparables">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCell label="52-week range" value={f.fiftyTwoWeekLow == null ? null : `${formatPrice(f.fiftyTwoWeekLow)} to ${formatPrice(f.fiftyTwoWeekHigh)}`} />
          <ValueCell label="Morningstar report" value={m.analystReportTitle} note={m.analystName ? `Analyst: ${m.analystName}` : undefined} />
          <ValueCell label="Close competitors" value={m.competitors.length ? m.competitors.map((item) => `${item.ticker} ${item.name}`).join("; ") : null} />
        </div>
      </ReportSection>
    </div>
  );
}

type FundPeer = {
  name: string;
  code: string;
  category: string;
  score: number;
  return3Y: number;
  return5Y: number;
  return10Y: number | null;
  risk: "Low to medium" | "Medium" | "Medium to high";
  mer: number;
  process: "High" | "Above average" | "Average";
  people: "High" | "Above average" | "Average";
  parent: "High" | "Above average" | "Average";
  esg: "Low" | "Medium" | "High";
};

const DEMO_PEERS: FundPeer[] = [
  { name: "Maple Health Leaders F", code: "MHL401", category: "Health Care Equity", score: 4, return3Y: 10.8, return5Y: 9.4, return10Y: 8.7, risk: "Medium", mer: 0.96, process: "High", people: "Above average", parent: "High", esg: "Medium" },
  { name: "North Harbour Global Health A", code: "NHG210", category: "Health Care Equity", score: 3, return3Y: 9.9, return5Y: 8.8, return10Y: 7.9, risk: "Medium", mer: 1.74, process: "Above average", people: "High", parent: "Above average", esg: "Low" },
  { name: "Dominion Healthcare Index", code: "DHI115", category: "Health Care Equity", score: 4, return3Y: 11.2, return5Y: 9.1, return10Y: null, risk: "Medium to high", mer: 0.55, process: "High", people: "Average", parent: "Above average", esg: "Medium" },
];

function ScoreDots({ value }: { value: number }) {
  return <span className="inline-flex gap-1" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((item) => <span key={item} className={`h-2 w-2 rounded-full ${item <= value ? "bg-primary" : "bg-outline-variant"}`} />)}
  </span>;
}

function AssessmentMark({ value }: { value: FundPeer["process"] }) {
  const strong = value === "High";
  return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-on-surface"><span className={`h-2 w-2 rounded-full ${strong ? "bg-primary" : value === "Above average" ? "bg-primary/60" : "bg-on-surface-variant/35"}`} />{value}</span>;
}

function FundComparables({ record, recordedAlternatives, onRecordAlternative }: { record: KypProductRecord; recordedAlternatives?: string; onRecordAlternative?: (name: string) => void }) {
  const selectedName = record.identity.name || record.requestedName;
  const selectedCode = record.identity.ticker || record.identity.performanceId || "Selected";
  const columns = [
    { name: selectedName, code: selectedCode, selected: true, category: "Health Care Equity", score: 4, return3Y: 10.4, return5Y: 9.0, return10Y: 8.2, risk: "Medium" as const, mer: 1.32, process: "High" as const, people: "Above average" as const, parent: "High" as const, esg: "Medium" as const },
    ...DEMO_PEERS.map((peer) => ({ ...peer, selected: false })),
  ];
  const rows: Array<{ label: string; render: (peer: typeof columns[number]) => React.ReactNode }> = [
    { label: "Peer score", render: (peer) => <ScoreDots value={peer.score} /> },
    { label: "3-year return", render: (peer) => `${peer.return3Y.toFixed(1)}%` },
    { label: "5-year return", render: (peer) => `${peer.return5Y.toFixed(1)}%` },
    { label: "10-year return", render: (peer) => peer.return10Y == null ? "Not available" : `${peer.return10Y.toFixed(1)}%` },
    { label: "Risk level", render: (peer) => peer.risk },
    { label: "MER", render: (peer) => `${peer.mer.toFixed(2)}%` },
    { label: "Process", render: (peer) => <AssessmentMark value={peer.process} /> },
    { label: "People", render: (peer) => <AssessmentMark value={peer.people} /> },
    { label: "Parent", render: (peer) => <AssessmentMark value={peer.parent} /> },
    { label: "ESG risk", render: (peer) => peer.esg },
  ];

  return (
    <ReportSection number="05" title="Comparable funds">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold text-on-surface">Reasonable alternatives</p><p className="mt-1 max-w-2xl text-[11px] leading-5 text-on-surface-variant">Compare mandate, cost, risk and long-term results before documenting why the selected product is reasonable.</p></div>
        <span className="w-fit rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-warning">Demonstration data</span>
      </div>
      <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-outline-variant bg-surface-container-low [scrollbar-gutter:stable]">
        <table className="min-w-[920px] w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-40 border-b border-r border-outline-variant bg-surface-container-low px-4 py-4 text-[9px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Assessment</th>
              {columns.map((peer) => (
                <th key={peer.code} className={`min-w-44 border-b border-outline-variant px-4 py-4 align-top ${peer.selected ? "bg-primary/[0.08]" : ""}`}>
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-[9px] uppercase tracking-wide text-primary">{peer.selected ? "Selected fund" : peer.code}</span>{peer.selected && <Check className="h-3.5 w-3.5 text-primary" />}</div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-on-surface">{peer.name}</p>
                  <p className="mt-1 text-[10px] text-on-surface-variant">{peer.category}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => <tr key={row.label} className="border-b border-outline-variant/70 last:border-0">
              <th className="sticky left-0 z-10 border-r border-outline-variant bg-surface-container-low px-4 py-3 text-[10px] font-semibold text-on-surface-variant">{row.label}</th>
              {columns.map((peer) => <td key={peer.code} className={`px-4 py-3 text-[11px] font-medium text-on-surface ${peer.selected ? "bg-primary/[0.05]" : ""}`}>{row.render(peer)}</td>)}
            </tr>)}
            <tr>
              <th className="sticky left-0 z-10 border-r border-outline-variant bg-surface-container-low px-4 py-3 text-[10px] font-semibold text-on-surface-variant">KYP evidence</th>
              <td className="bg-primary/[0.05] px-4 py-3 text-[10px] text-on-surface-variant">Product under review</td>
              {columns.slice(1).map((peer) => {
                const recorded = Boolean(recordedAlternatives?.includes(peer.name));
                return <td key={peer.code} className="px-4 py-3"><button onClick={() => onRecordAlternative?.(peer.name)} disabled={recorded || !onRecordAlternative} className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-2.5 py-1.5 text-[10px] font-semibold text-on-surface transition hover:border-primary hover:text-primary disabled:cursor-default disabled:border-primary/30 disabled:text-primary"><Plus className="h-3 w-3" />{recorded ? "Recorded" : "Record alternative"}</button></td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-on-surface-variant">Sample values demonstrate the workflow only. Replace them with licensed provider data before using this comparison for advice or compliance evidence.</p>
    </ReportSection>
  );
}

function FundReport({ record, recordedAlternatives, onRecordAlternative }: { record: KypProductRecord; recordedAlternatives?: string; onRecordAlternative?: (name: string) => void }) {
  const f = record.facts;
  return (
    <div className="research-report">
      <ReportSection number="01" title="Portfolio and asset allocation">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCell label="Asset allocation" note="Equity, fixed income, cash and other exposure." />
          <ValueCell label="Investment style" note="Equity and fixed-income style positioning." />
          <ValueCell label="Portfolio profile" note="Regional and sector exposure." />
          <ValueCell label="Fund identifier" value={record.identity.ticker || record.identity.performanceId} />
        </div>
      </ReportSection>

      <ReportSection number="02" title="Morningstar ratings, risk and fees">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCell label="Overall rating" value={f.starRating ? `${f.starRating} / 5` : null} />
          <ValueCell label="3, 5 and 10-year risk" note="Morningstar category-relative risk and return." />
          <ValueCell label="Management" note="Manager, tenure and subadvisor details." />
          <ValueCell label="MER and management fee" note="Current fees and their impact on returns." />
        </div>
      </ReportSection>

      <ReportSection number="03" title="Risk statistics and performance">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
          <ValueCell label="Risk statistics" note="Standard deviation, Sharpe ratio, beta and capture ratios." />
          <ValueCell label="Trailing returns" note="1, 3, 5 and 10-year results against category and benchmark." />
          <ValueCell label="Growth of investment" note="Historical growth and calendar-year performance." />
        </div>
      </ReportSection>

      <ReportSection number="04" title="Objective, strategy and specific risks">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
          <ValueCell label="Investment objective" note="Mandate and intended investor outcome." />
          <ValueCell label="Investment strategy" note="Portfolio construction and security selection approach." />
          <ValueCell label="Specific risks" note="Material fund, market, liquidity, leverage and concentration risks." />
        </div>
      </ReportSection>
      <FundComparables record={record} recordedAlternatives={recordedAlternatives} onRecordAlternative={onRecordAlternative} />
    </div>
  );
}

export function KypResearchReport({ record, recordedAlternatives, onRecordAlternative }: { record: KypProductRecord; recordedAlternatives?: string; onRecordAlternative?: (name: string) => void }) {
  return record.assetType === "stock" ? <StockReport record={record} /> : <FundReport record={record} recordedAlternatives={recordedAlternatives} onRecordAlternative={onRecordAlternative} />;
}
