"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Bookmark, ExternalLink, Newspaper, Podcast, Trash2 } from "lucide-react";

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<"articles" | "episodes">("articles");

  const savedArticles = [
    { id: "sa1", title: "Nvidia Surges on Record Data Center Revenue Beat", url: "#", sourceName: "Reuters", savedAt: new Date(Date.now() - 7200000).toISOString() },
    { id: "sa2", title: "Fed Minutes Signal Potential Rate Cut in September", url: "#", sourceName: "Bloomberg", savedAt: new Date(Date.now() - 86400000).toISOString() },
  ];

  const savedEpisodes = [
    { id: "se1", podcastTitle: "Market Daily", episodeTitle: "Markets Rally on Tech Earnings Beat", audioUrl: null, savedAt: new Date(Date.now() - 3600000).toISOString(), durationSeconds: 1260 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-on-surface italic">
        Saved
      </h1>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("articles")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2",
            activeTab === "articles"
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
          )}
        >
          <Newspaper className="w-4 h-4" />
          Articles ({savedArticles.length})
        </button>
        <button
          onClick={() => setActiveTab("episodes")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2",
            activeTab === "episodes"
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
          )}
        >
          <Podcast className="w-4 h-4" />
          Episodes ({savedEpisodes.length})
        </button>
      </div>

      {activeTab === "articles" && (
        <div className="space-y-3">
          {savedArticles.map((article) => (
            <div
              key={article.id}
              className="group flex items-start gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all"
            >
              <Newspaper className="w-5 h-5 text-on-surface-variant mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-on-surface-variant font-mono">
                  {article.sourceName} · {formatRelativeTime(article.savedAt)}
                </span>
                <h3 className="font-medium text-on-surface mt-0.5">{article.title}</h3>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button className="p-2 text-on-surface-variant/30 hover:text-error opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {savedArticles.length === 0 && (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant">No saved articles yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "episodes" && (
        <div className="space-y-3">
          {savedEpisodes.map((episode) => (
            <div
              key={episode.id}
              className="p-4 rounded-xl bg-surface-container-low border border-outline-variant"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0">
                  <Podcast className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface-variant font-mono">
                    {episode.podcastTitle}
                  </p>
                  <h3 className="font-medium text-on-surface">{episode.episodeTitle}</h3>
                  <span className="text-xs text-on-surface-variant font-mono">
                    {Math.round((episode.durationSeconds ?? 0) / 60)} min · Saved {formatRelativeTime(episode.savedAt)}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <AudioPlayer
                  audioUrl={episode.audioUrl}
                  title={episode.episodeTitle}
                  duration={episode.durationSeconds}
                />
              </div>
            </div>
          ))}
          {savedEpisodes.length === 0 && (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant">No saved episodes yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
