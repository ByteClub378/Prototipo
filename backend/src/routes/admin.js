import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { sessionCookieOptions } from "../config/session-cookie.js";
import { requireAdmin } from "../middleware/admin-auth.js";
import { AdminAuthRepository } from "../repositories/admin-auth.repository.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminAuthService } from "../services/admin-auth.service.js";
import { AdminService, statsFilterSchema, trendFilterSchema } from "../services/admin.service.js";
import { ApiError } from "../utils/api-error.js";

const router = Router();
const admin = new AdminService(new AdminRepository());
const authService = new AdminAuthService(new AdminAuthRepository());
const auth = requireAdmin(authService);
const limiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, skipSuccessfulRequests: true, standardHeaders: "draft-8", legacyHeaders: false });
const loginSchema = z.object({ username: z.string().min(3).max(64), password: z.string().min(12).max(256) }).strict();
const adminCookieOptions = {
  ...sessionCookieOptions({ ...env, FRONTEND_ORIGIN: env.ADMIN_ORIGIN ?? env.FRONTEND_ORIGIN }),
  path: "/api/v1/admin",
};

router.post("/auth/login", loginLimiter, async (request, response) => {
  if (!authService.isConfigured()) throw new ApiError(503, "ADMIN_LOGIN_NOT_CONFIGURED", "Login administrativo ainda não foi configurado.");
  const input = loginSchema.parse(request.body);
  const result = await authService.login(input.username, input.password);
  if (!result) throw new ApiError(401, "ADMIN_INVALID_CREDENTIALS", "Usuário ou senha inválidos.");
  response.cookie(env.ADMIN_COOKIE_NAME, result.token, { ...adminCookieOptions, expires: result.expiresAt });
  response.json({ data: { username: result.username, role: result.role, expiresAt: result.expiresAt.toISOString() } });
});

router.get("/auth/session", auth, async (request, response) => {
  response.json({ data: { username: request.admin.username, role: request.admin.role, expiresAt: request.admin.expiresAt?.toISOString?.() ?? null } });
});

router.delete("/auth/session", auth, async (request, response) => {
  await authService.logout(request.cookies?.[env.ADMIN_COOKIE_NAME]);
  response.clearCookie(env.ADMIN_COOKIE_NAME, adminCookieOptions);
  response.status(204).send();
});

router.use("/stats", limiter, auth);
router.get("/stats/overview", async (request, response) => response.json({ data: await admin.getOverview(statsFilterSchema.parse(request.query)) }));
router.get("/stats/levels", async (request, response) => response.json({ data: await admin.getLevels(statsFilterSchema.parse(request.query)) }));
router.get("/stats/regions", async (request, response) => response.json({ data: await admin.getRegions(statsFilterSchema.parse(request.query)) }));
router.get("/stats/trends", async (request, response) => response.json({ data: await admin.getTrends(trendFilterSchema.parse(request.query)) }));
router.get("/stats/topics", async (request, response) => response.json({ data: await admin.getTopics(statsFilterSchema.parse(request.query)) }));
router.get("/stats/difficulties", async (request, response) => response.json({ data: await admin.getDifficulties(statsFilterSchema.parse(request.query)) }));
router.get("/stats/learning-evolution", async (request, response) => response.json({ data: await admin.getLearningEvolution(statsFilterSchema.parse(request.query)) }));
router.get("/stats/score-distribution", async (request, response) => response.json({ data: await admin.getScoreDistribution(statsFilterSchema.parse(request.query)) }));
router.get("/stats/engagement", async (request, response) => response.json({ data: await admin.getEngagement(statsFilterSchema.parse(request.query)) }));

export default router;
