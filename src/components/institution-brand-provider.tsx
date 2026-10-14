"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { applyInstitutionBrand, DEFAULT_BRAND_COLOR, INSTITUTION_BRAND_EVENT, INSTITUTION_BRAND_KEY, normalizeBrandColor, REPORT_IDENTITY_EVENT, REPORT_IDENTITY_KEY, type InstitutionBrand } from "@/lib/institution-brand";

const defaultBrand: InstitutionBrand = { companyName: "", brandColor: DEFAULT_BRAND_COLOR, institutionLogo: "" };
const InstitutionBrandContext = createContext<InstitutionBrand>(defaultBrand);

export function useInstitutionBrand() {
  return useContext(InstitutionBrandContext);
}

export function InstitutionBrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<InstitutionBrand>(defaultBrand);
  const brandRef = useRef(defaultBrand);

  useEffect(() => {
    const update = (next: Partial<InstitutionBrand>) => {
      setBrand((current) => {
        const resolved = {
          companyName: typeof next.companyName === "string" ? next.companyName : current.companyName,
          brandColor: normalizeBrandColor(next.brandColor ?? current.brandColor),
          institutionLogo: typeof next.institutionLogo === "string" ? next.institutionLogo : current.institutionLogo,
        };
        brandRef.current = resolved;
        applyInstitutionBrand(resolved);
        return resolved;
      });
    };
    const timer = window.setTimeout(async () => {
      try {
        update(JSON.parse(localStorage.getItem(INSTITUTION_BRAND_KEY) || "{}"));
      } catch {}
      try {
        const identity = JSON.parse(localStorage.getItem(REPORT_IDENTITY_KEY) || "{}");
        if (typeof identity.institutionLogo === "string") update({ institutionLogo: identity.institutionLogo });
      } catch {}
      try {
        const [preferencesResponse, profileResponse] = await Promise.all([
          fetch("/api/preferences"),
          fetch("/api/profile"),
        ]);
        if (preferencesResponse.ok) {
          const preferences = (await preferencesResponse.json()).data;
          if (preferences && (typeof preferences.companyName === "string" || typeof preferences.brandColor === "string")) {
            update({
              ...(typeof preferences.companyName === "string" && { companyName: preferences.companyName }),
              ...(typeof preferences.brandColor === "string" && { brandColor: preferences.brandColor }),
            });
          }
        }
        if (profileResponse.ok) {
          const profile = (await profileResponse.json()).data;
          if (typeof profile?.institutionLogo === "string") update({ institutionLogo: profile.institutionLogo });
        }
      } catch {}
    }, 0);
    const handleUpdate = (event: Event) => update((event as CustomEvent<InstitutionBrand>).detail || {});
    const observer = new MutationObserver(() => applyInstitutionBrand(brandRef.current));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener(INSTITUTION_BRAND_EVENT, handleUpdate);
    window.addEventListener(REPORT_IDENTITY_EVENT, handleUpdate);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener(INSTITUTION_BRAND_EVENT, handleUpdate);
      window.removeEventListener(REPORT_IDENTITY_EVENT, handleUpdate);
    };
  }, []);

  return <InstitutionBrandContext.Provider value={brand}>{children}</InstitutionBrandContext.Provider>;
}
