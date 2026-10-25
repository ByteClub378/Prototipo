import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { REGIONS } from "../database/catalog.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";
import { ApiError } from "../utils/api-error.js";

const router = Router();
const admin = new AdminService(new AdminRepository());
const limiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false });

function parseFilters(query) {
	const today = new Date();
	const defaultTo = today.toISOString().slice(0, 10);
	const defaultFromDate = new Date(today);
	defaultFromDate.setUTCDate(defaultFromDate.getUTCDate() - 13);
	const from = query.from ?? defaultFromDate.toISOString().slice(0, 10);
	const to = query.to ?? defaultTo;
	const regionId = query.regionId ?? "";
	const validDate = (value) => typeof value === "string"
		&& /^\d{4}-\d{2}-\d{2}$/.test(value)
		&& new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;

	if (!validDate(from) || !validDate(to) || from > to) {
		throw new ApiError(400, "INVALID_DATE_RANGE", "Informe um período válido usando datas no formato AAAA-MM-DD.");
	}
	if (typeof regionId !== "string" || (regionId && !REGIONS.some((region) => region.id === regionId))) {
		throw new ApiError(400, "INVALID_REGION", "Região inválida.");
	}

	const toExclusive = new Date(`${to}T00:00:00.000Z`);
	toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
	return { from: new Date(`${from}T00:00:00.000Z`), toExclusive, regionId: regionId || undefined };
}

router.use(limiter);
router.get("/overview", async (request, response) => response.json({ data: await admin.getFilteredOverview(parseFilters(request.query)) }));
router.get("/levels", async (_request, response) => response.json({ data: await admin.getLevels() }));
router.get("/regions", async (request, response) => response.json({ data: await admin.getFilteredRegions(parseFilters(request.query)) }));
router.get("/topics", async (request, response) => response.json({ data: await admin.getTopics(parseFilters(request.query)) }));

export default router;
