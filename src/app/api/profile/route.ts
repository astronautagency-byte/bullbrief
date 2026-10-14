import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ data: { name: session.user.name || "", email: session.user.email || "", institutionLogo: "" } });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, image: true } });
  return NextResponse.json({ data: { name: user?.name || "", email: user?.email || "", institutionLogo: user?.image || "" } });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : undefined;
  const institutionLogo = typeof body.institutionLogo === "string" ? body.institutionLogo : undefined;
  if (institutionLogo && (!institutionLogo.startsWith("data:image/") || institutionLogo.length > 500_000)) {
    return NextResponse.json({ error: "Logo must be a valid image under 500 KB" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { ...(name !== undefined && { name }), ...(institutionLogo !== undefined && { image: institutionLogo || null }) },
    select: { name: true, email: true, image: true },
  });
  return NextResponse.json({ data: { name: user.name || "", email: user.email, institutionLogo: user.image || "" } });
}
