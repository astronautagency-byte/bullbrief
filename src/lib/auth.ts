import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-secret-change-in-production"
);

const COOKIE_NAME = "bullbrief-token";
const EXPIRY = "7d";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

// In-memory user store for demo mode (no database)
interface DemoUser {
  id: string;
  email: string;
  name: string | null;
  hashedPassword: string;
}

const demoUsers = new Map<string, DemoUser>();

let dbAvailable: boolean | null = null;

async function isDbAvailable(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;
  try {
    const { prisma } = await import("@/lib/prisma");
    if (!prisma) throw new Error("no db");
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    dbAvailable = false;
    console.log("[auth] Database unavailable - using demo mode (in-memory users)");
  }
  return dbAvailable;
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(
  token: string
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export async function auth(): Promise<{ user: AuthUser } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const user = await verifyToken(token);
    if (user) return { user };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? null,
      },
    };
  } catch {
    return null;
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (await isDbAvailable()) {
    const { prisma } = await import("@/lib/prisma");
    if (!prisma) return null;
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.hashedPassword) return null;

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) return null;

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const token = await createToken(authUser);
    return { user: authUser, token };
  }

  // Demo mode: in-memory users
  const demoUser = demoUsers.get(normalizedEmail);
  if (!demoUser) return null;

  const isValid = await bcrypt.compare(password, demoUser.hashedPassword);
  if (!isValid) return null;

  const authUser: AuthUser = {
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
  };

  const token = await createToken(authUser);
  return { user: authUser, token };
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (await isDbAvailable()) {
    const { prisma } = await import("@/lib/prisma");
    if (!prisma) return { success: false, error: "Database not available" };

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return { success: false, error: "An account with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, hashedPassword },
    });

    await prisma.userPreference.create({ data: { userId: user.id } });
    await prisma.watchlist.create({
      data: { userId: user.id, name: "My Watchlist", isDefault: true },
    });

    return { success: true };
  }

  // Demo mode: in-memory registration
  if (demoUsers.has(normalizedEmail)) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  demoUsers.set(normalizedEmail, { id, email: normalizedEmail, name, hashedPassword });

  return { success: true };
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}
