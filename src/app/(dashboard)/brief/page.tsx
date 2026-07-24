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
import { Badge, SentimentBadge } from "@/components/ui/badge";
import {
  RefreshCw,
  ExternalLink,
  Newspaper,
  Loader2,
  Send,
  Podcast,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/page-head";
import { useNotifications } from "@/components/notification-provider";

interface WatchlistStock {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
}

const STOCK_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.", MSFT: "Microsoft Corp.", GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.", NVDA: "NVIDIA Corp.", META: "Meta Platforms",
  TSLA: "Tesla Inc.", NFLX: "Netflix Inc.", AMD: "Advanced Micro Devices",
  JPM: "JPMorgan Chase", V: "Visa Inc.", JNJ: "Johnson & Johnson",
  WMT: "Walmart Inc.", UNH: "UnitedHealth Group", XOM: "Exxon Mobil",
  "BRK.B": "Berkshire Hathaway", PG: "Procter & Gamble", MA: "Mastercard Inc.",
  HD: "Home Depot", DIS: "Walt Disney Co.", BAC: "Bank of America",
  PFE: "Pfizer Inc.", CRM: "Salesforce Inc.", COST: "Costco Wholesale",
  COIN: "Coinbase Global", PLTR: "Palantir Technologies", UBER: "Uber Technologies",
  ABNB: "Airbnb Inc.", SHOP: "Shopify Inc.", BABA: "Alibaba Group", SQ: "Block Inc.",
};

export default function BriefPage() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [podcastEpisodes, setPodcastEpisodes] = useState<Episode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<string | null>(null);

  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  const fetchWatchlistPrices = useCallback(async () => {
    try {
      const stored = localStorage.getItem("bullbrief_watchlist");
      const symbols: string[] = stored ? JSON.parse(stored) : [];
      if (symbols.length === 0) { setWatchlistStocks([]); return; }

      const res = await fetch(`/api/watchlist-local?symbols=${encodeURIComponent(symbols.join(","))}`);
      const json = await res.json();
      const priceData: Record<string, { price: number; change: number; changePercent: number }> = {};
      for (const s of json.data ?? []) {
        priceData[s.symbol] = { price: s.price, change: s.change, changePercent: s.changePercent };
      }

      setWatchlistStocks(
        symbols.slice(0, 6).map((sym) => ({
          symbol: sym,
          companyName: STOCK_NAMES[sym] ?? sym,
          price: priceData[sym]?.price ?? 0,
          change: priceData[sym]?.change ?? 0,
          changePercent: priceData[sym]?.changePercent ?? 0,
        }))
      );
    } catch {}
  }, []);

  const refreshWatchlistPrices = useCallback(async () => {
    try {
      const stored = localStorage.getItem("bullbrief_watchlist");
      const symbols: string[] = stored ? JSON.parse(stored) : [];
      if (symbols.length === 0) return;

      const res = await fetch(`/api/watchlist-local?symbols=${encodeURIComponent(symbols.join(","))}`);
      const json = await res.json();
      const priceData: Record<string, { price: number; change: number; changePercent: number }> = {};
      for (const s of json.data ?? []) {
        priceData[s.symbol] = { price: s.price, change: s.change, changePercent: s.changePercent };
      }

      setWatchlistStocks((prev) =>
        prev.map((item) => {
          const p = priceData[item.symbol];
          if (!p) return item;
          return { ...item, price: p.price, change: p.change, changePercent: p.changePercent };
        })
      );
    } catch {}
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
        setKeyInsights(json.keyInsights ?? []);
        addNotification({
          type: "briefing_ready",
          title: "Daily Brief Ready",
          message: "Your market briefing has been generated with the latest data.",
          href: "/brief",
        });
      } else {
        throw new Error("Failed to load brief");
      }

      if (podcastRes.status === "fulfilled" && podcastRes.value.ok) {
        const pJson = await podcastRes.value.json();
        setPodcastEpisodes((pJson.data ?? []).slice(0, 3));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load brief");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
    fetchWatchlistPrices();
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((json) => setUserName(json.user?.name ?? null))
      .catch(() => {});
    const interval = setInterval(refreshWatchlistPrices, 3000);
    return () => clearInterval(interval);
  }, [fetchBrief, fetchWatchlistPrices, refreshWatchlistPrices]);

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
    <div className="space-y-6">
      <PageHead
        title="Daily Brief"
        description="Your personalized daily market briefing with watchlist prices, top stories, and podcasts."
        canonical="https://bullbrief.vercel.app/brief"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-on-surface italic">{greetingText}</h1>
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

      {/* Watchlist Stocks */}
      {watchlistStocks.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-sm text-on-surface-variant mb-2 uppercase tracking-wider">Your Watchlist</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {watchlistStocks.map((stock) => {
              const trend = getTrendDirection(stock.change);
              return (
                <a
                  key={stock.symbol}
                  href={`/markets/${stock.symbol}`}
                  className="p-3 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all"
                >
                  <p className="text-xs text-on-surface-variant truncate">{stock.companyName}</p>
                  <p className="font-body text-lg font-bold text-on-surface mt-0.5">{formatPrice(stock.price)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("text-xs font-body", trend === "up" ? "text-primary" : trend === "down" ? "text-error" : "text-on-surface-variant")}>
                      {formatChange(stock.change)}
                    </span>
                    <span className={cn("text-[10px] font-mono px-1 py-0.5 rounded", stock.changePercent >= 0 ? "bg-primary/10 text-primary" : "bg-error/10 text-error")}>
                      {formatPercent(stock.changePercent)}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Index Cards */}
      {briefing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {briefing.indexPerformance.map((idx) => {
            const trend = getTrendDirection(idx.change);
            return (
              <a
                key={idx.symbol}
                href={`/markets/${idx.symbol}`}
                className="p-3 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all"
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
                className="block p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-on-surface-variant font-mono">{article.sourceName}</span>
                  <span className="text-xs text-on-surface-variant/40">·</span>
                  <span className="text-xs text-on-surface-variant font-mono">{formatRelativeTime(article.publishedAt)}</span>
                  {article.sentimentLabel && <SentimentBadge sentiment={article.sentimentLabel} />}
                </div>
                <h3 className="font-medium text-on-surface text-sm line-clamp-2">{article.title}</h3>
                {article.description && (
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{stripHtml(article.description)}</p>
                )}
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

      {/* AI Assistant */}
      <div>
        <h2 className="font-display font-bold text-lg text-on-surface mb-3">AI Assistant</h2>
        <Card className="flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-64">
            {chatMessages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-on-surface-variant text-sm">Ask me anything about the markets</p>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {["What's moving today?", "How is the S&P 500 doing?", "Summarize today's news"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setChatInput(q)}
                      className="px-3 py-1.5 text-xs bg-surface-container-high border border-outline-variant rounded-full text-on-surface-variant hover:border-primary/30 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] p-3 rounded-xl text-sm",
                  msg.role === "user" ? "bg-primary text-on-primary ml-auto" : "bg-surface-container-high text-on-surface"
                )}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-surface-container-high text-on-surface p-3 rounded-xl text-sm max-w-[85%]">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
          <div className="border-t border-outline-variant p-3">
            <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about markets, stocks, news..."
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <Button type="submit" size="sm" disabled={!chatInput.trim() || chatLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-[10px] text-on-surface-variant/50 mt-1.5 text-center">AI analysis is informational only, not financial advice</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
