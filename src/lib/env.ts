import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  MARKETSTACK_API_KEY: z.string().min(1),
  MARKETAUX_API_TOKEN: z.string().min(1),
  PODCAST_API_KEY: z.string().optional(),
  PODCAST_API_USER_ID: z.string().optional(),
  PODCAST_API_BASE_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(1),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

function validateClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables");
  }
  return parsed.data;
}

export const serverEnv =
  process.env.NODE_ENV === "production"
    ? validateServerEnv()
    : (serverEnvSchema.parse(process.env) as z.infer<typeof serverEnvSchema>);

export const clientEnv = validateClientEnv();
