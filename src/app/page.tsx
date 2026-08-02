import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bookmark,
  Bot,
  Check,
  ChevronRight,
  Grid2X2,
  LineChart,
  List,
  Newspaper,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export const metadata: Metadata = {
  title: "BullBrief — Markets, made clear",
  description:
    "A focused daily market brief, personalized watchlists, relevant news and practical stock research in one calm workspace.",
};

const marketRows = [
  { symbol: "ENB", name: "Enbridge Inc.", price: "$64.12", change: "+1.24%", path: "M0 28 L12 24 L24 26 L36 18 L48 20 L60 14 L72 17 L84 8 L96 11 L108 5" },
  { symbol: "AAPL", name: "Apple Inc.", price: "$208.14", change: "+0.82%", path: "M0 25 L12 28 L24 20 L36 22 L48 15 L60 18 L72 12 L84 15 L96 7 L108 10" },
  { symbol: "RY", name: "Royal Bank", price: "$205.30", change: "+0.41%", path: "M0 22 L12 19 L24 21 L36 16 L48 18 L60 13 L72 15 L84 10 L96 12 L108 7" },
];

function Sparkline({ path, negative = false }: { path: string; negative?: boolean }) {
  return (
    <svg viewBox="0 0 108 34" aria-hidden="true" className="h-9 w-28 overflow-visible">
      <path d="M0 26 H108" stroke="currentColor" className="text-white/10" strokeDasharray="2 3" />
      <path
        d={path}
        fill="none"
        stroke={negative ? "#ff7a73" : "#4be277"}
        strokeWidth="1.75"
        vectorEffect="non-scaling-stroke"
        className="landing-chart-line"
      />
    </svg>
  );
}

function WindowFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/12 bg-[#1a1c18] shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
      <div className="flex h-10 items-center justify-between border-b border-white/8 px-4">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</span>
        <span className="w-8" />
      </div>
      {children}
    </div>
  );
}

function BriefMockup() {
  return (
    <WindowFrame label="Daily brief · sample interface">
      <div className="grid min-h-[430px] grid-cols-[72px_1fr] sm:grid-cols-[112px_1fr]">
        <aside className="border-r border-white/8 p-3 sm:p-4">
          <BrandLogo variant="wordmark" size="sm" className="mb-8 max-w-full" />
          <div className="space-y-2">
            {[Grid2X2, List, LineChart, Newspaper, Play, Bookmark].map((Icon, index) => (
              <div key={index} className={`flex h-8 items-center gap-2 rounded-lg px-2 ${index === 0 ? "bg-[#4be277] text-[#0b3519]" : "text-white/35"}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden text-[9px] sm:block">{["Brief", "Watchlist", "Markets", "News", "Podcasts", "Saved"][index]}</span>
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#4be277]">Wednesday · Before the bell</p>
              <h3 className="mt-1 font-display text-2xl text-white">Good morning.</h3>
              <p className="mt-1 text-[10px] text-white/45">Here’s what could matter to your watchlist today.</p>
            </div>
            <div className="rounded-full border border-white/10 p-2 text-white/55"><Bell className="h-3.5 w-3.5" /></div>
          </div>
          <div className="mb-3 rounded-xl border border-[#4be277]/22 bg-[#4be277]/6 p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#79eb96]"><Sparkles className="h-3.5 w-3.5" /> Bull AI summary</div>
            <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-white/70">Energy leads Toronto futures while two companies on your watchlist report this week. Bank earnings remain the main calendar item.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[['S&P/TSX', '25,914', '+0.42%'], ['S&P 500', '5,621', '+0.18%'], ['CAD/USD', '0.7214', '-0.08%']].map(([name, value, change], index) => (
              <div key={name} className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-[9px] text-white/40">{name}</p>
                <p className="mt-2 font-mono text-sm text-white">{value}</p>
                <p className={`mt-1 font-mono text-[9px] ${index === 2 ? "text-[#ff7a73]" : "text-[#4be277]"}`}>{change}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-xl bg-white/[0.035] p-3">
              <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-semibold">Your watchlist</span><span className="text-[8px] text-white/35">3 stocks</span></div>
              {marketRows.slice(0, 2).map((stock) => <div key={stock.symbol} className="flex items-center justify-between border-t border-white/7 py-2"><div><p className="font-mono text-[9px]">{stock.symbol}</p><p className="text-[8px] text-white/35">{stock.name}</p></div><Sparkline path={stock.path} /><p className="font-mono text-[9px] text-[#4be277]">{stock.change}</p></div>)}
            </div>
            <div className="rounded-xl bg-[#e9e5d8] p-3 text-[#23251f]">
              <p className="text-[9px] font-semibold">Today’s signal</p>
              <p className="mt-3 font-display text-lg leading-tight">Less noise. More context.</p>
              <p className="mt-2 text-[8px] leading-relaxed opacity-60">News is ranked around the securities you follow.</p>
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}

function WatchlistMockup() {
  return (
    <WindowFrame label="Watchlist · sample interface">
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div><p className="font-display text-xl">My Watchlist</p><p className="mt-1 text-[10px] text-white/40">The companies you care about, in one view.</p></div>
          <div className="flex rounded-lg border border-white/10 p-1"><span className="rounded-md bg-white/10 p-1.5"><List className="h-3 w-3" /></span><span className="p-1.5 text-white/35"><Grid2X2 className="h-3 w-3" /></span></div>
        </div>
        <div className="mb-2 grid grid-cols-[1.2fr_.7fr_.8fr] px-3 font-mono text-[8px] uppercase tracking-wider text-white/30"><span>Company</span><span>Intraday</span><span className="text-right">Price / change</span></div>
        {marketRows.map((stock) => (
          <div key={stock.symbol} className="grid grid-cols-[1.2fr_.7fr_.8fr] items-center border-t border-white/8 px-3 py-4">
            <div><p className="font-mono text-xs font-semibold">{stock.symbol}</p><p className="mt-0.5 truncate text-[9px] text-white/40">{stock.name}</p></div>
            <Sparkline path={stock.path} />
            <div className="text-right"><p className="font-mono text-xs">{stock.price}</p><p className="mt-1 font-mono text-[9px] text-[#4be277]">{stock.change}</p></div>
          </div>
        ))}
      </div>
    </WindowFrame>
  );
}

function StockMockup() {
  return (
    <WindowFrame label="Stock view · sample interface">
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between"><div><p className="font-mono text-[8px] uppercase tracking-widest text-[#4be277]">TSX · CAD · Delayed</p><h3 className="mt-2 font-display text-xl">Enbridge Inc.</h3><p className="font-mono text-[9px] text-white/35">ENB.TO</p></div><button className="rounded-full bg-[#4be277] px-3 py-2 text-[9px] font-semibold text-[#0b3519]">+ Watch</button></div>
        <div className="mt-5 flex items-end gap-3"><p className="font-mono text-3xl">64.12</p><p className="mb-1 font-mono text-[10px] text-[#4be277]">+0.78 (+1.24%)</p></div>
        <div className="mt-5 rounded-xl border border-white/8 bg-black/10 p-3">
          <div className="mb-2 flex gap-3 font-mono text-[8px] text-white/35"><span className="rounded bg-[#4be277]/15 px-2 py-1 text-[#4be277]">1D</span><span className="py-1">5D</span><span className="py-1">1M</span><span className="py-1">1Y</span></div>
          <svg viewBox="0 0 500 170" className="h-44 w-full" aria-label="Illustrative intraday stock chart">
            {[35,75,115,155].map((y) => <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,.08)" strokeDasharray="3 5" />)}
            {Array.from({length: 38}, (_,i) => <rect key={i} x={i*13+2} y={142-(i%7)*3} width="4" height={18+(i%7)*3} fill="rgba(190,203,189,.25)" />)}
            <line x1="0" y1="92" x2="500" y2="92" stroke="rgba(220,230,220,.38)" strokeDasharray="5 5" />
            <path d="M0 112 L22 105 L44 118 L66 97 L88 101 L110 90 L132 95 L154 80 L176 84 L198 72 L220 76 L242 62 L264 70 L286 55 L308 58 L330 46 L352 52 L374 38 L396 43 L418 31 L440 35 L462 22 L484 27 L500 18" fill="none" stroke="#4be277" strokeWidth="2.5" className="landing-chart-line" />
            <line x1="0" y1="18" x2="500" y2="18" stroke="#4be277" strokeDasharray="4 5" opacity=".6" />
          </svg>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">{[['Previous close','63.34'],['Day range','63.18 – 64.29'],['Volume','5.8M']].map(([k,v]) => <div key={k} className="border-t border-white/8 pt-3"><p className="text-[8px] text-white/35">{k}</p><p className="mt-1 font-mono text-[9px]">{v}</p></div>)}</div>
      </div>
    </WindowFrame>
  );
}

function AssistantMockup() {
  return (
    <WindowFrame label="Bull AI · sample interface">
      <div className="p-5 sm:p-7">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4"><div className="rounded-full bg-[#4be277]/12 p-2 text-[#4be277]"><Bot className="h-4 w-4" /></div><div><p className="text-xs font-semibold">Bull AI Assistant</p><p className="text-[9px] text-white/35">Ask about your brief and watchlist</p></div></div>
        <div className="py-5"><div className="ml-auto max-w-[78%] rounded-2xl rounded-br-sm bg-[#e9e5d8] px-4 py-3 text-[10px] leading-relaxed text-[#20221e]">What changed for the Canadian banks I follow?</div><div className="mt-3 max-w-[88%] rounded-2xl rounded-bl-sm bg-white/[0.055] px-4 py-3 text-[10px] leading-relaxed text-white/70">Royal Bank moved higher alongside the broader financial sector. The next useful dates are its earnings release and dividend record date. I can compare it with TD and BMO.</div></div>
        <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/10 p-2"><Search className="ml-1 h-3.5 w-3.5 text-white/35" /><span className="flex-1 text-[9px] text-white/30">Ask a question about your markets…</span><span className="rounded-lg bg-[#4be277] p-2 text-[#0b3519]"><ArrowRight className="h-3 w-3" /></span></div>
      </div>
    </WindowFrame>
  );
}

const features = [
  ["A brief that starts with you", "Your watched companies, material market moves, relevant headlines and useful audio—organized before you start clicking."],
  ["Research without the tab pile", "Move from a market overview to stock performance, company data and side-by-side comparisons in one consistent workspace."],
  ["Useful for client conversations", "Bring a cleaner view of what changed, why it may matter and what deserves a follow-up—without presenting noise as insight."],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#1f211d] text-[#f6f5f0] selection:bg-[#4be277] selection:text-[#0b3519]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#1f211d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="BullBrief home"><BrandLogo variant="wordmark" size="md" /></Link>
          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex" aria-label="Landing page navigation"><a href="#product" className="transition-colors hover:text-white">Product</a><a href="#features" className="transition-colors hover:text-white">Why BullBrief</a><a href="#advisors" className="transition-colors hover:text-white">For advisors</a></nav>
          <div className="flex items-center gap-2"><Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/8">Log in</Link><Link href="/signup" className="rounded-full bg-[#f4f1e8] px-4 py-2.5 text-sm font-semibold text-[#20221e] transition-transform hover:scale-[1.02] active:scale-[.98]">Sign up</Link></div>
        </div>
      </header>

      <section className="relative px-5 pb-20 pt-36 sm:px-8 sm:pt-44 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[#79eb96]">Your daily market brief is here</p>
            <h1 className="font-display text-[clamp(3.35rem,8.2vw,8.3rem)] font-medium leading-[0.86] tracking-[-0.065em]">Know what matters.<br /><span className="italic text-[#b8b9b0]">Skip what doesn’t.</span></h1>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">BullBrief brings your watchlist, market context, relevant news and practical research into one calm place.</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"><Link href="/signup" className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#4be277] px-7 py-4 text-sm font-bold text-[#0b3519] transition-transform hover:scale-[1.02] sm:w-auto">Create your brief <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link><Link href="/login" className="flex w-full items-center justify-center rounded-full border border-white/18 px-7 py-4 text-sm font-semibold transition-colors hover:bg-white/7 sm:w-auto">Log in</Link></div>
            <p className="mt-4 text-[11px] text-white/35">Free to start. No payment details required.</p>
          </div>
          <div id="product" className="landing-hero-window relative mx-auto mt-16 max-w-6xl scroll-mt-28"><div className="absolute -inset-16 -z-10 bg-[#4be277]/8 blur-[100px]" /><BriefMockup /></div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#e9e5d8] px-5 py-24 text-[#22241f] sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div className="max-w-lg"><p className="font-mono text-[10px] uppercase tracking-[.22em] opacity-50">One personal market view</p><h2 className="mt-5 font-display text-5xl leading-[.95] tracking-[-.05em] sm:text-6xl">Follow fewer things. Understand them better.</h2><p className="mt-6 text-base leading-relaxed opacity-65">Your watchlist is more than a saved list. It shapes the brief you open, the news you see and the updates worth bringing to your attention.</p><ul className="mt-8 space-y-4 text-sm">{["List and grid views", "U.S. and Canadian listings", "Relevant, non-intrusive updates"].map(item => <li key={item} className="flex items-center gap-3"><span className="rounded-full bg-[#1f211d] p-1 text-[#4be277]"><Check className="h-3 w-3" /></span>{item}</li>)}</ul></div>
          <WatchlistMockup />
        </div>
      </section>

      <section id="features" className="scroll-mt-20 px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><StockMockup /><div className="max-w-lg lg:pl-10"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#79eb96]">From movement to context</p><h2 className="mt-5 font-display text-5xl leading-[.95] tracking-[-.05em] sm:text-6xl">A stock page that answers the next question.</h2><p className="mt-6 text-base leading-relaxed text-white/55">See the movement, volume and key company data together. Then compare the name, save it or ask Bull AI for a plain-language explanation.</p><Link href="/signup" className="group mt-8 inline-flex items-center gap-2 border-b border-white/25 pb-1 text-sm font-semibold">Explore BullBrief <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></div>
          <div className="mt-28 grid gap-px overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/10 lg:grid-cols-3">{features.map(([title,copy]) => <article key={title} className="bg-[#1f211d] p-7 sm:p-9"><ChevronRight className="h-5 w-5 text-[#4be277]" /><h3 className="mt-14 font-display text-2xl">{title}</h3><p className="mt-4 text-sm leading-relaxed text-white/48">{copy}</p></article>)}</div>
        </div>
      </section>

      <section id="advisors" className="scroll-mt-20 bg-[#171916] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-2 lg:items-center">
          <div className="max-w-xl"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#4be277]/25 bg-[#4be277]/8 text-[#4be277]"><Bot className="h-5 w-5" /></div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#79eb96]">Bull AI Assistant</p><h2 className="mt-5 font-display text-5xl leading-[.95] tracking-[-.05em] sm:text-6xl">Ask the market question you actually have.</h2><p className="mt-6 text-base leading-relaxed text-white/55">Start with the information already in your brief. Summarize a move, compare watched companies or prepare a focused follow-up for a client conversation.</p><p className="mt-5 text-xs leading-relaxed text-white/32">Bull AI supports research and organization. It does not replace professional judgment or provide personalized investment advice.</p></div>
          <AssistantMockup />
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-36"><div className="mx-auto max-w-5xl text-center"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#79eb96]">A better daily habit</p><h2 className="mt-6 font-display text-6xl leading-[.9] tracking-[-.055em] sm:text-7xl lg:text-8xl">Open one brief.<br />Leave with a plan.</h2><p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/52">Build a market routine around the companies, stories and decisions that deserve your attention.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/signup" className="group flex items-center justify-center gap-2 rounded-full bg-[#4be277] px-8 py-4 text-sm font-bold text-[#0b3519]">Sign up free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link><Link href="/login" className="rounded-full border border-white/18 px-8 py-4 text-sm font-semibold hover:bg-white/7">Log in</Link></div></div></section>

      <footer className="border-t border-white/8 px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><BrandLogo variant="wordmark" size="md" /><p className="mt-3 text-xs text-white/35">Your daily market brief is here.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/42"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><Link href="/disclaimer" className="hover:text-white">Disclaimer</Link><Link href="/login" className="hover:text-white">Log in</Link></div></div><div className="mx-auto mt-8 max-w-[1440px] border-t border-white/7 pt-6 text-[10px] leading-relaxed text-white/25">Market data displayed in product mockups is illustrative. BullBrief provides information and research tools, not investment advice. © {new Date().getFullYear()} BullBrief.</div></footer>
    </main>
  );
}
