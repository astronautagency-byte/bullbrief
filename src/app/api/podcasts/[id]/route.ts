import { NextResponse } from "next/server";
import { TaddyPodcastProvider } from "@/lib/providers/podcast/taddy";

const provider = new TaddyPodcastProvider();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [podcast, episodes] = await Promise.all([
      provider.getPodcast(id),
      provider.getRecentEpisodes(id),
    ]);

    return NextResponse.json({ data: { podcast, episodes } });
  } catch (error) {
    console.error("Podcast fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcast" },
      { status: 502 }
    );
  }
}
