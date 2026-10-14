import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createToken, setAuthCookie, signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password } = await request.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const localSession = await signIn(email, password);
    if (localSession) {
      await setAuthCookie(localSession.token);
      return NextResponse.json({ success: true, user: localSession.user });
    }

    let data;
    let error;
    try {
      const supabase = await createClient();
      const response = await supabase.auth.signInWithPassword({ email, password });
      data = response.data;
      error = response.error;
    } catch (providerError) {
      console.warn(
        "External sign-in provider unavailable:",
        providerError instanceof Error ? providerError.message : "unknown provider error"
      );
      return NextResponse.json(
        {
          error: "This account is not available in BullBrief yet. Create an account with this email, then sign in.",
          code: "AUTH_PROVIDER_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    if (error) {
      return NextResponse.json(
        { error: error.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const providerEmail = data.user.email ?? email;
    let appUser = null;
    if (prisma) {
      try {
        appUser = await prisma.user.findUnique({ where: { email: providerEmail } });
        if (!appUser) {
          appUser = await prisma.user.create({
            data: {
              id: data.user.id,
              email: providerEmail,
              name: data.user.user_metadata?.name ?? null,
              preferences: { create: {} },
              watchlists: { create: { name: "My Watchlist", isDefault: true } },
            },
          });
        }
      } catch (databaseError) {
        console.warn("Account persistence unavailable during sign in:", databaseError instanceof Error ? databaseError.message : "unknown database error");
      }
    }
    const appIdentity = {
      id: appUser?.id ?? data.user.id,
      email: providerEmail,
      name: appUser?.name ?? data.user.user_metadata?.name ?? null,
    };
    await setAuthCookie(await createToken(appIdentity));

    return NextResponse.json({
      success: true,
      user: appIdentity,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to sign in" },
      { status: 500 }
    );
  }
}
