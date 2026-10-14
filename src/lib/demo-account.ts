const DEMO_EMAIL = "advisor.demo@bullbrief.ca";
const SEEDED_KEY = "bullbrief:demo-workspace-seeded:v1";

const holdings = [
  { id: "demo-td", requestedName: "Toronto-Dominion Bank", searchQuery: "TD", assetType: "stock", symbol: "TD.TO", exchange: "TSX" },
  { id: "demo-enb", requestedName: "Enbridge Inc.", searchQuery: "ENB", assetType: "stock", symbol: "ENB.TO", exchange: "TSX" },
  { id: "demo-msft", requestedName: "Microsoft Corporation", searchQuery: "MSFT", assetType: "stock", symbol: "MSFT", exchange: "NASDAQ" },
  { id: "demo-health", requestedName: "Harvest Healthcare Leaders Income ETF", searchQuery: "HHL", assetType: "fund", symbol: "HHL.TO", exchange: "TSX" },
];

const completedDraft = {
  reviewContext: "continued-hold",
  firmApproval: "approved",
  structure: "Publicly traded common equity with daily liquidity.",
  risk: "Equity market, sector concentration and issuer-specific risks reviewed.",
  costs: "Trading commission and account-level fees reviewed.",
  liquidityComplexity: "Daily exchange liquidity. No structural complexity identified.",
  conflicts: "No material conflict identified for this review.",
  alternatives: "Compared with a broad Canadian bank ETF and two peer issuers.",
  lowerCostRationale: "Direct holding remains reasonable for the client mandate.",
  rationale: "The holding remains aligned with the documented income and quality objective.",
  clientExplanation: "Reviewed current risks, valuation context and portfolio role with the client.",
  changeMonitoring: "Monitor earnings, capital ratios, dividend policy and material regulatory developments.",
  evidenceSources: "Issuer filings, dealer research and approved product data.",
  nextReview: "2027-04-15",
  completed: true,
  completedAt: "2026-10-14T14:20:00.000Z",
};

export function seedDemoWorkspace(email?: string | null) {
  if (typeof window === "undefined" || email?.toLowerCase() !== DEMO_EMAIL) return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;

  const partialDraft = {
    ...completedDraft,
    reviewContext: "recommendation",
    alternatives: "",
    rationale: "",
    completed: false,
    completedAt: "",
  };
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  window.localStorage.setItem("bb-theme", "dark");
  window.localStorage.setItem("bullbrief_watchlist", JSON.stringify(["TD.TO", "ENB.TO", "MSFT", "AAPL", "RY.TO", "AMZN"]));
  window.localStorage.setItem("bullbrief_brief_watchlist_view", "grid");
  window.localStorage.setItem("bullbrief:kyp-custom-holdings:v1", JSON.stringify(holdings));
  window.localStorage.setItem("bullbrief:kyp-drafts:v2", JSON.stringify({
    "demo-td": completedDraft,
    "demo-enb": partialDraft,
    "demo-msft": { ...partialDraft, reviewContext: "significant-change", firmApproval: "approved" },
    "demo-health": { ...partialDraft, firmApproval: "pending" },
  }));
  window.localStorage.setItem("bullbrief:report-identity:v1", JSON.stringify({ name: "Alex Morgan" }));
  window.localStorage.setItem("bullbrief:institution-brand:v1", JSON.stringify({ companyName: "Northstar Wealth Advisory", brandColor: "#4be277" }));
  window.localStorage.setItem("bullbrief:workspace-modules:v1", JSON.stringify(["watchlist", "markets", "picks", "kyp", "news", "podcasts", "saved"]));
  window.localStorage.setItem(`bullbrief:advisor-controls:${dateKey}`, JSON.stringify(["market", "kyc", "kyp", "records"]));
  window.localStorage.setItem(SEEDED_KEY, new Date().toISOString());
}
