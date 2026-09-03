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
    PLAYER_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(365),
    DB_HOST: z.string().min(1).default("127.0.0.1"),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
    DB_USER: z.string().min(1).default("aventura_app"),
    DB_PASSWORD: z.string().default(""),
    DB_NAME: z.string().regex(/^[a-zA-Z0-9_]+$/).default("aventura_regioes"),
    DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(50).default(10),
});
export const env = schema.parse(process.env);
//# sourceMappingURL=env.js.map