import "server-only";

import { emptyStockDetails, type StockDetails } from "./rapidapi";

const DEFAULT_BASE_URL = "https://www.us-api.morningstar.com/direct-web-services";
const BASE_URL = (process.env.MORNINGSTAR_DWS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const AUTH_URL = process.env.MORNINGSTAR_DWS_AUTH_URL || "";
const USERNAME = process.env.MORNINGSTAR_DWS_USERNAME || "";
const PASSWORD = process.env.MORNINGSTAR_DWS_PASSWORD || "";
const CLIENT_ID = process.env.MORNINGSTAR_DWS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.MORNINGSTAR_DWS_CLIENT_SECRET || "";
const STATIC_TOKEN = process.env.MORNINGSTAR_DWS_ACCESS_TOKEN || "";
const EQUITY_VIEW = process.env.MORNINGSTAR_DWS_EQUITY_VIEW || "";
const MANAGED_VIEW = process.env.MORNINGSTAR_DWS_MANAGED_VIEW || "";
const FACTSHEET_URL_TEMPLATE = process.env.MORNINGSTAR_DWS_FACTSHEET_URL_TEMPLATE || "";
const FACTSHEET_METHOD = (process.env.MORNINGSTAR_DWS_FACTSHEET_METHOD || "GET").toUpperCase();
const FACTSHEET_BODY_TEMPLATE = process.env.MORNINGSTAR_DWS_FACTSHEET_BODY_TEMPLATE || "";

type TokenState = { token: string; expiresAt: number };
let tokenState: TokenState | null = null;

export type DirectInvestmentRequest = {
  id: string;
  idType: "tradingSymbol" | "performanceId" | "isin" | "cusip" | "msid" | "fundCode";
  assetType?: "stock" | "fund";
  viewId?: string;
};

export function isMorningstarDirectConfigured() {
  return Boolean(
    (STATIC_TOKEN || (AUTH_URL && USERNAME && PASSWORD)) &&
    (EQUITY_VIEW || MANAGED_VIEW)
  );
}

export function getMorningstarDirectConfiguration() {
  return {
    configured: isMorningstarDirectConfigured(),
    baseUrl: BASE_URL,
    authentication: STATIC_TOKEN ? "access_token" : AUTH_URL && USERNAME && PASSWORD ? "oauth" : "missing",
    equityViewConfigured: Boolean(EQUITY_VIEW),
    managedInvestmentViewConfigured: Boolean(MANAGED_VIEW),
    fundFactsheetConfigured: Boolean(FACTSHEET_URL_TEMPLATE),
  };
}

function interpolateTemplate(template: string, performanceId: string, languageId: string) {
  return template
    .replaceAll("{performanceId}", encodeURIComponent(performanceId))
    .replaceAll("{languageId}", encodeURIComponent(languageId));
}

export async function downloadDirectFundFactsheet(performanceId: string, languageId = "ENG") {
  if (!FACTSHEET_URL_TEMPLATE) throw new Error("Morningstar fund factsheet delivery is not configured");
  const token = await getAccessToken();
  const configuredUrl = interpolateTemplate(FACTSHEET_URL_TEMPLATE, performanceId, languageId);
  const url = configuredUrl.startsWith("http") ? configuredUrl : `${BASE_URL}${configuredUrl.startsWith("/") ? "" : "/"}${configuredUrl}`;
  const body = FACTSHEET_BODY_TEMPLATE
    ? interpolateTemplate(FACTSHEET_BODY_TEMPLATE, performanceId, languageId)
    : undefined;
  const response = await fetch(url, {
    method: FACTSHEET_METHOD,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/pdf, application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Morningstar factsheet request failed (${response.status})`);

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) return response;
  if (contentType.includes("application/json")) {
    const payload = await response.json() as Record<string, unknown>;
    const reportUrl = [payload.downloadUrl, payload.reportUrl, payload.url].find((value): value is string => typeof value === "string" && value.startsWith("http"));
    if (reportUrl) {
      const report = await fetch(reportUrl, { headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" }, cache: "no-store" });
      if (report.ok && (report.headers.get("content-type") || "").includes("application/pdf")) return report;
    }
  }
  throw new Error("Morningstar factsheet response did not contain a PDF");
}

async function getAccessToken(): Promise<string> {
  if (STATIC_TOKEN) return STATIC_TOKEN;
  if (tokenState && tokenState.expiresAt > Date.now() + 60_000) return tokenState.token;
  if (!AUTH_URL || !USERNAME || !PASSWORD) throw new Error("Morningstar Direct authentication is not configured");

  const body = new URLSearchParams({
    grant_type: "password",
    username: USERNAME,
    password: PASSWORD,
  });
  if (CLIENT_ID) body.set("client_id", CLIENT_ID);
  if (CLIENT_SECRET) body.set("client_secret", CLIENT_SECRET);

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Morningstar Direct authentication failed (${response.status})`);

  const payload = await response.json() as { access_token?: string; token?: string; expires_in?: number };
  const token = payload.access_token || payload.token;
  if (!token) throw new Error("Morningstar Direct did not return an access token");
  tokenState = {
    token,
    expiresAt: Date.now() + Math.min(Number(payload.expires_in) || 3600, 3600) * 1000,
  };
  return token;
}

async function directFetch(path: string) {
  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Morningstar Direct request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}

export async function listMorningstarEntitledViews() {
  return directFetch("/v1/investments/views");
}

export async function getDirectInvestment(request: DirectInvestmentRequest) {
  const viewId = request.viewId || (request.assetType === "fund" ? MANAGED_VIEW : EQUITY_VIEW);
  if (!viewId) throw new Error(`Morningstar Direct ${request.assetType || "investment"} view is not configured`);
  const path = `/v1/investments/${encodeURIComponent(request.id)}/${encodeURIComponent(viewId)}?idType=${encodeURIComponent(request.idType)}`;
  return directFetch(path);
}

function flatten(value: unknown, output: Map<string, unknown>, depth = 0) {
  if (depth > 10 || value == null) return;
  if (Array.isArray(value)) {
    value.forEach((item) => flatten(item, output, depth + 1));
    return;
  }
  if (typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (!output.has(normalized) && (typeof child === "string" || typeof child === "number")) output.set(normalized, child);
    flatten(child, output, depth + 1);
  }
}

function pickString(values: Map<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const value = values.get(alias.toLowerCase());
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function pickNumber(values: Map<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const value = values.get(alias.toLowerCase());
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

export async function getDirectStockDetails(ticker: string): Promise<StockDetails> {
  const empty = emptyStockDetails(ticker);
  if (!isMorningstarDirectConfigured() || !EQUITY_VIEW) return empty;
  try {
    const payload = await getDirectInvestment({ id: ticker, idType: "tradingSymbol", assetType: "stock" });
    const values = new Map<string, unknown>();
    flatten(payload, values);
    return {
      ...empty,
      name: pickString(values, ["securityname", "companyname", "name"]),
      performanceId: pickString(values, ["performanceid"]),
      cusip: pickString(values, ["cusip"]),
      isin: pickString(values, ["isin"]),
      sector: pickString(values, ["sectorname", "sector"]),
      industry: pickString(values, ["industryname", "industry"]),
      profileDescription: pickString(values, ["companyprofile", "businessdescription", "description"]),
      website: pickString(values, ["website", "companywebsite"]),
      employees: pickNumber(values, ["totalemployees", "employees"]),
      pe: pickNumber(values, ["pricetoearnings", "pricetoearningsnormalized", "peratio"]),
      priceToBook: pickNumber(values, ["pricetobook", "pbratio"]),
      priceToSales: pickNumber(values, ["pricetosales", "psratio"]),
      priceToCashFlow: pickNumber(values, ["pricetocashflow", "pcfratio"]),
      dividendYield: pickNumber(values, ["dividendyield", "trailingdividendyield"]),
      forwardDividendYield: pickNumber(values, ["forwarddividendyield"]),
      marketCap: pickNumber(values, ["marketcapitalization", "marketcap"]),
      starRating: pickNumber(values, ["stockstarrating", "starrating"]),
      fairValue: pickNumber(values, ["fairvalue", "fairvalueestimate"]),
      economicMoat: pickString(values, ["economicmoat", "moatrating"]),
      sharesOutstanding: pickNumber(values, ["sharesoutstanding", "totalsharesoutstanding"]),
      availableComponents: [EQUITY_VIEW],
      requestStatus: "live",
      retrievedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Morningstar Direct investment lookup failed", error);
    return empty;
  }
}

export async function getDirectFundDetails(performanceId: string, fallbackName = performanceId): Promise<StockDetails> {
  const empty = emptyStockDetails(fallbackName);
  if (!isMorningstarDirectConfigured() || !MANAGED_VIEW || !performanceId) return empty;
  try {
    const payload = await getDirectInvestment({ id: performanceId, idType: "performanceId", assetType: "fund" });
    const values = new Map<string, unknown>();
    flatten(payload, values);
    return {
      ...empty,
      name: pickString(values, ["legalname", "securityname", "fundname", "name"]),
      performanceId,
      cusip: pickString(values, ["cusip"]),
      isin: pickString(values, ["isin"]),
      profileDescription: pickString(values, ["investmentstrategy", "fundstrategy", "description"]),
      styleBox: pickString(values, ["equitystylebox", "stylebox"]),
      totalReturn1Y: pickNumber(values, ["totalreturn1year", "return1year"]),
      totalReturn3Y: pickNumber(values, ["totalreturn3year", "return3year"]),
      totalReturn5Y: pickNumber(values, ["totalreturn5year", "return5year"]),
      morningstarRating3Y: pickNumber(values, ["morningstarrating3year", "rating3year"]),
      morningstarRating5Y: pickNumber(values, ["morningstarrating5year", "rating5year"]),
      morningstarRating10Y: pickNumber(values, ["morningstarrating10year", "rating10year"]),
      processRating: pickString(values, ["processrating"]),
      peopleRating: pickString(values, ["peoplerating"]),
      parentRating: pickString(values, ["parentrating"]),
      esgRiskRating: pickString(values, ["sustainabilityrating", "esgriskrating"]),
      availableComponents: [MANAGED_VIEW],
      requestStatus: "live",
      retrievedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Morningstar Direct managed-investment lookup failed", error);
    return empty;
  }
}
