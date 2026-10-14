"use client";

import { useEffect, useState } from "react";

const REPORT_IDENTITY_KEY = "bullbrief:report-identity:v1";

type ReportIdentity = { name: string; institutionLogo: string };

export function PrintBranding({ position }: { position: "header" | "footer" }) {
  const [identity, setIdentity] = useState<ReportIdentity>({ name: "", institutionLogo: "" });

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const local = JSON.parse(localStorage.getItem(REPORT_IDENTITY_KEY) || "{}");
        setIdentity({ name: local.name || "", institutionLogo: local.institutionLogo || "" });
      } catch {}
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const profile = (await response.json()).data;
          setIdentity((current) => ({
            name: profile.name || current.name,
            institutionLogo: profile.institutionLogo || current.institutionLogo,
          }));
        }
      } catch {}
    };
    const timer = window.setTimeout(() => void loadIdentity(), 0);
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<ReportIdentity>).detail;
      if (detail) setIdentity(detail);
    };
    window.addEventListener("bullbrief:report-identity", handleUpdate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bullbrief:report-identity", handleUpdate);
    };
  }, []);

  if (position === "header") {
    return (
      <div className="print-document-identity hidden" aria-hidden="true">
        <div className="print-institution-brand">
          {identity.institutionLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={identity.institutionLogo} alt="" />
          ) : (
            <span className="print-institution-placeholder">Institution logo</span>
          )}
        </div>
        <div className="print-prepared-by">
          <span>Prepared by</span>
          <strong>{identity.name || "User name not set"}</strong>
          <small>{new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</small>
        </div>
      </div>
    );
  }

  return (
      <div className="print-document-footer hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/BullBrief_Logo_Mark_Transparent.png" alt="" />
        <span>Created using BullBrief - Your Daily Market Brief is Here</span>
      </div>
  );
}
