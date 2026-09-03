import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";
import { pool } from "../database/pool.js";
import { requireSession } from "../middleware/auth.js";
import { GameRepository } from "../repositories/game.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { completeAttemptSchema, GameService, startAttemptSchema } from "../services/game.service.js";
import { SessionService } from "../services/session.service.js";
import { ApiError } from "../utils/api-error.js";
const router = Router();
const sessions = new SessionService(new SessionRepository(pool));
const games = new GameService(new GameRepository());
const auth = requireSession(sessions);
const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1",
};
const setSessionCookie = (response, token, expiresAt) => {
    response.cookie(env.COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
};
const sessionLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false });
router.post("/session/bootstrap", sessionLimiter, async (request, response) => {
    const result = await sessions.bootstrap(request.cookies?.[env.COOKIE_NAME]);
    setSessionCookie(response, result.token, result.expiresAt);
    response.status(result.created ? 201 : 200).json({
        data: { playerId: result.playerId, expiresAt: result.expiresAt.toISOString(), created: result.created },
    });
});
router.post("/session/refresh", sessionLimiter, async (request, response) => {
    const current = await sessions.authenticate(request.cookies?.[env.COOKIE_NAME]);
    if (!current)
        throw new ApiError(401, "SESSION_INVALID", "Sessão ausente, expirada ou inválida.");
    const result = await sessions.refresh(current);
    setSessionCookie(response, result.token, result.expiresAt);
    response.json({ data: { playerId: current.publicId, expiresAt: result.expiresAt.toISOString() } });
});
router.delete("/session", auth, async (request, response) => {
    await new SessionRepository(pool).revoke(request.auth.sessionId);
    response.clearCookie(env.COOKIE_NAME, cookieOptions);
    response.status(204).send();
});
router.get("/me/progress", auth, async (request, response) => {
    response.json({ data: await games.getProgress(request.auth.playerId) });
});
router.get("/me/medals", auth, async (request, response) => {
    response.json({ data: await games.getMedals(request.auth.playerId) });
});
router.post("/attempts", writeLimiter, auth, async (request, response) => {
    const input = startAttemptSchema.parse(request.body);
    const result = await games.startAttempt(request.auth.playerId, input);
    response.status(result.idempotent ? 200 : 201).json({ data: result });
});
router.patch("/attempts/:attemptId/complete", writeLimiter, auth, async (request, response) => {
    const rawAttemptId = request.params.attemptId;
    const attemptId = zUuid(Array.isArray(rawAttemptId) ? rawAttemptId[0] : rawAttemptId);
    const input = completeAttemptSchema.parse(request.body);
    response.json({ data: await games.completeAttempt(request.auth.playerId, attemptId, input) });
});
router.delete("/me/progress", writeLimiter, auth, async (request, response) => {
    if (request.header("x-confirm-reset") !== "RESET") {
        throw new ApiError(400, "RESET_CONFIRMATION_REQUIRED", "Envie o cabeçalho X-Confirm-Reset: RESET.");
    }
    await games.resetProgress(request.auth.playerId);
    response.status(204).send();
});
router.delete("/me", writeLimiter, auth, async (request, response) => {
    if (request.header("x-confirm-delete") !== "DELETE") {
        throw new ApiError(400, "DELETE_CONFIRMATION_REQUIRED", "Envie o cabeçalho X-Confirm-Delete: DELETE.");
    }
    await new SessionRepository(pool).deletePlayer(request.auth.playerId);
    response.clearCookie(env.COOKIE_NAME, cookieOptions);
    response.status(204).send();
});
function zUuid(value) {
    if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        throw new ApiError(400, "INVALID_ATTEMPT_ID", "Identificador de tentativa inválido.");
    }
    return value;
}
export default router;
//# sourceMappingURL=api.js.map