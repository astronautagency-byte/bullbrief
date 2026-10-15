import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFForm, type PDFPage, type PDFFont, type PDFImage } from "pdf-lib";
import { uploadedDocumentTitle } from "@/lib/kyp";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExportPayload = {
  assetType: "fund" | "stock";
  productName: string;
  identifier?: string;
  advisorName: string;
  companyName?: string;
  institutionLogo?: string;
  generatedAt: string;
  sourceFileName: string;
  draft: Record<string, string | boolean | Record<string, string>>;
  facts: Record<string, string | number | null>;
};

const clean = (value: unknown) => String(value ?? "").replace(/[\u2010-\u2015]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').trim();
const percent = (value: unknown) => typeof value === "number" ? `${value}%` : clean(value);
const price = (value: unknown, currency: unknown) => typeof value === "number" ? `${clean(currency)} ${value.toFixed(2)}`.trim() : clean(value);

function setText(form: PDFForm, name: string, value: unknown) {
  const text = clean(value);
  if (!text) return;
  const field = form.getTextField(name);
  field.setText(text.slice(0, 1800));
  const rectangle = field.acroField.getWidgets()[0]?.getRectangle();
  if (rectangle && rectangle.height > 24) {
    field.enableMultiline();
    field.setFontSize(text.length > 420 ? 6.5 : text.length > 180 ? 7 : 8);
  } else if (rectangle) {
    const fittedSize = Math.max(5.5, Math.min(10, rectangle.width / Math.max(1, text.length * 0.53)));
    field.setFontSize(fittedSize);
  }
}

function select(form: PDFForm, name: string, preferred: unknown) {
  const dropdown = form.getDropdown(name);
  const normalize = (value: unknown) => clean(value).toLowerCase().replace(/\bto\b/g, "").replace(/[^a-z0-9]+/g, "");
  const requested = normalize(preferred);
  const option = dropdown.getOptions().find((item) => normalize(item) === requested);
  if (option) dropdown.select(option);
}

function comparisons(value: unknown) {
  return clean(value).split(/\n|;/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
}

function matchingEvidence(values: unknown[], pattern: RegExp) {
  const sentences = values.flatMap((value) => clean(value).split(/(?<=[.!?])\s+|\n+/)).filter((value) => value && pattern.test(value));
  return sentences.join(" ");
}

function trailingReturns(f: Record<string, string | number | null>) {
  return [
    f.return1Y != null ? `1 year: ${percent(f.return1Y)}` : "",
    f.return3Y != null ? `3 year: ${percent(f.return3Y)}` : "",
    f.return5Y != null ? `5 year: ${percent(f.return5Y)}` : "",
    f.return10Y != null ? `10 year: ${percent(f.return10Y)}` : "",
  ].filter(Boolean).join(" | ");
}

function templateField(draft: ExportPayload["draft"], label: string, fallback: unknown) {
  const fields = draft.templateFields;
  if (fields && typeof fields === "object" && !Array.isArray(fields) && typeof fields[label] === "string") return fields[label];
  return fallback;
}

function mapFundTemplate(form: PDFForm, payload: ExportPayload) {
  const f = payload.facts; const d = payload.draft;
  const objectiveAndStrategy = [f.investmentObjective, f.investmentStrategy].filter(Boolean).join("\n\n") || clean(d.structure);
  const sourceProfile = [f.category, f.assetAllocation, f.geographicAllocation, f.sectorAllocation, f.topHoldings, f.distributionFrequency].filter(Boolean).join(" | ");
  const leverageEvidence = matchingEvidence([f.investmentStrategy], /leverag/i);
  const leverageLimit = leverageEvidence.match(/(?:leverage\s+(?:up to|of)\s+[^.]*|up to\s+\d+(?:\.\d+)?%[^.]*)/i)?.[0] || leverageEvidence;
  const shortingEvidence = matchingEvidence([f.investmentStrategy], /short(?:ing| sell| position)/i);
  const objective = clean(f.investmentObjective).toLowerCase();
  setText(form, "Text Field 11", templateField(d, "Product name", payload.productName));
  setText(form, "Text Field 12", templateField(d, "Date", payload.generatedAt));
  setText(form, "Text Field 13", templateField(d, "Fund company", f.issuer || f.manager));
  setText(form, "Text Field 14", templateField(d, "Fund code / CUSIP", [f.fundCode, f.cusip, f.isin].filter(Boolean).join(" / ") || payload.identifier));
  setText(form, "Text Field 15", templateField(d, "Manager / Subadvisor", f.manager));
  select(form, "Combo Box 1", templateField(d, "PortfolioAid risk rating", f.riskLevel));
  select(form, "Combo Box 2", templateField(d, "Investment objective", objective.includes("income") && objective.includes("growth") ? "Income/Growth" : objective.includes("income") ? "Income" : objective ? "Growth" : ""));
  select(form, "Combo Box 3", templateField(d, "Time horizon", objective.includes("short-term") ? "Short" : objective.includes("medium-term") ? "Medium" : objective.includes("long-term") ? "Long" : ""));
  setText(form, "Text Field 19", templateField(d, "Current MER", percent(f.mer)));
  setText(form, "Text Field 20", templateField(d, "Management fee", percent(f.managementFee)));
  setText(form, "Text Field 21", templateField(d, "Discounts / Householding", matchingEvidence([d.costs], /discount|household/i)));
  setText(form, "Text Field 22", templateField(d, "Performance fees and calculation", matchingEvidence([d.costs, f.investmentStrategy], /performance fee|incentive fee/i)));
  setText(form, "Text Field 24", templateField(d, "Investment objective and strategy", objectiveAndStrategy));
  setText(form, "Text Field 26", templateField(d, "Unique features", sourceProfile));
  setText(form, "Text Field 37", templateField(d, "Historical performance and outlook", [f.historicalPerformance, trailingReturns(f)].filter(Boolean).join("\n\n")));
  setText(form, "Text Field 39", templateField(d, "Maximum leverage", leverageLimit));
  setText(form, "Text Field 40", templateField(d, "Leverage notes", leverageEvidence));
  setText(form, "Text Field 48", templateField(d, "How leverage is employed", leverageEvidence));
  setText(form, "Text Field 49", templateField(d, "How shorting is employed", shortingEvidence));
  setText(form, "Text Field 51", templateField(d, "Bid / Ask", matchingEvidence([f.liquidity, d.liquidityComplexity], /bid|ask|spread/i)));
  setText(form, "Text Field 52", templateField(d, "Trading volume / Liquidity", matchingEvidence([f.liquidity, d.liquidityComplexity], /liquid|redemption|trading volume|turnover/i) || f.liquidity || d.liquidityComplexity));
  setText(form, "Text Field 53", templateField(d, "Premium / Discount to NAV", matchingEvidence([f.liquidity, f.investmentStrategy], /premium|discount|nav/i)));
  setText(form, "Text Field 54", templateField(d, "Tracking error", matchingEvidence([f.investmentStrategy, f.historicalPerformance], /tracking error|benchmark|index/i)));
  setText(form, "Text Field 55", templateField(d, "Tax credit features", matchingEvidence([f.investmentStrategy, d.costs], /tax credit|labour-sponsored|lsif/i)));
  setText(form, "Text Field 74", templateField(d, "Valuation policy", matchingEvidence([f.investmentStrategy, f.liquidity, d.structure], /valuation|nav|fair value/i)));
  const alternatives = comparisons(d.alternatives);
  setText(form, "Text Field 75", templateField(d, "Comparison 1", alternatives[0])); setText(form, "Text Field 76", templateField(d, "Comparison 2", alternatives[1])); setText(form, "Text Field 77", templateField(d, "Comparison 3", alternatives[2]));
  setText(form, "Text Field 78", templateField(d, "Rationale for choosing this product", [d.rationale, d.lowerCostRationale].filter(Boolean).join("\n\n")));
  setText(form, "Text Field 79", templateField(d, "Next review date", d.nextReview));
}

function mapStockTemplate(form: PDFForm, payload: ExportPayload) {
  const f = payload.facts; const d = payload.draft;
  setText(form, "Text Field 11", templateField(d, "Product name", payload.productName));
  setText(form, "Text Field 12", templateField(d, "Date", payload.generatedAt));
  setText(form, "Text Field 82", templateField(d, "Issuer", f.issuer || payload.productName));
  setText(form, "Text Field 83", templateField(d, "CUSIP", f.cusip || f.isin));
  select(form, "Combo Box 1", templateField(d, "PortfolioAid risk rating", f.riskLevel));
  setText(form, "Text Field 54", templateField(d, "Primary exchange", f.primaryExchange));
  setText(form, "Text Field 53", templateField(d, "Sector", f.sector));
  setText(form, "Text Field 19", templateField(d, "P/E", f.peRatio));
  setText(form, "Text Field 20", templateField(d, "Current price", price(f.currentPrice, f.currency)));
  setText(form, "Text Field 21", templateField(d, "Target", price(f.targetPrice, f.currency)));
  setText(form, "Text Field 48", templateField(d, "Dividend yield", percent(f.dividendYield)));
  setText(form, "Text Field 84", templateField(d, "Profitability", [f.profitability, f.returnOnAssets != null ? `Return on assets: ${percent(f.returnOnAssets)}` : "", f.returnOnEquity != null ? `Return on equity: ${percent(f.returnOnEquity)}` : "", f.netMargin != null ? `Net margin: ${percent(f.netMargin)}` : ""].filter(Boolean).join(" | ")));
  setText(form, "Text Field 85", templateField(d, "Risk measure", [f.riskMeasure, f.fiftyTwoWeekLow != null || f.fiftyTwoWeekHigh != null ? `52-week range: ${price(f.fiftyTwoWeekLow, f.currency)} to ${price(f.fiftyTwoWeekHigh, f.currency)}` : "", f.standardDeviation != null ? `Standard deviation: ${percent(f.standardDeviation)}` : "", f.riskLevel].filter(Boolean).join(" | ")));
  setText(form, "Text Field 86", templateField(d, "Product risk", [f.specificRisks, d.risk].filter(Boolean).join("\n\n")));
  setText(form, "Text Field 109", templateField(d, "Historical performance", [f.historicalPerformance, trailingReturns(f)].filter(Boolean).join("\n\n")));
  setText(form, "Text Field 110", templateField(d, "Liquidity", f.liquidity || d.liquidityComplexity));
  setText(form, "Text Field 90", templateField(d, "Additional notes", [f.businessDescription, d.structure, d.costs, d.conflicts, d.evidenceSources].filter(Boolean).join("\n\n")));
  const alternatives = comparisons(d.alternatives);
  setText(form, "Text Field 91", templateField(d, "Comparison 1", alternatives[0])); setText(form, "Text Field 92", templateField(d, "Comparison 2", alternatives[1])); setText(form, "Text Field 93", templateField(d, "Comparison 3", alternatives[2]));
  setText(form, "Text Field 94", templateField(d, "Rationale for choosing this product", [d.rationale, d.lowerCostRationale].filter(Boolean).join("\n\n")));
  setText(form, "Text Field 95", templateField(d, "Next review date", d.nextReview));
}

function drawAttribution(page: PDFPage, payload: ExportPayload, font: PDFFont, bold: PDFFont, logo?: PDFImage) {
  page.drawRectangle({ x: 30, y: 18, width: 552, height: 25, color: rgb(1, 1, 1), opacity: 0.96 });
  if (logo) {
    const dimensions = logo.scale(Math.min(62 / logo.width, 18 / logo.height));
    page.drawImage(logo, { x: 35, y: 22, width: dimensions.width, height: dimensions.height });
  }
  page.drawText(`Prepared by ${clean(payload.advisorName) || "Advisor name not set"}`, { x: logo ? 105 : 35, y: 28, font: bold, size: 7.5, color: rgb(0.12, 0.14, 0.13) });
  page.drawText(`${clean(payload.companyName) || "AdvisorPulse by BullBrief"} | Created using BullBrief`, { x: 330, y: 28, font, size: 6.5, color: rgb(0.33, 0.36, 0.34) });
}

async function filledTemplate(payload: ExportPayload) {
  const templateName = payload.assetType === "stock" ? "kyp-stock-template.pdf" : "kyp-fund-etf-template.pdf";
  const templateBytes = await readFile(path.join(process.cwd(), "public", "templates", templateName));
  const document = await PDFDocument.load(templateBytes);
  const form = document.getForm();
  if (payload.assetType === "stock") mapStockTemplate(form, payload); else mapFundTemplate(form, payload);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  form.updateFieldAppearances(font);
  form.flatten();
  let logo: PDFImage | undefined;
  if (payload.institutionLogo?.startsWith("data:image/png;base64,")) {
    try { logo = await document.embedPng(Buffer.from(payload.institutionLogo.split(",")[1], "base64")); } catch {}
  }
  document.getPages().forEach((page) => drawAttribution(page, payload, font, bold, logo));
  return document;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const source = form.get("source");
    const rawPayload = form.get("payload");
    if (!(source instanceof File) || typeof rawPayload !== "string") return NextResponse.json({ error: "Source PDF and KYP data are required." }, { status: 400 });
    if (source.size > 20 * 1024 * 1024) return NextResponse.json({ error: "The source PDF must be 20 MB or smaller." }, { status: 413 });
    const payload = JSON.parse(rawPayload) as ExportPayload;
    if (payload.assetType !== "fund" && payload.assetType !== "stock") return NextResponse.json({ error: "Choose a fund or stock KYP template." }, { status: 400 });
    const sourceDocument = await PDFDocument.load(new Uint8Array(await source.arrayBuffer()), { ignoreEncryption: false });
    const combined = await PDFDocument.create();
    combined.setTitle(`${payload.productName} - combined KYP record`);
    combined.setAuthor(payload.advisorName || "BullBrief");
    combined.setSubject("Original product factsheet with completed KYP template");
    // A combined KYP record contains the uploaded source document followed by
    // one completed template. Comparable products belong in the assessment
    // fields, not in additional KYP templates.
    const templateDocument = await filledTemplate({
      ...payload,
      identifier: clean(payload.facts.fundCode || payload.facts.ticker || payload.facts.cusip || payload.facts.isin) || payload.identifier,
    });
    for (const document of [sourceDocument, templateDocument]) {
      const pages = await combined.copyPages(document, document.getPageIndices());
      pages.forEach((page) => combined.addPage(page));
    }
    const bytes = await combined.save({ useObjectStreams: false });
    const safeName = uploadedDocumentTitle(clean(payload.productName || "product")).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || "product";
    const downloadName = /kyp$/i.test(safeName) ? safeName : `${safeName}-KYP`;
    return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${downloadName}.pdf"`, "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Combined KYP PDF generation failed", error);
    return NextResponse.json({ error: "The combined PDF could not be generated. Confirm that the source is an unlocked PDF and try again." }, { status: 500 });
  }
}
