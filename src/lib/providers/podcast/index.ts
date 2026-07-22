import type { Podcast, Episode } from "@/lib/types";

export interface PodcastProvider {
  searchPodcasts(query: string): Promise<Podcast[]>;
  searchEpisodes(query: string): Promise<Episode[]>;
  getPodcast(id: string): Promise<Podcast>;
  getRecentEpisodes(podcastId: string): Promise<Episode[]>;
  getEpisode(id: string): Promise<Episode>;
}

export class MockPodcastProvider implements PodcastProvider {
  private podcasts: Podcast[] = [
    {
      id: "mock-podcast-1",
      title: "Market Daily",
      author: "BullBrief",
      description: "Daily market analysis and insights for the modern investor.",
      artworkUrl: null,
      websiteUrl: null,
      feedUrl: null,
      categories: ["Finance", "Daily News"],
    },
    {
      id: "mock-podcast-2",
      title: "Tech Stock Talk",
      author: "InvestTech Media",
      description: "Deep dives into technology companies and their market impact.",
      artworkUrl: null,
      websiteUrl: null,
      feedUrl: null,
      categories: ["Technology", "Investing"],
    },
    {
      id: "mock-podcast-3",
      title: "Canadian Market Watch",
      author: "Bay Street Media",
      description: "Coverage of TSX, Canadian economy, and resource sector.",
      artworkUrl: null,
      websiteUrl: null,
      feedUrl: null,
      categories: ["Canadian Markets", "Finance"],
    },
  ];

  private episodes: Episode[] = [
    {
      id: "mock-ep-1",
      podcastId: "mock-podcast-1",
      podcastTitle: "Market Daily",
      title: "Markets Rally on Tech Earnings Beat",
      description:
        "S&P 500 hits new highs as major tech companies report better-than-expected quarterly results. Nvidia leads the charge with record data center revenue.",
      artworkUrl: null,
      audioUrl: null,
      externalUrl: null,
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      durationSeconds: 1260,
      categories: ["Markets", "Earnings"],
    },
    {
      id: "mock-ep-2",
      podcastId: "mock-podcast-1",
      podcastTitle: "Market Daily",
      title: "Fed Signals Rate Cut Timeline",
      description:
        "Federal Reserve officials hint at potential rate reductions in the coming months. Bond yields fall sharply following the remarks.",
      artworkUrl: null,
      audioUrl: null,
      externalUrl: null,
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      durationSeconds: 980,
      categories: ["Economy", "Interest Rates"],
    },
    {
      id: "mock-ep-3",
      podcastId: "mock-podcast-2",
      podcastTitle: "Tech Stock Talk",
      title: "NVIDIA: AI Demand Beyond Expectations",
      description:
        "A comprehensive look at NVIDIA's latest earnings, the AI chip shortage, and what it means for the broader semiconductor sector.",
      artworkUrl: null,
      audioUrl: null,
      externalUrl: null,
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      durationSeconds: 2100,
      categories: ["Technology", "Earnings", "AI"],
    },
    {
      id: "mock-ep-4",
      podcastId: "mock-podcast-3",
      podcastTitle: "Canadian Market Watch",
      title: "TSX Hits Record High on Resource Rally",
      description:
        "Canadian markets surge as oil and gold prices climb. Bank stocks also advance on strong quarterly results from RBC and TD.",
      artworkUrl: null,
      audioUrl: null,
      externalUrl: null,
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      durationSeconds: 1500,
      categories: ["Canadian Markets", "Resources"],
    },
  ];

  async searchPodcasts(query: string): Promise<Podcast[]> {
    const q = query.toLowerCase();
    return this.podcasts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.categories.some((c) => c.toLowerCase().includes(q))
    );
  }

  async searchEpisodes(query: string): Promise<Episode[]> {
    const q = query.toLowerCase();
    return this.episodes.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.categories.some((c) => c.toLowerCase().includes(q))
    );
  }

  async getPodcast(id: string): Promise<Podcast> {
    const podcast = this.podcasts.find((p) => p.id === id);
    if (!podcast) throw new Error(`Podcast not found: ${id}`);
    return podcast;
  }

  async getRecentEpisodes(podcastId: string): Promise<Episode[]> {
    return this.episodes
      .filter((e) => e.podcastId === podcastId)
      .sort(
        (a, b) =>
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime()
      );
  }

  async getEpisode(id: string): Promise<Episode> {
    const episode = this.episodes.find((e) => e.id === id);
    if (!episode) throw new Error(`Episode not found: ${id}`);
    return episode;
  }
}
