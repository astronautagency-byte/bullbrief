import { NextResponse } from "next/server";
import { TaddyPodcastProvider } from "@/lib/providers/podcast/taddy";

const provider = new TaddyPodcastProvider();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type") || "podcasts"; // "podcasts" | "episodes"

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    if (type === "episodes") {
      const episodes = await provider.searchEpisodes(q);
      return NextResponse.json({ data: episodes });
    }
    const podcasts = await provider.searchPodcasts(q);
    return NextResponse.json({ data: podcasts });
  } catch (error) {
    console.error("Podcast search error:", error);
    return NextResponse.json(
      { error: "Failed to search podcasts", data: [] },
      { status: 502 }
    );
  }
}
