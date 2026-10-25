import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService, statsFilterSchema, trendFilterSchema } from "../services/admin.service.js";

const router = Router();
const admin = new AdminService(new AdminRepository());
const limiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false });

router.use("/stats", limiter);
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
