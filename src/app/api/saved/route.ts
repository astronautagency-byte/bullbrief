import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [articles, episodes] = await Promise.all([
    prisma.savedArticle.findMany({
      where: { userId: session.user.id },
      orderBy: { savedAt: "desc" },
    }),
    prisma.savedEpisode.findMany({
      where: { userId: session.user.id },
      orderBy: { savedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ data: { articles, episodes } });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, providerId, title, url, podcastTitle, audioUrl } = body;

  if (type === "article") {
    const existing = await prisma.savedArticle.findUnique({
      where: {
        userId_articleProviderId: {
          userId: session.user.id,
          articleProviderId: providerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already saved" },
        { status: 409 }
      );
    }

    const article = await prisma.savedArticle.create({
      data: {
        userId: session.user.id,
        articleProviderId: providerId,
        title,
        url,
      },
    });

    return NextResponse.json({ data: article }, { status: 201 });
  }

  if (type === "episode") {
    const existing = await prisma.savedEpisode.findUnique({
      where: {
        userId_episodeProviderId: {
          userId: session.user.id,
          episodeProviderId: providerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already saved" },
        { status: 409 }
      );
    }

    const episode = await prisma.savedEpisode.create({
      data: {
        userId: session.user.id,
        episodeProviderId: providerId,
        podcastTitle: podcastTitle ?? "",
        episodeTitle: title,
        audioUrl,
      },
    });

    return NextResponse.json({ data: episode }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id required" },
      { status: 400 }
    );
  }

  if (type === "article") {
    const item = await prisma.savedArticle.findUnique({ where: { id } });
    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.savedArticle.delete({ where: { id } });
  } else if (type === "episode") {
    const item = await prisma.savedEpisode.findUnique({ where: { id } });
    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.savedEpisode.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
