import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { metric, type ReviewResearch } from "./model";
import type { ArchiveRow } from "./store";
export async function renderReviewPdf(row: ArchiveRow) {
  const doc = JSON.parse(row.document) as { generatedAt: string; research: ReviewResearch; advisor: { name: string; firm: string; regulatorId: string; email: string }; alternativesReason: string; rationale: string; evidenceSources: string };
  const pdf = await PDFDocument.create();
  pdf.setTitle(`KYP due diligence - ${doc.research.target.symbol}`);
  pdf.setCreationDate(new Date(doc.generatedAt));
  pdf.setModificationDate(new Date(doc.generatedAt));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([612, 792]), y = 742;
  const clean = (value: string) => value.replace(/[\u2010-\u2015]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[^\x20-\x7e\n]/g, "?");
  function text(value: string, heading = false) {
    const size = heading ? 13 : 10;
    const face = heading ? bold : font;
    if (heading && y < 130) { page = pdf.addPage([612, 792]); y = 742; }
    for (const paragraph of clean(value).split("\n")) {
      let line = "";
      // Split oversized tokens as well as words so long URLs cannot overflow.
      const tokens = paragraph.split(/\s+/).flatMap(word => word.match(/.{1,65}/g) || [""]);
      for (const word of [...tokens, "\n"]) {
        if (word === "\n" || (line && face.widthOfTextAtSize(`${line} ${word}`, size) > 510)) {
          if (y < 68) { page = pdf.addPage([612, 792]); y = 742; }
          page.drawText(line, { x: 50, y, size, font: face, color: rgb(.12, .17, .14) }); y -= heading ? 21 : 15;
          line = word === "\n" ? "" : word;
        } else line = line ? `${line} ${word}` : word;
      }
    }
    y -= 8;
  }
  text("REGULATORY RECORD", true);
  text("NI 31-103 KYP DUE DILIGENCE REPORT", true);
  text(`Record: ${row.id}\nServer timestamp (UTC): ${doc.generatedAt}\nToronto: ${new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "long", timeZone: "America/Toronto" }).format(new Date(doc.generatedAt))}`);
  text(`Prepared by: ${doc.advisor.name}\nFirm: ${doc.advisor.firm}\nRegulator ID (advisor supplied): ${doc.advisor.regulatorId || "Not supplied"}\nAccount: ${doc.advisor.email}`);
  text("1. Core asset evaluation and alternatives", true);
  text(doc.research.categoryBasis);
  const products = [doc.research.target, ...doc.research.alternatives];
  const rows = [
    ["Metric", ...products.map(p => p.symbol)],
    ["Currency", ...products.map(p => p.currency || "Not available")],
    ["Expense ratio (not verified MER)", ...products.map(p => p.type === "equity" ? "Not applicable" : metric(p.expenseRatio, true))],
    ["Beta", ...products.map(p => metric(p.beta))],
    ["3-year average return", ...products.map(p => metric(p.return3Y, true))],
    ["Trailing annual dividend yield", ...products.map(p => metric(p.dividendYield, true))],
  ];
  if (y - rows.length * 26 < 68) { page = pdf.addPage([612, 792]); y = 742; }
  for (const [index, rowValues] of rows.entries()) {
    const widths = [180, 110, 110, 110];
    let x = 50;
    for (const [column, value] of rowValues.entries()) {
      page.drawRectangle({ x, y: y - 20, width: widths[column], height: 26, borderWidth: .35, borderColor: rgb(.78, .82, .79), color: index === 0 ? rgb(.89, .94, .90) : rgb(1, 1, 1) });
      const face = index === 0 ? bold : font;
      const safeValue = clean(value);
      const size = Math.min(9, (widths[column] - 12) / Math.max(face.widthOfTextAtSize(safeValue, 1), 1));
      page.drawText(safeValue, { x: x + 6, y: y - 10, size, font: face });
      x += widths[column];
    }
    y -= 26;
  }
  y -= 18;
  for (const [i, product] of [doc.research.target, ...doc.research.alternatives].entries()) {
    text(`${i === 0 ? "TARGET" : `ALTERNATIVE ${i}`} - ${product.symbol}: ${product.name}`, true);
    text(`Type: ${product.type} | Currency: ${product.currency || "Not available"} | Exchange: ${product.exchange || "Not available"}\nCategory: ${product.category || "Not available"}\nReported expense ratio: ${product.type === "equity" ? "Not applicable to direct equity" : metric(product.expenseRatio, true)} | Beta: ${metric(product.beta)}\n3-year average return: ${metric(product.return3Y, true)} | Trailing annual dividend yield: ${metric(product.dividendYield, true)}\nReference price: ${product.price ?? "Not available"} ${product.currency || ""}\nSource: ${product.sourceUrl}\nRetrieved: ${product.retrievedAt}\nMarket timestamp: ${product.marketAsOf || "Not available"}`);
    for (const warning of product.warnings) text(`Data limitation: ${warning}`);
  }
  text("2. Alternatives review", true); text(doc.alternativesReason);
  for (const warning of doc.research.warnings) text(`Review limitation: ${warning}`);
  text("3. Advisor rationale and supporting evidence", true); text(doc.rationale);
  text("4. Source evidence", true); text(doc.evidenceSources);
  text("Archive integrity", true);
  text(`SHA-256 of the archived JSON snapshot:\n${row.sha256}\nVerify against the saved record in BullBrief. A PDF alone cannot prove immutability. This report has no editable form fields; alterations can still be made with PDF editing software.`);
  text("This is a system-generated advisor review record. It does not establish product approval, suitability, legal sufficiency or regulator endorsement. Dealer policies, current issuer disclosure and supervision remain applicable. Corrections require a new archived review.");
  const pages = pdf.getPages();
  pages.forEach((p, i) => p.drawText(`BullBrief | KYP review | ${row.id} | ${i + 1}/${pages.length}`, { x: 50, y: 34, size: 7, font, color: rgb(.35, .4, .37) }));
  return pdf.save();
}
