import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { groqExtractFundFactsheet, groqExtractFundFactsheetImages } from "@/lib/providers/groq/client";
import { normalizeExtractedProducts, type ExtractedFundFactsheet } from "@/lib/kyp";

export const runtime = "nodejs";
export const maxDuration = 60;

const numberAfter = (text: string, label: string) => {
  const match = text.match(new RegExp(`${label}\\s+(-?[\\d,.]+)`, "i"));
  return match ? Number(match[1].replace(/,/g, "")) : null;
};

const numericTokens = (line: string) => (line.match(/(?:—|-?\d[\d,.]*)/g) || []).map((token) => token === "—" ? null : Number(token.replace(/,/g, "")));
const seriesValues = (lines: string[], label: string, count: number) => {
  const candidates = lines.filter((line) => line.endsWith(label)).map((line) => numericTokens(line.slice(0, -label.length))).filter((values) => values.length >= count);
  return candidates.at(-1)?.slice(0, count) || Array<number | null>(count).fill(null);
};
const seriesYears = (lines: string[], suffix: string) => {
  const line = lines.find((candidate) => candidate.endsWith(suffix));
  return line ? (line.slice(0, -suffix.length).match(/(?:19|20)\d{2}|YTD|TTM|\d{2}-\d{2}/g) || []) : [];
};

function parseMorningstarStockPage(text: string): ExtractedFundFactsheet | null {
  const lines = text.split(/\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const header = lines.find((line) => /^.+\s+[A-Z]{1,5}\s+Q{2,}/.test(line));
  if (!header) return null;
  const headerMatch = header.match(/^(.+?)\s+([A-Z]{1,5})\s+Q{2,}/);
  if (!headerMatch) return null;
  const [, productName, ticker] = headerMatch;
  const growthIndex = lines.findIndex((line) => /^Growth Rates/i.test(line));
  const headerIndex = lines.indexOf(header);
  const description = lines.slice(headerIndex + 1, growthIndex > headerIndex ? growthIndex : headerIndex + 8)
    .filter((line) => !/^(?:[;\s]+|Morningstar|\d{1,2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4}|Stock Report|Quantitative)/i.test(line))
    .join(" ") || null;
  const returns = text.match(/Stock Total Return\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/i);
  const range = text.match(/52 Wk Range\(High\/Low\)\s*\n\s*([\d.]+)-([\d.]+)/i);
  const currencyIndustry = text.match(/Currency:\s*([A-Z]+)\s*\|\s*Industry:\s*([^\n]+)/i);
  const valuationHeader = lines.findIndex((line) => /Fair Value.*Last Close/i.test(line));
  const valuationLine = valuationHeader >= 0 ? lines[valuationHeader + 1] || "" : "";
  const valuationParts = valuationLine.split(/\s+/);
  const fairValue = valuationLine.match(/\$([\d,.]+)/)?.[1];
  const lastClose = [...valuationParts].reverse().find((part) => /^\d[\d,.]*$/.test(part));
  const competitorsIndex = lines.findIndex((line) => /^Close Competitors/i.test(line));
  const holdersIndex = lines.findIndex((line, index) => index > competitorsIndex && /^Major Fund Holders/i.test(line));
  const competitors = competitorsIndex >= 0
    ? lines.slice(competitorsIndex + 1, holdersIndex > competitorsIndex ? holdersIndex : competitorsIndex + 5)
      .filter((line) => !/^Mkt Cap/i.test(line)).map((line) => line.replace(/\s+[\d,.]+\s+[\d,.]+\s+[\d.]+\s+[\d.]+$/, "")).join("; ") || null
    : null;
  const return1Y = returns ? Number(returns[1]) : null;
  const return3Y = returns ? Number(returns[2]) : null;
  const return5Y = returns ? Number(returns[3]) : null;
  const return10Y = returns ? Number(returns[4]) : null;
  const roe = numberAfter(text, "Return on Equity %");
  const roa = numberAfter(text, "Return on Assets %");
  const margin = numberAfter(text, "Net Margin %");
  const peRatio = numberAfter(text, "Price/Earnings");
  const dividendYield = numberAfter(text, "Dividend Yield %");
  const asOfDate = lines.find((line) => /^(?:\d{1,2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4})$/.test(line)) || null;
  const profitability = [roe != null ? `Return on equity ${roe}%` : "", roa != null ? `return on assets ${roa}%` : "", margin != null ? `net margin ${margin}%` : ""].filter(Boolean).join(", ") || null;
  const historicalPerformance = returns ? `Stock total return: 1 year ${return1Y}%, 3 year ${return3Y}%, 5 year ${return5Y}%, 10 year ${return10Y}%.` : null;
  const riskMeasure = range ? `52-week trading range ${range[2]} to ${range[1]}.` : null;
  const performanceYears = seriesYears(lines, "Stock Performance");
  const performanceReturns = seriesValues(lines, "Total Return %", performanceYears.length);
  const performanceYields = seriesValues(lines, "Dividend Yield %", performanceYears.length);
  const performanceCaps = seriesValues(lines, "Market Cap $Mil", performanceYears.length);
  const annualPerformance = performanceYears.map((year, index) => ({ year, totalReturn: performanceReturns[index], dividendYield: performanceYields[index], marketCap: performanceCaps[index] }));
  const financialYears = seriesYears(lines, "Financials (CAD)");
  const revenue = seriesValues(lines, "Revenue $Mil", financialYears.length);
  const netIncome = seriesValues(lines, "Net Income $Mil", financialYears.length);
  const eps = seriesValues(lines, "Earnings Per Share $", financialYears.length);
  const dividends = seriesValues(lines, "Dividends $", financialYears.length);
  const bookValue = seriesValues(lines, "Book Value Per Share $", financialYears.length);
  const operatingCashFlow = seriesValues(lines, "Oper Cash Flow $Mil", financialYears.length);
  const freeCashFlow = seriesValues(lines, "Free Cash Flow $Mil", financialYears.length);
  const annualFinancials = financialYears.map((year, index) => ({ year, revenue: revenue[index], netIncome: netIncome[index], eps: eps[index], dividend: dividends[index], bookValue: bookValue[index], operatingCashFlow: operatingCashFlow[index], freeCashFlow: freeCashFlow[index] }));
  const profitabilityYears = seriesYears(lines, "Profitability");
  const annualRoa = seriesValues(lines, "Return on Assets %", profitabilityYears.length);
  const annualRoe = seriesValues(lines, "Return on Equity %", profitabilityYears.length);
  const annualMargin = seriesValues(lines, "Net Margin %", profitabilityYears.length);
  const annualProfitability = profitabilityYears.map((year, index) => ({ year, returnOnAssets: annualRoa[index], returnOnEquity: annualRoe[index], netMargin: annualMargin[index] }));
  const valuationYears = seriesYears(lines, "Valuation");
  const annualPe = seriesValues(lines, "Price/Earnings", valuationYears.length);
  const annualPs = seriesValues(lines, "Price/Sales", valuationYears.length);
  const annualPb = seriesValues(lines, "Price/Book", valuationYears.length);
  const annualPcf = seriesValues(lines, "Price/Cash Flow", valuationYears.length);
  const annualValuation = valuationYears.map((year, index) => ({ year, pe: annualPe[index], priceToSales: annualPs[index], priceToBook: annualPb[index], priceToCashFlow: annualPcf[index] }));
  const quarterlyStart = lines.findIndex((line) => /^Quarterly Results/i.test(line));
  const quarterlyLines = quarterlyStart >= 0 ? lines.slice(quarterlyStart, competitorsIndex > quarterlyStart ? competitorsIndex : undefined) : [];
  const months = quarterlyLines.find((line) => /^Revenue \$ /.test(line))?.replace(/^Revenue \$ /, "").split(/\s+/) || [];
  const valuesAfter = (anchor: RegExp, occurrence: "first" | "last" = "first") => {
    const indexes = quarterlyLines.map((line, index) => anchor.test(line) ? index : -1).filter((index) => index >= 0);
    const anchorIndex = occurrence === "last" ? indexes.at(-1) ?? -1 : indexes[0] ?? -1;
    return anchorIndex >= 0 ? numericTokens(quarterlyLines[anchorIndex + 1] || "").slice(0, months.length) : [];
  };
  const revenueCurrent = valuesAfter(/^Revenue \$/); const revenuePrior = quarterlyLines.findIndex((line) => /^Revenue \$ /.test(line));
  const revenuePrevious = revenuePrior >= 0 ? numericTokens(quarterlyLines[revenuePrior + 2] || "").slice(0, months.length) : [];
  const growthCurrent = valuesAfter(/^Rev Growth %/);
  const epsCurrent = valuesAfter(/^Earnings Per Share \$/); const epsHeader = quarterlyLines.findIndex((line) => /^Earnings Per Share \$ /.test(line));
  const epsPrevious = epsHeader >= 0 ? numericTokens(quarterlyLines[epsHeader + 2] || "").slice(0, months.length) : [];
  const quarterlyResults = months.map((period, index) => ({ period, revenue: revenueCurrent[index] ?? null, revenuePrior: revenuePrevious[index] ?? null, revenueGrowth: growthCurrent[index] ?? null, eps: epsCurrent[index] ?? null, epsPrior: epsPrevious[index] ?? null }));
  return {
    assetType: "stock", productName: productName.trim(), fundCode: null, category: "Equity", currency: currencyIndustry?.[1] || null,
    cusip: null, isin: null, inceptionDate: null, manager: null, riskLevel: null, mer: null, managementFee: null,
    morningstarRating: null, investmentObjective: null, investmentStrategy: null, specificRisks: riskMeasure,
    assetAllocation: null, geographicAllocation: null, sectorAllocation: null, topHoldings: null,
    return1Y, return3Y, return5Y, return10Y, standardDeviation: null, sharpeRatio: null, distributionFrequency: null,
    asOfDate, issuer: productName.trim(), ticker, primaryExchange: null, sector: valuationLine.match(/\b(Financial Svs|Technology|Healthcare|Industrials|Energy|Utilities|Real Estate|Consumer Cyclical|Consumer Defensive|Communication Services|Basic Materials)\b/i)?.[1] || currencyIndustry?.[2]?.trim() || null,
    peRatio, currentPrice: lastClose ? Number(lastClose.replace(/,/g, "")) : null, targetPrice: null, dividendYield,
    profitability, riskMeasure: [fairValue ? `Morningstar fair value $${fairValue}.` : "", riskMeasure || ""].filter(Boolean).join(" ") || null,
    historicalPerformance, liquidity: null, businessDescription: description, comparables: competitors,
    fairValue: fairValue ? Number(fairValue.replace(/,/g, "")) : null,
    fiftyTwoWeekLow: range ? Number(range[2]) : null, fiftyTwoWeekHigh: range ? Number(range[1]) : null,
    returnOnEquity: roe, returnOnAssets: roa, netMargin: margin,
    annualPerformance, annualFinancials, annualProfitability, annualValuation, quarterlyResults,
  };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF fund factsheet." }, { status: 400 });
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Only PDF files are supported." }, { status: 415 });
    if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "The PDF must be 12 MB or smaller." }, { status: 413 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return NextResponse.json({ error: "This file does not appear to be a valid PDF." }, { status: 400 });
    const parser = new PDFParse({ data: bytes });
    let textResult: Awaited<ReturnType<typeof parser.getText>>;
    let extracted: ExtractedFundFactsheet;
    let products: ExtractedFundFactsheet[] = [];
    let extractionMode: "text" | "visual" = "text";
    try {
      textResult = await parser.getText();
      const text = textResult.text.replace(/\u0000/g, " ").replace(/[ \t]+/g, " ").trim();
      if (text.length >= 80) {
        products = normalizeExtractedProducts(textResult.pages.map((page) => parseMorningstarStockPage(page.text)).filter((product): product is ExtractedFundFactsheet => Boolean(product)));
        extracted = products[0] || await groqExtractFundFactsheet(text);
      } else {
        extractionMode = "visual";
        const screenshots = await parser.getScreenshot({ desiredWidth: 1400, first: 6, imageBuffer: false, imageDataUrl: true });
        if (!screenshots.pages.length) return NextResponse.json({ error: "No readable pages were found in this PDF." }, { status: 422 });
        extracted = await groqExtractFundFactsheetImages(screenshots.pages.map((page) => page.dataUrl));
      }
    } finally {
      await parser.destroy();
    }
    if (!products.length) products = [extracted];
    products = normalizeExtractedProducts(products);
    extracted = products[0] || extracted;
    const extractedCount = products.reduce((count, product) => count + Object.values(product).filter((value) => value !== null).length, 0);
    return NextResponse.json({
      data: extracted,
      products,
      source: { fileName: file.name.slice(0, 180), pageCount: textResult.pages.length, extractedCount, extractionMode },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Fund factsheet extraction failed", error);
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return NextResponse.json({ error: "The analysis took too long. Try the upload again, or use a text-based PDF exported directly from Morningstar." }, { status: 504 });
    }
    return NextResponse.json({ error: "We could not read this PDF. Try the original downloaded factsheet, confirm it is not password protected, or export the scan at a higher resolution." }, { status: 500 });
  }
}
