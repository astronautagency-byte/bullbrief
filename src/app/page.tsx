import Link from "next/link";
import { ArrowRight, TrendingUp, Newspaper, Podcast } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant bg-surface-container-low/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo variant="horizontal" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-on-surface-variant hover:text-primary transition-colors font-medium px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary-fixed text-on-primary font-display font-bold px-5 py-2 rounded-lg glow-primary glow-primary-hover transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[800px] h-[800px] bg-primary opacity-5 blur-[120px] rounded-full" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="font-display font-black text-5xl md:text-7xl text-on-surface mb-6 italic tracking-tight leading-tight">
              Your market,
              <br />
              <span className="text-primary">summarized.</span>
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Follow the stocks that matter to you and get daily market updates,
              relevant headlines and podcast episodes in one focused briefing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="bg-primary hover:bg-primary-fixed text-on-primary font-display font-bold text-lg px-8 py-4 rounded-lg glow-primary glow-primary-hover transition-all active:scale-95 flex items-center gap-2"
              >
                Build My Brief
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary font-display font-bold text-lg px-8 py-4 rounded-lg transition-all active:scale-95"
              >
                See How It Works
              </a>
            </div>
          </div>
        </section>

        <section className="relative py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 md:p-8 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { sym: "S&P 500", val: "5,432.10", chg: "+1.2%", up: true },
                  { sym: "NASDAQ", val: "17,891.05", chg: "+1.8%", up: true },
                  { sym: "DOW", val: "39,872.30", chg: "-0.3%", up: false },
                  { sym: "TSX", val: "22,156.40", chg: "+0.5%", up: true },
                ].map((idx) => (
                  <div
                    key={idx.sym}
                    className="bg-surface-container border border-surface-container rounded-lg p-3"
                  >
                    <span className="font-mono text-xs text-on-surface-variant block">
                      {idx.sym}
                    </span>
                    <span className="font-mono text-lg font-medium text-on-surface block mt-1">
                      {idx.val}
                    </span>
                    <span
                      className={`font-mono text-sm ${idx.up ? "text-primary" : "text-error"}`}
                    >
                      {idx.chg}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-48 bg-surface-container rounded-lg border border-surface-container flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 600 160" fill="none">
                  <path
                    d="M0,120 L40,110 L80,115 L120,100 L160,90 L200,95 L240,80 L280,70 L320,60 L360,65 L400,50 L440,40 L480,35 L520,30 L560,25 L600,20"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0,120 L40,110 L80,115 L120,100 L160,90 L200,95 L240,80 L280,70 L320,60 L360,65 L400,50 L440,40 L480,35 L520,30 L560,25 L600,20 L600,160 L0,160 Z"
                    fill="url(#chartGradient)"
                  />
                  <defs>
                    <linearGradient
                      id="chartGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#4be277" stopOpacity="0.2" />
                      <stop
                        offset="100%"
                        stopColor="#0d1c2d"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: TrendingUp,
                    title: "Market Snapshot",
                    desc: "Major indexes and your watchlist at a glance",
                  },
                  {
                    icon: Newspaper,
                    title: "Top Stories",
                    desc: "Personalized headlines from trusted sources",
                  },
                  {
                    icon: Podcast,
                    title: "Podcast Episodes",
                    desc: "Relevant financial podcasts, curated for you",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface-container"
                  >
                    <f.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-on-surface text-sm">
                        {f.title}
                      </p>
                      <p className="text-on-surface-variant text-xs mt-0.5">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display font-bold text-3xl text-on-surface mb-4 italic">
              Simple. Fast. Editorial.
            </h2>
            <p className="text-on-surface-variant text-lg mb-12">
              Not a complicated trading terminal. Just the information you need.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Pick your stocks",
                  desc: "Add the tickers you follow to your personal watchlist.",
                },
                {
                  step: "2",
                  title: "Choose topics",
                  desc: "Select industries and podcast categories that interest you.",
                },
                {
                  step: "3",
                  title: "Get your brief",
                  desc: "A focused daily summary with everything you need to know.",
                },
              ].map((s) => (
                <div key={s.step} className="text-left">
                  <div className="w-10 h-10 bg-primary/10 text-primary font-display font-bold rounded-lg flex items-center justify-center text-lg mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-display font-bold text-on-surface text-lg mb-1">
                    {s.title}
                  </h3>
                  <p className="text-on-surface-variant">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-outline-variant">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-bold text-3xl text-on-surface mb-6 italic">
              Start your morning informed.
            </h2>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-fixed text-on-primary font-display font-bold text-lg px-8 py-4 rounded-lg glow-primary glow-primary-hover transition-all active:scale-95"
            >
              Build My Brief
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo variant="wordmark" size="sm" />
          </div>
          <p className="text-on-surface-variant/60 text-xs text-center max-w-xl">
            BullBrief provides market information and news for informational
            purposes only. It does not provide investment, financial, legal or
            tax advice. Market data may be delayed or incomplete. Always verify
            information independently before making financial decisions.
          </p>
          <div className="flex items-center gap-4 text-on-surface-variant text-sm">
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/disclaimer"
              className="hover:text-primary transition-colors"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
