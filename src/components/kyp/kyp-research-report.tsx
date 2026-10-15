"use client";

import { uploadedDocumentTitle, type ExtractedFundFactsheet, type KypProductRecord } from "@/lib/kyp";
import { getKypSourcePdf } from "@/lib/kyp-source-pdf";
import { formatPercent, formatPrice, formatVolume } from "@/lib/types";
import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

function SourceTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | null | undefined>> }) {
  if (!rows.length) return null;
  return <div className="overflow-x-auto rounded-xl border border-outline-variant">
    <table className="min-w-[720px] w-full border-collapse text-left text-[10px]">
      <thead className="bg-surface-container-low"><tr>{headers.map((header) => <th key={header} className="border-b border-outline-variant px-3 py-2.5 font-bold text-on-surface-variant">{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-outline-variant/60 last:border-0">{row.map((value, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2.5 font-mono text-on-surface">{value == null ? "N/A" : value}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

const SERIES_COLORS = ["#4be277", "#76a9ff", "#f3b94f", "#d28cff"];

function UploadedPdfReview({ record }: { record: KypProductRecord }) {
  const uploaded = record.uploadedFactsheet!;
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);
  useEffect(() => {
    let objectUrl = "";
    let active = true;
    void getKypSourcePdf(record.id).then((file) => {
      if (!active || !file) { if (active) setPreviewError(true); return; }
      objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }).catch(() => { if (active) setPreviewError(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [record.id]);
  const title = uploadedDocumentTitle(uploaded.fileName);
  return <div className="research-report mt-5">
    <section className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-4 py-3"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-primary">Uploaded source PDF</p><h3 className="mt-1 text-sm font-semibold text-on-surface">{title}</h3></div><span className="rounded-full border border-outline-variant px-2.5 py-1 text-[9px] font-semibold text-on-surface-variant">{uploaded.pageCount} pages</span></div>
      {previewUrl ? <iframe title={`${title} PDF preview`} src={`${previewUrl}#toolbar=1&navpanes=0&view=FitH`} className="h-[720px] w-full bg-white" /> : <div className="grid h-72 place-items-center px-6 text-center"><div><p className="text-sm font-semibold text-on-surface">{previewError ? "Source PDF preview unavailable" : "Loading PDF preview"}</p><p className="mt-1 text-[11px] text-on-surface-variant">{previewError ? "Re-upload the original PDF to restore the preview." : "Preparing the original uploaded document."}</p></div></div>}
    </section>
  </div>;
}

function parsePercentBreakdown(value?: string | null) {
  if (!value) return [];
  const matches = [...value.matchAll(/([A-Za-z][A-Za-z0-9 &/()+.-]{1,55}?)\s*[:|-]?\s*(-?\d+(?:\.\d+)?)\s*%/g)];
  return matches.map((match) => ({ name: match[1].trim().replace(/^[,;]+|[,;]+$/g, ""), value: Number(match[2]) })).filter((item) => item.name && Number.isFinite(item.value));
}

function UploadedFundReport({ record }: { record: KypProductRecord }) {
  const u = record.uploadedFactsheet!;
  const returns = [
    { period: "1Y", value: u.return1Y },
    { period: "3Y", value: u.return3Y },
    { period: "5Y", value: u.return5Y },
    { period: "10Y", value: u.return10Y },
  ].filter((point): point is { period: string; value: number } => point.value != null);
  const allocation = parsePercentBreakdown(u.assetAllocation);
  const geography = parsePercentBreakdown(u.geographicAllocation);
  const sectors = parsePercentBreakdown(u.sectorAllocation);
  const holdings = parsePercentBreakdown(u.topHoldings).slice(0, 10);
  const portfolioBreakdown = allocation.length ? allocation : sectors.length ? sectors : geography;
  const availableFacts: Array<[string, string]> = ([
    ["Fund code", u.fundCode], ["Category", u.category], ["Currency", u.currency], ["CUSIP", u.cusip], ["ISIN", u.isin],
    ["Inception", u.inceptionDate], ["Manager", u.manager], ["Risk level", u.riskLevel], ["Distribution", u.distributionFrequency], ["Source date", u.asOfDate],
  ] as Array<[string, string | null]>).filter((row): row is [string, string] => Boolean(row[1]));
  return <div className="research-report">
    <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-primary">Uploaded fund research</p>
      <h3 className="mt-1 text-lg font-semibold text-on-surface">Source-driven fund overview</h3>
      <p className="mt-1 text-[11px] text-on-surface-variant">Extracted from {u.fileName}. Charts are reconstructed only where the source contains numeric values.</p>
    </div>

    {(returns.length > 0 || portfolioBreakdown.length > 0) && <ReportSection number="01" title="Performance and portfolio profile">
      <div className="grid gap-4 lg:grid-cols-2">
        {returns.length > 0 && <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4"><h4 className="text-xs font-bold text-on-surface">Annualized trailing returns</h4><p className="mt-1 text-[10px] text-on-surface-variant">Periods stated in the uploaded document</p><div className="mt-3 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={returns} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}><CartesianGrid stroke="rgba(128,128,128,.18)" vertical={false} /><XAxis dataKey="period" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} unit="%" /><Tooltip contentStyle={{ background: "#171b18", border: "1px solid #485049", borderRadius: 12, fontSize: 11 }} formatter={(value) => [`${value}%`, "Return"]} /><Bar dataKey="value" fill={SERIES_COLORS[0]} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>}
        {portfolioBreakdown.length > 0 && <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4"><h4 className="text-xs font-bold text-on-surface">{allocation.length ? "Asset allocation" : sectors.length ? "Sector allocation" : "Geographic allocation"}</h4><p className="mt-1 text-[10px] text-on-surface-variant">Allocation percentages extracted from the source</p><div className="mt-3 h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={portfolioBreakdown} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="76%" paddingAngle={2}>{portfolioBreakdown.map((item, index) => <Cell key={item.name} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "#171b18", border: "1px solid #485049", borderRadius: 12, fontSize: 11 }} formatter={(value) => [`${value}%`, "Allocation"]} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer></div></div>}
      </div>
    </ReportSection>}

    <ReportSection number="02" title="Product, fees and risk">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          {availableFacts.map(([label, value]) => <ValueCell key={label} label={label} value={value} />)}
          {u.morningstarRating != null && <ValueCell label="Morningstar rating" value={`${u.morningstarRating} / 5`} />}
          {u.mer != null && <ValueCell label="MER" value={`${u.mer}%`} />}
          {u.managementFee != null && <ValueCell label="Management fee" value={`${u.managementFee}%`} />}
          {u.standardDeviation != null && <ValueCell label="Standard deviation" value={`${u.standardDeviation}%`} />}
          {u.sharpeRatio != null && <ValueCell label="Sharpe ratio" value={u.sharpeRatio} />}
        </div>
        {(u.mer != null || u.managementFee != null || u.riskLevel) && <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4"><h4 className="text-xs font-bold text-on-surface">Advisor review signals</h4><div className="mt-4 space-y-4">{u.mer != null && <div><div className="flex justify-between text-[10px]"><span>MER</span><span className="font-mono">{u.mer}%</span></div><div className="mt-1.5 h-2 rounded-full bg-outline-variant/40"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, u.mer * 25)}%` }} /></div></div>}{u.managementFee != null && <div><div className="flex justify-between text-[10px]"><span>Management fee</span><span className="font-mono">{u.managementFee}%</span></div><div className="mt-1.5 h-2 rounded-full bg-outline-variant/40"><div className="h-full rounded-full bg-warning" style={{ width: `${Math.min(100, u.managementFee * 25)}%` }} /></div></div>}{u.riskLevel && <div className="border-t border-outline-variant pt-3"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Stated risk classification</p><p className="mt-1 text-sm font-semibold text-on-surface">{u.riskLevel}</p></div>}</div></div>}
      </div>
    </ReportSection>

    {holdings.length > 0 && <ReportSection number="03" title="Top holdings"><div className="h-72 rounded-2xl border border-outline-variant bg-surface-container-low p-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={holdings} layout="vertical" margin={{ top: 4, right: 18, left: 24, bottom: 0 }}><CartesianGrid stroke="rgba(128,128,128,.18)" horizontal={false} /><XAxis type="number" tick={{ fontSize: 10 }} unit="%" /><YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 9 }} /><Tooltip contentStyle={{ background: "#171b18", border: "1px solid #485049", borderRadius: 12, fontSize: 11 }} formatter={(value) => [`${value}%`, "Weight"]} /><Bar dataKey="value" fill={SERIES_COLORS[1]} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></ReportSection>}

    <ReportSection number={holdings.length ? "04" : "03"} title="Mandate and source evidence">
      <div className="grid gap-4 md:grid-cols-2">
        {([["Investment objective", u.investmentObjective], ["Investment strategy", u.investmentStrategy], ["Specific risks", u.specificRisks], ["Liquidity", u.liquidity], ["Historical performance", u.historicalPerformance], ["Portfolio allocation", [u.assetAllocation, u.geographicAllocation, u.sectorAllocation].filter(Boolean).join(" | ")]] as Array<[string, string | null]>).filter((row): row is [string, string] => Boolean(row[1])).map(([label, value]) => <div key={label} className="rounded-xl border border-outline-variant bg-surface-container-low p-4"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary">{label}</p><p className="mt-2 text-[11px] leading-5 text-on-surface">{value}</p></div>)}
      </div>
    </ReportSection>
    <p className="mt-3 text-[10px] leading-4 text-on-surface-variant">Source-backed values only. Missing fields are omitted and must be confirmed against current issuer disclosure before use.</p>
  </div>;
}

function StockComparisonReport({ record }: { record: KypProductRecord }) {
  const products = record.uploadedFactsheet?.comparisonProducts || [];
  const [view, setView] = useState<"performance" | "history" | "valuation" | "profitability">("performance");
  const performance = [
    { period: "1Y", ...Object.fromEntries(products.map((item) => [item.ticker || item.productName || "Security", item.return1Y])) },
    { period: "3Y", ...Object.fromEntries(products.map((item) => [item.ticker || item.productName || "Security", item.return3Y])) },
    { period: "5Y", ...Object.fromEntries(products.map((item) => [item.ticker || item.productName || "Security", item.return5Y])) },
    { period: "10Y", ...Object.fromEntries(products.map((item) => [item.ticker || item.productName || "Security", item.return10Y])) },
  ];
  const comparisonRows = products.map((item) => ({ name: item.productName, ticker: item.ticker, pe: item.peRatio, yield: item.dividendYield, price: item.currentPrice, fairValue: item.fairValue, roe: item.returnOnEquity, roa: item.returnOnAssets, margin: item.netMargin }));
  const chartRows = view === "valuation" ? comparisonRows : comparisonRows;
  const historyYears = Array.from(new Set(products.flatMap((item) => item.annualPerformance?.map((point) => point.year) || [])));
  const annualHistory = historyYears.map((year) => ({ year, ...Object.fromEntries(products.map((item) => [item.ticker || item.productName || "Security", item.annualPerformance?.find((point) => point.year === year)?.totalReturn ?? null])) }));
  return <div className="research-report">
    <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-primary">Morningstar source comparison</p><h3 className="mt-1 text-lg font-semibold text-on-surface">{products.length} securities, one KYP evidence package</h3><p className="mt-1 text-[11px] text-on-surface-variant">Values below were extracted from {record.uploadedFactsheet?.fileName}. Switch views without changing the source record.</p></div><div className="flex flex-wrap rounded-xl border border-outline-variant bg-surface-container-low p-1">{(["performance", "history", "valuation", "profitability"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-2 text-[10px] font-bold capitalize transition ${view === item ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}>{item}</button>)}</div></div>
    </div>

    <ReportSection number="01" title={view === "performance" ? "Annualized stock total return" : view === "history" ? "Calendar-year total return" : view === "valuation" ? "Valuation and income" : "Profitability profile"}>
      <div className="h-[300px] rounded-2xl border border-outline-variant bg-surface-container-low p-3 sm:p-5">
        <ResponsiveContainer width="100%" height="100%">
          {view === "performance" ? <LineChart data={performance} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}><CartesianGrid stroke="rgba(128,128,128,.18)" vertical={false} /><XAxis dataKey="period" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} unit="%" /><Tooltip contentStyle={{ background: "#171b18", border: "1px solid #485049", borderRadius: 12, fontSize: 11 }} formatter={(value) => [`${value}%`, ""]} /><Legend wrapperStyle={{ fontSize: 10 }} />{products.map((item, index) => <Line key={item.ticker || item.productName} type="monotone" dataKey={item.ticker || item.productName || "Security"} stroke={SERIES_COLORS[index % SERIES_COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />)}</LineChart>
          : view === "history" ? <LineChart data={annualHistory} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}><CartesianGrid stroke="rgba(128,128,128,.18)" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} unit="%" /><Tooltip contentStyle={{ background: "#171b18", border: "1px solid #485049", borderRadius: 12, fontSize: 11 }} formatter={(value) => [`${value}%`, ""]} /><Legend wrapperStyle={{ fontSize: 10 }} />{products.map((item, index) => <Line key={item.ticker || item.productName} type="monotone" dataKey={item.ticker || item.productName || "Security"} stroke={SERIES_COLORS[index % SERIES_COLORS.length]} strokeWidth={2.2} dot={false} connectNulls />)}</LineChart>
          : view === "valuation" ? <BarChart data={chartRows} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}><CartesianGrid stroke="rgba(128,128,128,.18)" vertical={false} /><XAxis dataKey="ticker" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: "#171b18", border: "1px solid #485049", borderRadius: 12, fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="pe" name="P/E" fill={SERIES_COLORS[0]} radius={[5, 5, 0, 0]} /><Bar dataKey="yield" name="Dividend yield %" fill={SERIES_COLORS[2]} radius={[5, 5, 0, 0]} /></BarChart>
          : <BarChart data={chartRows} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}><CartesianGrid stroke="rgba(128,128,128,.18)" vertical={false} /><XAxis dataKey="ticker" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} unit="%" /><Tooltip contentStyle={{ background: "#171b18", border: "1px solid #485049", borderRadius: 12, fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="roe" name="ROE" fill={SERIES_COLORS[0]} radius={[5, 5, 0, 0]} /><Bar dataKey="roa" name="ROA" fill={SERIES_COLORS[1]} radius={[5, 5, 0, 0]} /><Bar dataKey="margin" name="Net margin" fill={SERIES_COLORS[2]} radius={[5, 5, 0, 0]} /></BarChart>}
        </ResponsiveContainer>
      </div>
    </ReportSection>

    <ReportSection number="02" title="Price range and Morningstar fair value">
      <div className="space-y-5 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        {products.map((item, index) => {
          const low = item.fiftyTwoWeekLow; const high = item.fiftyTwoWeekHigh; const current = item.currentPrice;
          const position = low != null && high != null && current != null && high > low ? Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100)) : null;
          return <div key={item.ticker || item.productName}><div className="mb-2 flex items-end justify-between gap-4"><div><p className="text-xs font-bold text-on-surface">{item.ticker} <span className="font-normal text-on-surface-variant">{item.productName}</span></p><p className="mt-0.5 text-[10px] text-on-surface-variant">52-week range</p></div><div className="text-right"><p className="font-mono text-xs font-semibold text-on-surface">{item.currency} {current?.toFixed(2) || "N/A"}</p><p className="text-[9px] text-on-surface-variant">Fair value {item.fairValue == null ? "not stated" : `${item.currency} ${item.fairValue.toFixed(2)}`}</p></div></div><div className="relative h-2 rounded-full bg-outline-variant/50"><div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${position ?? 0}%`, backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />{position != null && <span className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-surface" style={{ left: `${position}%` }} />}</div><div className="mt-1 flex justify-between font-mono text-[9px] text-on-surface-variant"><span>{low?.toFixed(2) || "N/A"}</span><span>{high?.toFixed(2) || "N/A"}</span></div></div>;
        })}
      </div>
    </ReportSection>

    <ReportSection number="03" title="Source comparison table">
      <div className="overflow-x-auto rounded-2xl border border-outline-variant"><table className="min-w-[760px] w-full border-collapse text-left text-[11px]"><thead className="bg-surface-container-low"><tr>{["Security", "Price", "Fair value", "P/E", "Yield", "ROE", "ROA", "Net margin", "1Y", "3Y", "5Y", "10Y"].map((label) => <th key={label} className="border-b border-outline-variant px-3 py-3 font-bold text-on-surface-variant">{label}</th>)}</tr></thead><tbody>{products.map((item) => <tr key={item.ticker || item.productName} className="border-b border-outline-variant/60 last:border-0"><td className="px-3 py-3"><span className="font-bold text-on-surface">{item.ticker}</span><span className="ml-2 text-on-surface-variant">{item.productName}</span></td>{[item.currentPrice, item.fairValue, item.peRatio, item.dividendYield, item.returnOnEquity, item.returnOnAssets, item.netMargin, item.return1Y, item.return3Y, item.return5Y, item.return10Y].map((value, index) => <td key={index} className="px-3 py-3 font-mono text-on-surface">{value == null ? "N/A" : `${value}${index >= 3 ? "%" : ""}`}</td>)}</tr>)}</tbody></table></div>
      <p className="mt-3 text-[10px] leading-4 text-on-surface-variant">Source-backed values only. Morningstar ratings, charts and trademarks are not recreated unless included and licensed in the uploaded document.</p>
    </ReportSection>

    <ReportSection number="04" title="Historical source data">
      <div className="space-y-3">
        {products.map((item, productIndex) => {
          const annualPerformanceRows = item.annualPerformance?.map((point) => [point.year, point.totalReturn == null ? null : `${point.totalReturn}%`, point.dividendYield == null ? null : `${point.dividendYield}%`, point.marketCap]) || [];
          const financialRows = item.annualFinancials?.map((point) => [point.year, point.revenue, point.netIncome, point.eps, point.dividend, point.bookValue, point.operatingCashFlow, point.freeCashFlow]) || [];
          const profitabilityRows = item.annualProfitability?.map((point) => {
            const valuation = item.annualValuation?.find((entry) => entry.year === point.year);
            return [point.year, point.returnOnAssets == null ? null : `${point.returnOnAssets}%`, point.returnOnEquity == null ? null : `${point.returnOnEquity}%`, point.netMargin == null ? null : `${point.netMargin}%`, valuation?.pe, valuation?.priceToSales, valuation?.priceToBook, valuation?.priceToCashFlow];
          }) || [];
          const quarterlyRows = item.quarterlyResults?.map((point) => [point.period, point.revenue, point.revenuePrior, point.revenueGrowth == null ? null : `${point.revenueGrowth}%`, point.eps, point.epsPrior]) || [];
          return <details key={item.ticker || item.productName} open={productIndex === 0} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <summary className="cursor-pointer list-none text-xs font-bold text-on-surface"><span className="mr-2 font-mono text-primary">{item.ticker}</span>{item.productName}</summary>
            <div className="mt-4 space-y-5">
              {annualPerformanceRows.length > 0 && <div><h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Performance</h4><SourceTable headers={["Year", "Total return", "Dividend yield", "Market cap CAD M"]} rows={annualPerformanceRows} /></div>}
              {financialRows.length > 0 && <div><h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Financials</h4><SourceTable headers={["Year", "Revenue CAD M", "Net income CAD M", "EPS", "Dividend", "Book value", "Operating cash flow CAD M", "Free cash flow CAD M"]} rows={financialRows} /></div>}
              {profitabilityRows.length > 0 && <div><h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Profitability and valuation</h4><SourceTable headers={["Year", "ROA", "ROE", "Net margin", "P/E", "P/S", "P/B", "P/CF"]} rows={profitabilityRows} /></div>}
              {quarterlyRows.length > 0 && <div><h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Quarterly results</h4><SourceTable headers={["Period", "Revenue", "Prior revenue", "Revenue growth", "EPS", "Prior EPS"]} rows={quarterlyRows} /></div>}
            </div>
          </details>;
        })}
      </div>
    </ReportSection>
  </div>;
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
  const u = record.uploadedFactsheet;
  return (
    <div className="research-report">
      {u && <div className="mx-0 mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3"><div><p className="text-xs font-semibold text-on-surface">Properties extracted from uploaded factsheet</p><p className="mt-0.5 text-[10px] text-on-surface-variant">{u.fileName} · {u.pageCount} pages · Source date {u.asOfDate || "not stated"}</p></div><span className="rounded-full bg-primary px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wide text-on-primary">Advisor confirmed</span></div>}
      <ReportSection number="01" title="Portfolio and asset allocation">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCell label="Asset allocation" value={u?.assetAllocation} note="Equity, fixed income, cash and other exposure." />
          <ValueCell label="Investment style" value={u?.category} note="Fund category or investment style." />
          <ValueCell label="Portfolio profile" value={[u?.geographicAllocation, u?.sectorAllocation].filter(Boolean).join(" · ") || null} note="Regional and sector exposure." />
          <ValueCell label="Fund identifier" value={record.identity.ticker || record.identity.performanceId} />
        </div>
      </ReportSection>

      <ReportSection number="02" title="Morningstar ratings, risk and fees">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCell label="Overall rating" value={f.starRating ? `${f.starRating} / 5` : null} />
          <ValueCell label="Risk level" value={u?.riskLevel} note="Issuer or provider classification." />
          <ValueCell label="Management" value={u?.manager} note="Manager and subadvisor details." />
          <ValueCell label="MER and management fee" value={[u?.mer != null ? `MER ${u.mer}%` : "", u?.managementFee != null ? `Management ${u.managementFee}%` : ""].filter(Boolean).join(" · ") || null} note="Current fees and their impact on returns." />
        </div>
      </ReportSection>

      <ReportSection number="03" title="Risk statistics and performance">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
          <ValueCell label="Risk statistics" value={[u?.standardDeviation != null ? `Std. dev. ${u.standardDeviation}%` : "", u?.sharpeRatio != null ? `Sharpe ${u.sharpeRatio}` : ""].filter(Boolean).join(" · ") || null} note="Risk measures stated in the factsheet." />
          <ValueCell label="Trailing returns" value={u ? [u.return1Y != null ? `1Y ${u.return1Y}%` : "", u.return3Y != null ? `3Y ${u.return3Y}%` : "", u.return5Y != null ? `5Y ${u.return5Y}%` : "", u.return10Y != null ? `10Y ${u.return10Y}%` : ""].filter(Boolean).join(" · ") || null : null} note="Annualized results where stated." />
          <ValueCell label="Top holdings" value={u?.topHoldings} note="Largest positions stated in the factsheet." />
        </div>
      </ReportSection>

      <ReportSection number="04" title="Objective, strategy and specific risks">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
          <ValueCell label="Investment objective" value={u?.investmentObjective} note="Mandate and intended investor outcome." />
          <ValueCell label="Investment strategy" value={u?.investmentStrategy} note="Portfolio construction and security selection approach." />
          <ValueCell label="Specific risks" value={u?.specificRisks} note="Material fund, market, liquidity, leverage and concentration risks." />
        </div>
      </ReportSection>
      <FundComparables record={record} recordedAlternatives={recordedAlternatives} onRecordAlternative={onRecordAlternative} />
    </div>
  );
}

export function KypResearchReport({ record, recordedAlternatives, onRecordAlternative }: { record: KypProductRecord; recordedAlternatives?: string; onRecordAlternative?: (name: string) => void }) {
  if (record.uploadedFactsheet) return <UploadedPdfReview record={record} />;
  return record.assetType === "stock" ? <StockReport record={record} /> : <FundReport record={record} recordedAlternatives={recordedAlternatives} onRecordAlternative={onRecordAlternative} />;
}
