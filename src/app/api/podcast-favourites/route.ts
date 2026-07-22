import { NextResponse } from "next/server";
import { getFavourites, addFavourite } from "@/lib/podcast-favourites-store";

export async function GET() {
  return NextResponse.json({ data: getFavourites() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || !body.title) {
      return NextResponse.json(
        { error: "id and title are required" },
        { status: 400 }
      );
    }

    const result = addFavourite(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to add favourite" },
      { status: 500 }
    );
  }
}
