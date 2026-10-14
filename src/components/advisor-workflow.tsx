"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  ClipboardCheck,
  Newspaper,
  ScanLine,
  TrendingUp,
} from "lucide-react";

type AdvisorWorkflowProps = {
  watchlistCount: number;
  headlineCount: number;
  portfolioExceptions: number;
};

const KYP_DOCUMENTS_KEY = "bullbrief:kyp-custom-holdings:v1";
const KYP_DRAFTS_KEY = "bullbrief:kyp-drafts:v2";

export function AdvisorWorkflow({ watchlistCount, headlineCount, portfolioExceptions }: AdvisorWorkflowProps) {
  const [kypStatus, setKypStatus] = useState("Open KYP queue");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const documents = JSON.parse(localStorage.getItem(KYP_DOCUMENTS_KEY) || "[]") as Array<{ id: string }>;
        const drafts = JSON.parse(localStorage.getItem(KYP_DRAFTS_KEY) || "{}") as Record<string, { completed?: boolean }>;
        const pending = documents.filter((document) => !drafts[document.id]?.completed).length;
        setKypStatus(pending ? `${pending} review${pending === 1 ? "" : "s"} pending` : documents.length ? "All reviews complete" : "Start a KYP review");
      } catch {
        setKypStatus("Open KYP queue");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const queue = [
    { href: "/kyp", label: "KYP exceptions", detail: kypStatus, action: "Open", icon: ClipboardCheck },
    { href: "/watchlist", label: "Portfolio exceptions", detail: portfolioExceptions ? `${portfolioExceptions} holding${portfolioExceptions === 1 ? "" : "s"} moved 2% or more` : watchlistCount ? "No material moves detected" : "No portfolio connected", action: "Open", icon: BriefcaseBusiness },
    { href: "/news", label: "Client talking points", detail: headlineCount ? `${headlineCount} current market developments` : "No current developments", action: "Open", icon: Newspaper },
  ];

  const tools = [
    { href: "/picks", label: "Security research", icon: ScanLine },
    { href: "/markets", label: "Markets", icon: TrendingUp },
    { href: "/saved", label: "Research library", icon: Bookmark },
  ];

  return (
    <section aria-labelledby="advisor-workflow-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Today</p>
          <h2 id="advisor-workflow-heading" className="mt-1 font-display text-3xl font-semibold text-on-surface">Daily exceptions</h2>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
        {queue.map(({ href, label, detail, action, icon: Icon }) => (
          <a key={href} href={href} className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-outline-variant px-4 py-3.5 transition-colors hover:bg-surface-container-low md:grid-cols-[2.5rem_12rem_minmax(0,1fr)_auto_auto]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant transition-colors group-hover:bg-primary/10 group-hover:text-primary"><Icon className="h-4 w-4" /></span>
            <span className="text-sm font-semibold text-on-surface">{label}</span>
            <span className="hidden text-xs text-on-surface-variant md:block">{detail}</span>
            <span className="hidden rounded-full border border-outline-variant px-3 py-1 text-[10px] font-semibold text-on-surface-variant lg:block">{action}</span>
            <ArrowUpRight className="h-4 w-4 text-on-surface-variant transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </a>
        ))}
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-low/45 px-4 py-3">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Tools</span>
          {tools.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
              <Icon className="h-3.5 w-3.5" />{label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
