"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { formatRelativeTime, type Article } from "@/lib/types";
import { Badge, SentimentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bookmark,
  ExternalLink,
  Newspaper,
  Loader2,
  RefreshCw,
} from "lucide-react";

type FilterMode = "all" | "canadian" | "us";

export default function NewsPage() {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchNews = useCallback(
    async (pageNum: number, reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "50");
        params.set("page", String(pageNum));

        if (searchQuery) {
          params.set("q", searchQuery);
        } else {
          switch (filterMode) {
            case "us":
              params.set("countries", "us");
              break;
            case "canadian":
              params.set("countries", "ca");
              break;
            default:
              params.set("countries", "us,ca");
          }
        }

        const res = await fetch(`/api/news?${params}`);
        const json = await res.json();

        if (reset || pageNum === 1) {
          setArticles(json.data ?? []);
        } else {
          setArticles((prev) => [...prev, ...(json.data ?? [])]);
        }
        setTotal(json.total ?? 0);
        setHasMore(json.hasMore ?? false);
      } catch (err) {
        console.error("News fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [filterMode, searchQuery]
  );

  useEffect(() => {
    setPage(1);
    fetchNews(1, true);
  }, [fetchNews]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNews(next);
  };

  const filtered = articles.filter((a) => {
    if (sentimentFilter && a.sentimentLabel !== sentimentFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-bold text-2xl text-on-surface italic">
            News
          </h1>
          {articles.length > 0 && (
            <span className="text-xs text-on-surface-variant font-mono">
              {articles.length} stories
            </span>
          )}
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search headlines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All Markets (US + CA)"],
            ["us", "U.S."],
            ["canadian", "Canadian"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-mono transition-all border",
              filterMode === mode
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
            )}
          >
            {label}
          </button>
        ))}

        <span className="w-px h-4 bg-outline-variant" />

        {["positive", "neutral", "negative"].map((s) => (
          <button
            key={s}
            onClick={() =>
              setSentimentFilter(sentimentFilter === s ? null : s)
            }
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-mono transition-all border",
              sentimentFilter === s
                ? s === "positive"
                  ? "bg-primary/20 text-primary border-primary"
                  : s === "negative"
                    ? "bg-error/20 text-error border-error"
                    : "bg-surface-container-high text-on-surface border-on-surface"
                : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((article) => (
          <div
            key={article.providerId}
            className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all cursor-pointer"
          >
            {article.imageUrl && (
              <div className="sm:w-32 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-surface-container-high">
                <img
                  src={article.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-on-surface-variant font-mono">
                  {article.sourceName}
                </span>
                <span className="text-xs text-on-surface-variant/40">·</span>
                <span className="text-xs text-on-surface-variant font-mono">
                  {formatRelativeTime(article.publishedAt)}
                </span>
                {article.sentimentLabel && (
                  <SentimentBadge sentiment={article.sentimentLabel} />
                )}
              </div>
              <h3 className="font-medium text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>
              {article.description && (
                <p className="text-sm text-on-surface-variant mt-1 line-clamp-3">
                  {article.description}
                </p>
              )}
            </div>
            <div className="flex sm:flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all sm:self-center">
              <button
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                aria-label="Save article"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                aria-label="Open article"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {loading && articles.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
          <span className="text-on-surface-variant text-sm">
            Loading headlines...
          </span>
        </div>
      )}

      {!loading && filtered.length === 0 && articles.length > 0 && (
        <div className="text-center py-12">
          <p className="text-on-surface-variant">
            No stories match your sentiment filter
          </p>
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant">No headlines found</p>
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center pt-4">
          <Button variant="secondary" size="sm" onClick={loadMore}>
            Load more headlines
          </Button>
        </div>
      )}

      {loading && articles.length > 0 && (
        <div className="text-center py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}
