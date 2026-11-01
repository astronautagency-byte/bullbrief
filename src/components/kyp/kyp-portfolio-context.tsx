import type { KypProductRecord } from "@/lib/kyp";

export function KypPortfolioContext({ record }: { record: KypProductRecord }) {
  const holding = record.portfolioHolding;
  if (!holding) return null;
  const values = [
    ["Rank", holding.rank], ["CUSIP / fund code", holding.identifier],
    ["Client IDs", holding.clientCount], ["Assets", `${holding.assetsPercent.toFixed(2)}%`],
    ["Reported market value", `$${holding.marketValue.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ["Reported trade quantity", holding.tradeQuantity.toFixed(2)],
  ];
  return <section className="my-4 rounded-xl border border-outline-variant p-4">
    <p className="text-xs font-semibold">Advisor portfolio holding · {holding.reportDate}</p>
    <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">{values.map(([label, value]) => <div key={label}><dt className="text-on-surface-variant">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl>
    <p className="mt-3 text-[10px] text-on-surface-variant">Source: {holding.sourceFile}. Currency is not specified. Trade quantity is not the number of units held.</p>
    <p className="mt-2 text-xs text-on-surface-variant">Product identity requires confirmation against this identifier and the exact share class or fund series. Portfolio figures do not establish product research or KYP approval.</p>
  </section>;
}
