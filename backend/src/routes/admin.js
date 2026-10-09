import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAdmin } from "../middleware/admin-auth.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";

const router = Router();
const admin = new AdminService(new AdminRepository());
const limiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false });

router.use(limiter, requireAdmin());
router.get("/overview", async (_request, response) => response.json({ data: await admin.getOverview() }));
router.get("/levels", async (_request, response) => response.json({ data: await admin.getLevels() }));
router.get("/regions", async (_request, response) => response.json({ data: await admin.getRegions() }));

export default router;
