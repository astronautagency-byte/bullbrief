import type { MetadataRoute } from "next";

const BASE_URL = "https://bullbrief.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const publicPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const dashPages: MetadataRoute.Sitemap = [
    "markets",
    "news",
    "podcasts",
    "watchlist",
  ].map((page) => ({
    url: `${BASE_URL}/${page}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...publicPages, ...dashPages];
}
