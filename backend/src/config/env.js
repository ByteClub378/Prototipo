import "dotenv/config";
import { z } from "zod";
const booleanString = z.enum(["true", "false"]).transform((value) => value === "true");
const schema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    TRUST_PROXY: booleanString.default(false),
    FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
    COOKIE_NAME: z.string().min(3).default("aventura_session"),
    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
    SESSION_SECRET: z.string().min(32).default("development-only-change-this-secret"),
    PLAYER_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(365),
    FIREBASE_PROJECT_ID: z.string().min(1).default("aventura-regioes-local"),
    FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
    FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
    FIRESTORE_EMULATOR_HOST: z.string().min(1).optional(),
});
export const env = schema.parse(process.env);
if (env.NODE_ENV === "production" && env.SESSION_SECRET === "development-only-change-this-secret") {
    throw new Error("SESSION_SECRET deve ser configurado em produção.");
}
