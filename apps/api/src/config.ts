import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// Load the monorepo-root .env when running locally (docker compose injects real env vars).
loadEnv({ path: resolve(process.cwd(), "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(16),
  CONTACT_HASH_PEPPER: z.string().min(4),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DEV_FIXED_OTP: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  REQUIRE_INVITE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
