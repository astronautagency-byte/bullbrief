import type { Podcast, Episode } from "@/lib/types";
import type { PodcastProvider } from "./index";

const BASE_URL = "https://api.taddy.org";
const API_KEY = process.env.PODCAST_API_KEY;
const USER_ID = process.env.PODCAST_API_USER_ID;

function getConfig() {
  if (!API_KEY) throw new Error("PODCAST_API_KEY is not configured");
  if (!USER_ID) throw new Error("PODCAST_API_USER_ID is not configured");
  return { apiKey: API_KEY, userId: USER_ID };
}

async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const { apiKey, userId } = getConfig();
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "X-USER-ID": userId,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Taddy API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Taddy GraphQL error: ${json.errors[0].message}`);
  }
  return json.data as T;
}

interface TaddyPodcastSeries {
  uuid: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  rssUrl: string | null;
  itunesId: number | null;
  totalEpisodesCount: number | null;
  popularityRank: number | null;
  genres: string[] | null;
}

interface TaddyEpisode {
  uuid: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  datePublished: number | null;
  duration: number | null;
  podcastSeries: { uuid: string; name: string } | null;
}

function mapPodcast(s: TaddyPodcastSeries): Podcast {
  return {
    id: s.uuid,
    title: s.name,
    author: null,
    description: s.description,
    artworkUrl: s.imageUrl,
    websiteUrl: s.rssUrl,
    feedUrl: s.rssUrl,
    categories: s.genres ?? [],
  };
}

function mapEpisode(e: TaddyEpisode, podcastTitle?: string): Episode {
  return {
    id: e.uuid,
    podcastId: e.podcastSeries?.uuid ?? "",
    podcastTitle: podcastTitle ?? e.podcastSeries?.name ?? "",
    title: e.name,
    description: e.description,
    artworkUrl: e.imageUrl,
    audioUrl: e.audioUrl,
    externalUrl: null,
    publishedAt: e.datePublished ? new Date(e.datePublished * 1000).toISOString() : null,
    durationSeconds: e.duration ?? null,
    categories: [],
  };
}

export class TaddyPodcastProvider implements PodcastProvider {
  async searchPodcasts(query: string): Promise<Podcast[]> {
    const data = await gql<{
      search: { searchId: string; podcastSeries: TaddyPodcastSeries[] | null };
    }>(
      `query SearchPodcasts($term: String!) {
        search(term: $term, filterForTypes: PODCASTSERIES, sortBy: POPULARITY) {
          searchId
          podcastSeries { uuid name description imageUrl rssUrl itunesId totalEpisodesCount popularityRank genres }
        }
      }`,
      { term: query }
    );
    return (data.search?.podcastSeries ?? []).map(mapPodcast);
  }

  async searchEpisodes(query: string): Promise<Episode[]> {
    const data = await gql<{
      search: { searchId: string; podcastEpisodes: TaddyEpisode[] | null };
    }>(
      `query SearchEpisodes($term: String!) {
        search(term: $term, filterForTypes: PODCASTEPISODE, sortBy: POPULARITY) {
          searchId
          podcastEpisodes {
            uuid name description imageUrl audioUrl datePublished duration
            podcastSeries { uuid name }
          }
        }
      }`,
      { term: query }
    );
    return (data.search?.podcastEpisodes ?? []).map((e) => mapEpisode(e));
  }

  async getPodcast(id: string): Promise<Podcast> {
    const data = await gql<{
      getPodcastSeries: TaddyPodcastSeries | null;
    }>(
      `query GetPodcast($uuid: ID!) {
        getPodcastSeries(uuid: $uuid) {
          uuid name description imageUrl rssUrl itunesId totalEpisodesCount popularityRank genres
        }
      }`,
      { uuid: id }
    );
    if (!data.getPodcastSeries) throw new Error(`Podcast not found: ${id}`);
    return mapPodcast(data.getPodcastSeries);
  }

  async getRecentEpisodes(podcastId: string): Promise<Episode[]> {
    const data = await gql<{
      getPodcastSeries: TaddyPodcastSeries & {
        episodes: TaddyEpisode[] | null;
      };
    }>(
      `query GetEpisodes($uuid: ID!) {
        getPodcastSeries(uuid: $uuid) {
          uuid name
          episodes {
            uuid name description imageUrl audioUrl datePublished duration
            podcastSeries { uuid name }
          }
        }
      }`,
      { uuid: podcastId }
    );
    const podcast = data.getPodcastSeries;
    if (!podcast) throw new Error(`Podcast not found: ${podcastId}`);
    return (podcast.episodes ?? []).map((e) => mapEpisode(e, podcast.name));
  }

  async getEpisode(id: string): Promise<Episode> {
    const data = await gql<{
      getPodcastEpisode: TaddyEpisode | null;
    }>(
      `query GetEpisode($uuid: ID!) {
        getPodcastEpisode(uuid: $uuid) {
          uuid name description imageUrl audioUrl datePublished duration
          podcastSeries { uuid name }
        }
      }`,
      { uuid: id }
    );
    if (!data.getPodcastEpisode) throw new Error(`Episode not found: ${id}`);
    return mapEpisode(data.getPodcastEpisode);
  }
}
