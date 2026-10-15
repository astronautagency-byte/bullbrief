export const INSTITUTION_BRAND_KEY = "bullbrief:institution-brand:v1";
export const INSTITUTION_BRAND_EVENT = "bullbrief:institution-brand";
export const REPORT_IDENTITY_KEY = "bullbrief:report-identity:v1";
export const REPORT_IDENTITY_EVENT = "bullbrief:report-identity";
export const ADVISOR_ROSTER_KEY = "bullbrief:advisor-roster:v1";
export const ADVISOR_ROSTER_EVENT = "bullbrief:advisor-roster";
export const DEFAULT_BRAND_COLOR = "#4be277";

export type InstitutionBrand = {
  companyName: string;
  brandColor: string;
  institutionLogo: string;
};

export function normalizeBrandColor(value: unknown): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_BRAND_COLOR;
}

function hexToRgb(hex: string) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as [number, number, number];
}

function rgbToHex(rgb: [number, number, number]) {
  return `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}

function mix(color: [number, number, number], target: [number, number, number], amount: number): [number, number, number] {
  return color.map((value, index) => value + (target[index] - value) * amount) as [number, number, number];
}

function luminance(rgb: [number, number, number]) {
  const values = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrast(a: [number, number, number], b: [number, number, number]) {
  const high = Math.max(luminance(a), luminance(b));
  const low = Math.min(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
}

function accessibleAccent(base: [number, number, number], mode: "dark" | "light") {
  const surface: [number, number, number] = mode === "dark" ? [31, 33, 29] : [250, 249, 246];
  const target: [number, number, number] = mode === "dark" ? [255, 255, 255] : [0, 0, 0];
  let result = base;
  for (let amount = 0; contrast(result, surface) < 3 && amount <= 0.8; amount += 0.05) {
    result = mix(base, target, amount);
  }
  return result;
}

export function applyInstitutionBrand(brand: InstitutionBrand) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const base = hexToRgb(normalizeBrandColor(brand.brandColor));
  const mode = root.classList.contains("light") ? "light" : "dark";
  const accent = accessibleAccent(base, mode);
  const onPrimary = contrast(accent, [11, 20, 15]) >= contrast(accent, [255, 255, 255]) ? "#0b140f" : "#ffffff";
  root.style.setProperty("--brand-primary", rgbToHex(accent));
  root.style.setProperty("--brand-primary-rgb", accent.join(" "));
  root.style.setProperty("--brand-primary-fixed", rgbToHex(mix(accent, [255, 255, 255], 0.14)));
  root.style.setProperty("--brand-primary-container", rgbToHex(mix(accent, [0, 0, 0], 0.12)));
  root.style.setProperty("--brand-on-primary", onPrimary);
  root.style.setProperty("--brand-print-primary", normalizeBrandColor(brand.brandColor));
}
