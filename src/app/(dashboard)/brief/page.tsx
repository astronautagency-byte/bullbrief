"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import {
  formatPrice,
  formatPercent,
  formatChange,
  formatRelativeTime,
  formatDuration,
  getTrendDirection,
  stripHtml,
  type Article,
  type Episode,
  type BriefingData,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { AudioPlayer } from "@/components/ui/audio-player";
import { SentimentBadge } from "@/components/ui/badge";
import {
  RefreshCw,
  Newspaper,
  Loader2,
  Send,
  Podcast,
  Sparkles,
  Grid2X2,
  List,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/page-head";
import { MiniChart } from "@/components/ui/mini-chart";
import { NewsThumbnail } from "@/components/news-thumbnail";

interface WatchlistStock {
  symbol: string;
  companyName: string;
  exchangeCode: string;
  currency: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  marketTimestamp: string | null;
  dataType: string;
  available: boolean;
}

interface WatchlistItem {
  symbol: string;
  companyName: string;
  exchangeCode: string;
}

interface WatchlistRecord {
  isDefault: boolean;
  items: WatchlistItem[];
}

export default function BriefPage() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [podcastEpisodes, setPodcastEpisodes] = useState<Episode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<string | null>(null);

  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [watchlistView, setWatchlistView] = useState<"grid" | "list">("grid");
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  const fetchWatchlistPrices = useCallback(async () => {
    try {
      const watchlistResponse = await fetch("/api/watchlists", { cache: "no-store" });
      let items: WatchlistItem[] = [];
      if (watchlistResponse.ok) {
        const watchlistJson = await watchlistResponse.json();
        const watchlists: WatchlistRecord[] = watchlistJson.data ?? [];
        const selected = watchlists.find((watchlist) => watchlist.isDefault) ?? watchlists[0];
        items = selected?.items ?? [];
      } else {
        const localSymbols: string[] = JSON.parse(localStorage.getItem("bullbrief_watchlist") || "[]");
        items = localSymbols.map((symbol) => ({ symbol, companyName: symbol, exchangeCode: "Local watchlist" }));
      }
      if (items.length === 0) {
        setWatchlistStocks([]);
        return;
      }
      const symbols = items.map((item) => item.symbol);
      const quoteResponse = await fetch(`/api/watchlist-local?symbols=${encodeURIComponent(symbols.join(","))}`, { cache: "no-store" });
      if (!quoteResponse.ok) throw new Error("Quotes unavailable");
      const quoteJson = await quoteResponse.json();
      const quotes = new Map<string, WatchlistStock>((quoteJson.data ?? []).map((quote: WatchlistStock) => [quote.symbol, quote]));
      setWatchlistStocks(items.map((item) => quotes.get(item.symbol) ?? {
        ...item,
        currency: null,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        marketTimestamp: null,
        dataType: "unavailable",
        available: false,
      }));
    } catch {
      setWatchlistStocks([]);
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [briefRes, podcastRes] = await Promise.allSettled([
        fetch("/api/brief"),
        fetch("/api/podcasts/search?q=markets+investing&type=episodes"),
      ]);

      if (briefRes.status === "fulfilled" && briefRes.value.ok) {
        const json = await briefRes.value.json();
        setBriefing(json.data);
        const allArticles: Article[] = json.articles ?? [];
        const yahooFirst = [...allArticles].sort((a, b) => {
          const aYf = a.sourceDomain === "finance.yahoo.com" ? 0 : 1;
          const bYf = b.sourceDomain === "finance.yahoo.com" ? 0 : 1;
          return aYf - bYf;
        });
        setArticles(yahooFirst.slice(0, 4));
      } else {
        throw new Error("Failed to load brief");
      }

      if (podcastRes.status === "fulfilled" && podcastRes.value.ok) {
        const pJson = await podcastRes.value.json();
        setPodcastEpisodes((pJson.data ?? []).slice(0, 3));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load brief");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBrief();
      void fetchWatchlistPrices();
    }, 0);
    const viewTimer = window.setTimeout(() => {
      const storedView = localStorage.getItem("bullbrief_brief_watchlist_view");
      if (storedView === "list" || storedView === "grid") setWatchlistView(storedView);
    }, 0);
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((json) => setUserName(json.user?.name ?? null))
      .catch(() => {});
    const interval = setInterval(fetchWatchlistPrices, 60_000);
    const onVisibility = () => { if (document.visibilityState === "visible") void fetchWatchlistPrices(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(viewTimer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchBrief, fetchWatchlistPrices]);

  const selectWatchlistView = (view: "grid" | "list") => {
    setWatchlistView(view);
    localStorage.setItem("bullbrief_brief_watchlist_view", view);
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const json = await res.json();
      setChatMessages((prev) => [...prev, { role: "ai", text: json.reply ?? "No response." }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "Sorry, I couldn't process that." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const greetingText = userName ? `${greeting} ${userName}. Happy investing!` : `${greeting}. Happy investing!`;
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const marketOpen = now.getHours() >= 9 && now.getHours() < 16;

  if (loading && !briefing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-on-surface-variant text-sm">Generating your brief...</p>
        </div>
      </div>
    );
  }

  if (error && !briefing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center p-8">
          <p className="text-on-surface mb-4">{error}</p>
          <Button onClick={fetchBrief} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-14">
      <PageHead
        title="Daily Brief"
        description="Your personalized daily market briefing with watchlist prices, top stories, and podcasts."
        canonical="https://bullbrief.vercel.app/brief"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-on-surface-variant mb-2">Your daily market brief</p>
          <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.05] text-on-surface">{greetingText}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-on-surface-variant">{dateStr}</p>
            <span className={cn("flex items-center gap-1 text-xs font-mono", marketOpen ? "text-primary" : "text-on-surface-variant")}>
              <span className={cn("w-2 h-2 rounded-full", marketOpen ? "bg-primary" : "bg-on-surface-variant/40")} />
              {marketOpen ? "Markets Open" : "Markets Closed"}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { fetchBrief(); fetchWatchlistPrices(); }} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Bull AI Assistant */}
      <section aria-labelledby="bull-ai-heading" className="rounded-[40px] border border-outline-variant bg-surface-container-low overflow-hidden shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
        <div className="grid lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <div className="p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-outline-variant">
            <div className="flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-[0.16em]"><Sparkles className="w-4 h-4" /> Briefing desk</div>
            <h2 id="bull-ai-heading" className="font-display font-medium text-3xl text-on-surface mt-3">Bull AI Assistant</h2>
            <p className="text-sm text-on-surface-variant mt-2 max-w-md">Turn today’s prices, headlines, and portfolio context into a focused briefing.</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {["What changed in my watchlist?", "What is moving markets today?", "Summarize my top risks"].map((q) => (
                <button key={q} onClick={() => setChatInput(q)} className="px-3 py-1.5 text-xs bg-surface-container-high/70 border border-outline-variant rounded-full text-on-surface-variant hover:text-on-surface hover:border-primary/40 transition-colors">{q}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col min-h-48">
            <div aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
              {chatMessages.length === 0 && <p className="text-sm text-on-surface-variant py-4">Ask about your watchlist, the market pulse, or a story you want explained.</p>}
              {chatMessages.map((msg, i) => <div key={i} className={cn("max-w-[88%] p-3 rounded-xl text-sm", msg.role === "user" ? "bg-primary text-on-primary ml-auto" : "bg-surface-container-high text-on-surface")}>{msg.text}</div>)}
              {chatLoading && <div className="bg-surface-container-high text-on-surface p-3 rounded-xl text-sm max-w-[88%]"><Loader2 className="w-4 h-4 animate-spin" /></div>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="border-t border-outline-variant p-3 flex items-center gap-2">
              <label htmlFor="brief-ai-question" className="sr-only">Ask Bull AI about markets</label>
              <input id="brief-ai-question" type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about your watchlist, markets, or news…" className="flex-1 bg-background border border-outline-variant rounded-full px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-on-surface focus:outline-none" />
              <Button type="submit" size="sm" disabled={!chatInput.trim() || chatLoading} aria-label="Send question"><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        </div>
        <p className="px-5 pb-3 text-[10px] text-on-surface-variant/60">AI analysis is informational only, not financial advice.</p>
      </section>

      <section aria-labelledby="brief-watchlist-heading">
        <div className="flex items-end justify-between gap-4 mb-3">
          <div><p className="text-xs text-on-surface-variant mb-1">Portfolio pulse</p><h2 id="brief-watchlist-heading" className="font-display font-medium text-3xl text-on-surface">Your Watchlist</h2></div>
          <div className="flex items-center rounded-lg border border-outline-variant bg-surface-container-low p-1" aria-label="Watchlist layout">
            <button onClick={() => selectWatchlistView("grid")} aria-label="Grid view" aria-pressed={watchlistView === "grid"} className={cn("p-1.5 rounded-md", watchlistView === "grid" ? "bg-primary text-on-primary" : "text-on-surface-variant")}><Grid2X2 className="w-4 h-4" /></button>
            <button onClick={() => selectWatchlistView("list")} aria-label="List view" aria-pressed={watchlistView === "list"} className={cn("p-1.5 rounded-md", watchlistView === "list" ? "bg-primary text-on-primary" : "text-on-surface-variant")}><List className="w-4 h-4" /></button>
          </div>
        </div>
        {watchlistLoading ? <div className="h-28 rounded-xl border border-outline-variant bg-surface-container-low animate-pulse" /> : watchlistStocks.length > 0 ? (
          <div className={cn(watchlistView === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-3" : "rounded-xl border border-outline-variant divide-y divide-outline-variant overflow-hidden")}>
            {watchlistStocks.map((stock) => {
              const change = stock.change ?? 0;
              const changePercent = stock.changePercent ?? 0;
              const trend = getTrendDirection(change);
              return <a key={stock.symbol} href={`/markets/${stock.symbol}`} className={cn("group bg-surface-container-low hover:bg-surface-container transition-colors", watchlistView === "grid" ? "p-5 rounded-[28px]" : "grid grid-cols-[minmax(0,1fr)_7rem_auto] md:grid-cols-[minmax(0,1.4fr)_10rem_8rem_8rem] items-center gap-3 px-5 py-4")}>
                <div className="min-w-0"><div className="flex items-baseline gap-2"><strong className="font-mono text-sm text-on-surface">{stock.symbol}</strong><span className="text-xs text-on-surface-variant truncate">{stock.companyName}</span></div><p className="text-[10px] text-on-surface-variant mt-1">{stock.exchangeCode}{stock.currency ? ` · ${stock.currency}` : ""}</p></div>
                <MiniChart symbol={stock.symbol} positive={change >= 0} className={watchlistView === "grid" ? "my-3 h-14" : "h-9"} />
                <div className={cn("font-mono", watchlistView === "grid" ? "flex items-end justify-between" : "text-right")}><span className="text-lg font-semibold text-on-surface">{stock.price == null ? "—" : formatPrice(stock.price)}</span><span className={cn("block text-xs", trend === "up" ? "text-primary" : trend === "down" ? "text-error" : "text-on-surface-variant")}>{stock.change == null ? "Data unavailable" : `${formatChange(change)} · ${formatPercent(changePercent)}`}</span></div>
                <div className={cn("text-[10px] text-on-surface-variant items-center gap-1", watchlistView === "grid" ? "flex mt-3 pt-3 border-t border-outline-variant" : "hidden md:flex justify-end")}><Clock3 className="w-3 h-3" />{stock.marketTimestamp ? `${stock.dataType === "delayed" ? "Delayed · " : ""}As of ${formatRelativeTime(stock.marketTimestamp)}` : "Quote unavailable"}</div>
              </a>;
            })}
          </div>
        ) : <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center"><p className="text-sm text-on-surface">Your account watchlist is empty.</p><a href="/watchlist" className="inline-block mt-2 text-sm text-primary">Add stocks to personalize this brief</a></div>}
      </section>

      {/* Index Cards */}
      {briefing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {briefing.indexPerformance.map((idx) => {
            const trend = getTrendDirection(idx.change);
            return (
              <a
                key={idx.symbol}
                href={`/markets/${idx.symbol}`}
                className="p-5 rounded-[28px] bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <p className="text-xs text-on-surface-variant truncate">{idx.name}</p>
                <p className="font-body text-lg font-bold text-on-surface mt-0.5">
                  {idx.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn("text-xs font-body", trend === "up" ? "text-primary" : trend === "down" ? "text-error" : "text-on-surface-variant")}>
                    {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(2)}
                  </span>
                  <span className={cn("text-[10px] font-mono px-1 py-0.5 rounded", idx.changePercent >= 0 ? "bg-primary/10 text-primary" : "bg-error/10 text-error")}>
                    {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Stories + Podcasts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Stories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" /> Top Stories
            </h2>
            <a href="/news" className="text-primary text-sm hover:text-primary-fixed transition-colors">View all</a>
          </div>
          <div className="space-y-3">
            {articles.length === 0 && !loading && (
              <p className="text-on-surface-variant text-sm p-4">No articles available.</p>
            )}
            {articles.map((article) => (
              <a
                key={article.providerId}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 p-5 rounded-[28px] bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <div className="h-20 w-24 flex-none overflow-hidden rounded-2xl bg-surface-container-high">
                  <NewsThumbnail src={article.imageUrl} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-on-surface-variant font-mono">{article.sourceName}</span>
                    <span className="text-xs text-on-surface-variant/40">·</span>
                    <span className="text-xs text-on-surface-variant font-mono">{formatRelativeTime(article.publishedAt)}</span>
                    {article.sentimentLabel && <SentimentBadge sentiment={article.sentimentLabel} />}
                  </div>
                  <h3 className="font-medium text-on-surface text-sm line-clamp-2">{article.title}</h3>
                  {article.description && <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{stripHtml(article.description)}</p>}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Right: Podcasts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
              <Podcast className="w-5 h-5 text-primary" /> Latest Podcasts
            </h2>
            <a href="/podcasts" className="text-primary text-sm hover:text-primary-fixed transition-colors">View all</a>
          </div>

          {activeEpisode && podcastEpisodes.find((e) => e.id === activeEpisode) && (
            <div className="mb-4">
              <AudioPlayer
                audioUrl={podcastEpisodes.find((e) => e.id === activeEpisode)?.audioUrl ?? null}
                title={`${podcastEpisodes.find((e) => e.id === activeEpisode)?.podcastTitle} — ${podcastEpisodes.find((e) => e.id === activeEpisode)?.title}`}
                duration={podcastEpisodes.find((e) => e.id === activeEpisode)?.durationSeconds ?? null}
              />
            </div>
          )}

          <div className="space-y-3">
            {podcastEpisodes.length === 0 && !loading && (
              <p className="text-on-surface-variant text-sm p-4">No podcasts available.</p>
            )}
            {podcastEpisodes.map((episode) => (
              <div
                key={episode.id}
                onClick={() => setActiveEpisode(episode.id)}
                className={cn(
                  "p-4 rounded-xl bg-surface-container-low border transition-all cursor-pointer",
                  activeEpisode === episode.id
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-outline-variant hover:border-primary/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {episode.artworkUrl ? (
                      <img src={episode.artworkUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Podcast className="w-4 h-4 text-on-surface-variant" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-on-surface-variant font-mono truncate">{episode.podcastTitle}</p>
                    <h3 className="font-medium text-on-surface text-sm line-clamp-1">{episode.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {episode.publishedAt && (
                        <span className="text-[10px] text-on-surface-variant font-mono">{formatRelativeTime(episode.publishedAt)}</span>
                      )}
                      {episode.durationSeconds && (
                        <span className="text-[10px] text-on-surface-variant font-mono">{formatDuration(episode.durationSeconds)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
