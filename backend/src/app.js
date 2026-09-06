import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { checkDatabase } from "./database/pool.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import apiRouter from "./routes/api.js";
export const app = express();
app.disable("x-powered-by");
if (env.TRUST_PROXY)
    app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE"] }));
app.use(express.json({ limit: "32kb", strict: true }));
app.use(cookieParser());
app.get("/health/live", (_request, response) => response.json({ data: { status: "ok" } }));
app.get("/health/ready", async (_request, response) => {
    await checkDatabase();
    response.json({ data: { status: "ready" } });
});
app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);
