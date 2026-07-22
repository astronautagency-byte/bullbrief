"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { formatRelativeTime, type Episode, type Podcast } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/ui/audio-player";
import {
  Search,
  Podcast as PodcastIcon,
  Heart,
  ExternalLink,
  Loader2,
  Play,
  ArrowLeft,
} from "lucide-react";

interface FavouritePodcast {
  id: string;
  title: string;
  description: string | null;
  artworkUrl: string | null;
  categories: string[];
  addedAt: string;
}

export default function PodcastsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"episodes" | "podcasts">("episodes");
  const [searchResults, setSearchResults] = useState<(Episode | Podcast)[]>([]);
  const [loading, setLoading] = useState(false);

  const [favourites, setFavourites] = useState<FavouritePodcast[]>([]);
  const [favouriteEpisodes, setFavouriteEpisodes] = useState<Episode[]>([]);
  const [selectedFavourite, setSelectedFavourite] = useState<FavouritePodcast | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/podcast-favourites")
      .then((r) => r.json())
      .then((json) => {
        const list: FavouritePodcast[] = json.data ?? [];
        setFavourites(list);
        setFavouriteIds(new Set(list.map((f) => f.id)));
      })
      .catch(() => {});
  }, []);

  const doSearch = useCallback(
    async (q: string, type: "episodes" | "podcasts") => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/podcasts/search?q=${encodeURIComponent(q)}&type=${type}`
        );
        const json = await res.json();
        setSearchResults(json.data ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setSelectedFavourite(null);
        doSearch(searchQuery, searchType);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType, doSearch]);

  const toggleFavourite = async (podcast: Podcast) => {
    const isFav = favouriteIds.has(podcast.id);
    if (isFav) {
      await fetch(`/api/podcast-favourites/${podcast.id}`, { method: "DELETE" });
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        next.delete(podcast.id);
        return next;
      });
      setFavourites((prev) => prev.filter((f) => f.id !== podcast.id));
      if (selectedFavourite?.id === podcast.id) setSelectedFavourite(null);
    } else {
      await fetch("/api/podcast-favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: podcast.id,
          title: podcast.title,
          description: podcast.description,
          artworkUrl: podcast.artworkUrl,
          categories: podcast.categories,
        }),
      });
      setFavouriteIds((prev) => new Set(prev).add(podcast.id));
      setFavourites((prev) => [
        {
          id: podcast.id,
          title: podcast.title,
          description: podcast.description,
          artworkUrl: podcast.artworkUrl,
          categories: podcast.categories,
          addedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const openFavouriteEpisodes = async (fav: FavouritePodcast) => {
    setSelectedFavourite(fav);
    setSearchQuery("");
    setSearchResults([]);
    setLoadingEpisodes(true);
    try {
      const res = await fetch(`/api/podcasts/${fav.id}`);
      const json = await res.json();
      setFavouriteEpisodes(json.data?.episodes ?? []);
    } catch {
      setFavouriteEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const quickSearches = [
    "markets",
    "investing",
    "stocks",
    "economy",
    "Canadian markets",
    "personal finance",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-display font-bold text-2xl text-on-surface italic">
          Podcasts
        </h1>
        <div className="flex items-center gap-3 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder={
                searchType === "episodes"
                  ? "Search episodes..."
                  : "Search podcasts..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant animate-spin" />
            )}
          </div>
          <div className="flex bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden">
            <button
              onClick={() => setSearchType("episodes")}
              className={cn(
                "px-3 py-2 text-xs font-mono transition-colors",
                searchType === "episodes"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Episodes
            </button>
            <button
              onClick={() => setSearchType("podcasts")}
              className={cn(
                "px-3 py-2 text-xs font-mono transition-colors",
                searchType === "podcasts"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Podcasts
            </button>
          </div>
        </div>
      </div>

      {activeEpisode && (
        <AudioPlayer
          audioUrl={activeEpisode.audioUrl}
          title={`${activeEpisode.podcastTitle} — ${activeEpisode.title}`}
          duration={activeEpisode.durationSeconds}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {selectedFavourite && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedFavourite(null);
                  setFavouriteEpisodes([]);
                }}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to favourites
              </button>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                <div className="w-16 h-16 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {selectedFavourite.artworkUrl ? (
                    <img
                      src={selectedFavourite.artworkUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PodcastIcon className="w-6 h-6 text-on-surface-variant" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-lg text-on-surface">
                    {selectedFavourite.title}
                  </h2>
                  {selectedFavourite.description && (
                    <p className="text-sm text-on-surface-variant line-clamp-2 mt-0.5">
                      {selectedFavourite.description}
                    </p>
                  )}
                  {selectedFavourite.categories.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {selectedFavourite.categories.map((cat) => (
                        <Badge key={cat}>{cat}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const podcast: Podcast = {
                      id: selectedFavourite.id,
                      title: selectedFavourite.title,
                      author: null,
                      description: selectedFavourite.description,
                      artworkUrl: selectedFavourite.artworkUrl,
                      websiteUrl: null,
                      feedUrl: null,
                      categories: selectedFavourite.categories,
                    };
                    toggleFavourite(podcast);
                  }}
                  className="p-2 text-error hover:text-error/80 transition-colors"
                  aria-label="Remove from favourites"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>

              <h3 className="font-display font-bold text-on-surface">Episodes</h3>

              {loadingEpisodes && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
                  <span className="text-on-surface-variant text-sm">
                    Loading episodes...
                  </span>
                </div>
              )}

              {!loadingEpisodes && favouriteEpisodes.length === 0 && (
                <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant text-center">
                  <p className="text-on-surface-variant text-sm">
                    No episodes found for this podcast
                  </p>
                </div>
              )}

              {favouriteEpisodes.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  isActive={activeEpisode?.id === episode.id}
                  onPlay={() => setActiveEpisode(episode)}
                />
              ))}
            </div>
          )}

          {!selectedFavourite && !searchQuery && (
            <div className="space-y-4">
              {favourites.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-display font-bold text-lg text-on-surface">
                    Your Favourites
                  </h2>
                  {favourites.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => openFavouriteEpisodes(fav)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {fav.artworkUrl ? (
                          <img
                            src={fav.artworkUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PodcastIcon className="w-5 h-5 text-on-surface-variant" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-on-surface line-clamp-1">
                          {fav.title}
                        </h3>
                        {fav.description && (
                          <p className="text-sm text-on-surface-variant line-clamp-1">
                            {fav.description}
                          </p>
                        )}
                        {fav.categories.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {fav.categories.slice(0, 3).map((cat) => (
                              <Badge key={cat}>{cat}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary font-mono">
                          {favouriteIds.has(fav.id) ? "View episodes" : ""}
                        </span>
                        <Heart className="w-4 h-4 text-error fill-error" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {favourites.length === 0 && (
                <div className="p-12 rounded-xl bg-surface-container-low border border-outline-variant text-center">
                  <Heart className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                  <p className="text-on-surface-variant text-sm">
                    Search for finance podcasts below and tap the heart to add
                    them here
                  </p>
                </div>
              )}
            </div>
          )}

          {!selectedFavourite && searchQuery && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-lg text-on-surface">
                {searchType === "episodes" ? "Episodes" : "Podcasts"} for &ldquo;
                {searchQuery}&rdquo;
              </h2>

              {searchType === "podcasts" &&
                (searchResults as Podcast[]).map((podcast) => (
                  <div
                    key={podcast.id}
                    className="p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {podcast.artworkUrl ? (
                          <img
                            src={podcast.artworkUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PodcastIcon className="w-6 h-6 text-on-surface-variant" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-on-surface line-clamp-1">
                          {podcast.title}
                        </h3>
                        {podcast.description && (
                          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                            {podcast.description}
                          </p>
                        )}
                        {podcast.categories.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            {podcast.categories.map((cat) => (
                              <Badge key={cat}>{cat}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFavourite(podcast)}
                          className={cn(
                            "p-2 transition-colors",
                            favouriteIds.has(podcast.id)
                              ? "text-error"
                              : "text-on-surface-variant hover:text-error"
                          )}
                          aria-label={
                            favouriteIds.has(podcast.id)
                              ? "Remove from favourites"
                              : "Add to favourites"
                          }
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4",
                              favouriteIds.has(podcast.id) && "fill-current"
                            )}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFavourite({
                              id: podcast.id,
                              title: podcast.title,
                              description: podcast.description,
                              artworkUrl: podcast.artworkUrl,
                              categories: podcast.categories,
                              addedAt: new Date().toISOString(),
                            });
                            setSearchQuery("");
                          }}
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                          aria-label="View episodes"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {searchType === "episodes" &&
                (searchResults as Episode[]).map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    isActive={activeEpisode?.id === episode.id}
                    onPlay={() => setActiveEpisode(episode)}
                  />
                ))}

              {searchResults.length === 0 && !loading && (
                <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant text-center">
                  <p className="text-on-surface-variant text-sm">
                    No {searchType} found
                  </p>
                </div>
              )}
            </div>
          )}

          {!selectedFavourite && !searchQuery && favourites.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-lg text-on-surface">
                Discover
              </h2>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
                  <span className="text-on-surface-variant text-sm">
                    Searching...
                  </span>
                </div>
              )}
              {searchResults.length > 0 &&
                !loading &&
                searchType === "podcasts" &&
                (searchResults as Podcast[]).map((podcast) => (
                  <div
                    key={podcast.id}
                    className="p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {podcast.artworkUrl ? (
                          <img
                            src={podcast.artworkUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PodcastIcon className="w-6 h-6 text-on-surface-variant" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-on-surface line-clamp-1">
                          {podcast.title}
                        </h3>
                        {podcast.description && (
                          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                            {podcast.description}
                          </p>
                        )}
                        {podcast.categories.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            {podcast.categories.map((cat) => (
                              <Badge key={cat}>{cat}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFavourite(podcast)}
                          className={cn(
                            "p-2 transition-colors",
                            favouriteIds.has(podcast.id)
                              ? "text-error"
                              : "text-on-surface-variant hover:text-error"
                          )}
                          aria-label={
                            favouriteIds.has(podcast.id)
                              ? "Remove from favourites"
                              : "Add to favourites"
                          }
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4",
                              favouriteIds.has(podcast.id) && "fill-current"
                            )}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFavourite({
                              id: podcast.id,
                              title: podcast.title,
                              description: podcast.description,
                              artworkUrl: podcast.artworkUrl,
                              categories: podcast.categories,
                              addedAt: new Date().toISOString(),
                            });
                            setSearchQuery("");
                          }}
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                          aria-label="View episodes"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              {searchResults.length > 0 &&
                !loading &&
                searchType === "episodes" &&
                (searchResults as Episode[]).map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    isActive={activeEpisode?.id === episode.id}
                    onPlay={() => setActiveEpisode(episode)}
                  />
                ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Searches</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {quickSearches.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setSearchQuery(topic);
                    setSearchType("episodes");
                    setSelectedFavourite(null);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-surface-container-high transition-colors text-sm text-on-surface-variant"
                >
                  {topic}
                </button>
              ))}
            </div>
          </Card>

          {favourites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Favourite Podcasts</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {favourites.slice(0, 5).map((fav) => (
                  <button
                    key={fav.id}
                    onClick={() => openFavouriteEpisodes(fav)}
                    className="w-full text-left p-2 rounded-lg hover:bg-surface-container-high transition-colors text-sm text-on-surface-variant flex items-center gap-2"
                  >
                    <Heart className="w-3 h-3 text-error fill-error flex-shrink-0" />
                    <span className="truncate">{fav.title}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function EpisodeCard({
  episode,
  isActive,
  onPlay,
}: {
  episode: Episode;
  isActive: boolean;
  onPlay: () => void;
}) {
  return (
    <div
      onClick={onPlay}
      className={cn(
        "p-4 rounded-xl border transition-all cursor-pointer",
        isActive
          ? "bg-primary/10 border-primary/40"
          : "bg-surface-container-low border-outline-variant hover:border-primary/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0 overflow-hidden">
          {episode.artworkUrl ? (
            <img
              src={episode.artworkUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <PodcastIcon className="w-5 h-5 text-on-surface-variant" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-on-surface-variant font-mono mb-0.5">
            {episode.podcastTitle}
          </p>
          <h3 className="font-medium text-on-surface line-clamp-1">
            {episode.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {episode.publishedAt && (
              <span className="text-xs text-on-surface-variant font-mono">
                {formatRelativeTime(episode.publishedAt)}
              </span>
            )}
            {episode.durationSeconds && (
              <>
                <span className="text-xs text-on-surface-variant/40">&middot;</span>
                <span className="text-xs text-on-surface-variant font-mono">
                  {Math.round(episode.durationSeconds / 60)} min
                </span>
              </>
            )}
          </div>
          {episode.description && (
            <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
              {episode.description}
            </p>
          )}
          {episode.categories.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {episode.categories.slice(0, 3).map((cat) => (
                <Badge key={cat}>{cat}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 self-center">
          {isActive && (
            <span className="text-xs text-primary font-mono mr-1">Playing</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className={cn(
              "p-2 rounded-full transition-colors",
              isActive
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-primary hover:bg-primary/10"
            )}
            aria-label="Play episode"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
