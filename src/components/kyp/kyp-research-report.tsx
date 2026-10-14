import type { KypProductRecord } from "@/lib/kyp";
import { formatPercent, formatPrice, formatVolume } from "@/lib/types";

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

function FundReport({ record }: { record: KypProductRecord }) {
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
    </div>
  );
}

export function KypResearchReport({ record }: { record: KypProductRecord }) {
  return record.assetType === "stock" ? <StockReport record={record} /> : <FundReport record={record} />;
}
