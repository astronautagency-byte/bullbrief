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
  type Article,
  type Episode,
  type BriefingData,
} from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { IndexCard } from "@/components/ui/price-display";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Badge, SentimentBadge } from "@/components/ui/badge";
import {
  RefreshCw,
  Bookmark,
  ExternalLink,
  Newspaper,
  Sparkles,
  AlertCircle,
  Loader2,
  Send,
  Podcast,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BriefPage() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [podcastEpisodes, setPodcastEpisodes] = useState<Episode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<string | null>(null);

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
        setArticles(json.articles ?? []);
        setKeyInsights(json.keyInsights ?? []);
        setAiConfidence(json.data.sentimentScore);
      } else {
        throw new Error("Failed to load brief");
      }

      if (podcastRes.status === "fulfilled" && podcastRes.value.ok) {
        const pJson = await podcastRes.value.json();
        setPodcastEpisodes(pJson.data ?? []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load brief");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

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
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: json.reply ?? "No response." },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I couldn't process that." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const marketOpen = now.getHours() >= 9 && now.getHours() < 16;

  if (loading && !briefing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-on-surface-variant text-sm">
            Generating your brief...
          </p>
        </div>
      </div>
    );
  }

  if (error && !briefing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center p-8">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <p className="text-on-surface mb-4">{error}</p>
          <Button onClick={fetchBrief} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-on-surface italic">
            {greeting}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-on-surface-variant">{dateStr}</p>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-mono",
                marketOpen ? "text-primary" : "text-on-surface-variant"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  marketOpen ? "bg-primary" : "bg-on-surface-variant/40"
                )}
              />
              {marketOpen ? "Markets Open" : "Markets Closed"}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchBrief}
          disabled={loading}
        >
          <RefreshCw
            className={cn("w-4 h-4", loading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {briefing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {briefing.indexPerformance.map((idx) => (
            <IndexCard
              key={idx.symbol}
              symbol={idx.symbol}
              name={idx.name}
              value={idx.value}
              change={idx.change}
              changePercent={idx.changePercent}
              sparklineData={[]}
              dataType="end_of_day"
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Powered Brief
          </CardTitle>
          {aiConfidence !== null && (
            <span className="text-xs text-on-surface-variant font-mono flex items-center gap-1">
              Confidence: {Math.round(aiConfidence * 100)}%
            </span>
          )}
        </CardHeader>
        <p className="text-on-surface leading-relaxed">
          {briefing?.marketSummary || "Loading market summary..."}
        </p>
        {keyInsights.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-on-surface-variant font-mono uppercase tracking-wider">
              Key Insights
            </p>
            <ul className="space-y-1.5">
              {keyInsights.map((insight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-on-surface"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {briefing && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-on-surface">
              Watchlist
            </h2>
            <a
              href="/watchlist"
              className="text-primary text-sm hover:text-primary-fixed transition-colors"
            >
              View all
            </a>
          </div>
          {briefing.watchlistMovers.topGainer ||
          briefing.watchlistMovers.topDecliner ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {briefing.watchlistMovers.topGainer && (
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="text-xs text-on-surface-variant font-mono">
                    Top Gainer
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-primary text-lg">
                      {briefing.watchlistMovers.topGainer.symbol}
                    </span>
                    <span className="text-primary font-mono text-sm">
                      +{briefing.watchlistMovers.topGainer.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
              {briefing.watchlistMovers.topDecliner && (
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="text-xs text-on-surface-variant font-mono">
                    Top Decliner
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-error text-lg">
                      {briefing.watchlistMovers.topDecliner.symbol}
                    </span>
                    <span className="text-error font-mono text-sm">
                      {briefing.watchlistMovers.topDecliner.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm">
              Add stocks to your watchlist to see movers.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              Top Stories
            </h2>
            <a
              href="/news"
              className="text-primary text-sm hover:text-primary-fixed transition-colors"
            >
              View all
            </a>
          </div>
          <div className="space-y-3">
            {articles.length === 0 && !loading && (
              <p className="text-on-surface-variant text-sm p-4">
                No articles available.
              </p>
            )}
            {articles.map((article) => (
              <div
                key={article.providerId}
                className="group flex flex-col gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-on-surface-variant font-mono">
                        {article.sourceName}
                      </span>
                      <span className="text-xs text-on-surface-variant/40">
                        ·
                      </span>
                      <span className="text-xs text-on-surface-variant font-mono">
                        {formatRelativeTime(article.publishedAt)}
                      </span>
                      {article.sentimentLabel && (
                        <SentimentBadge sentiment={article.sentimentLabel} />
                      )}
                    </div>
                    <h3 className="font-medium text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-sm text-on-surface-variant mt-1 line-clamp-3">
                        {article.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      className="p-1.5 text-on-surface-variant hover:text-primary transition-colors"
                      aria-label="Save article"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-on-surface-variant hover:text-primary transition-colors"
                      aria-label="Open article"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Assistant
            </h2>
          </div>
          <Card className="flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-80">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
                  <p className="text-on-surface-variant text-sm">
                    Ask me anything about the markets
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {[
                      "What's moving today?",
                      "How is the S&P 500 doing?",
                      "Summarize today's news",
                    ].map((q) => (
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
                    msg.role === "user"
                      ? "bg-primary text-on-primary ml-auto"
                      : "bg-surface-container-high text-on-surface"
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChat();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about markets, stocks, news..."
                  className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!chatInput.trim() || chatLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <p className="text-[10px] text-on-surface-variant/50 mt-1.5 text-center">
                AI analysis is informational only, not financial advice
              </p>
            </div>
          </Card>
        </div>
      </div>

      {podcastEpisodes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
              <Podcast className="w-5 h-5 text-primary" />
              Market Podcasts
            </h2>
            <a
              href="/podcasts"
              className="text-primary text-sm hover:text-primary-fixed transition-colors"
            >
              View all
            </a>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {podcastEpisodes.slice(0, 4).map((episode) => (
              <div
                key={episode.id}
                className={cn(
                  "p-4 rounded-xl bg-surface-container-low border transition-all cursor-pointer",
                  activeEpisode === episode.id
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-outline-variant hover:border-primary/30"
                )}
                onClick={() => setActiveEpisode(episode.id)}
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
                    <p className="text-[10px] text-on-surface-variant font-mono truncate">
                      {episode.podcastTitle}
                    </p>
                    <h3 className="font-medium text-on-surface text-sm line-clamp-1">
                      {episode.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {episode.publishedAt && (
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {formatRelativeTime(episode.publishedAt)}
                        </span>
                      )}
                      {episode.durationSeconds && (
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {formatDuration(episode.durationSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
