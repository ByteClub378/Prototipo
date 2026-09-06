import { pool } from "../database/pool.js";
import { ApiError } from "../utils/api-error.js";
export class GameRepository {
    async getProgress(playerId) {
        const [regions] = await pool.execute(`SELECT r.id regionId, r.name, pr.status, pr.unlocked_at unlockedAt, pr.completed_at completedAt
       FROM regions r JOIN player_region_progress pr ON pr.region_id = r.id
       WHERE pr.player_id = ? ORDER BY r.sort_order`, [playerId]);
        const [levels] = await pool.execute(`SELECT r.id regionId, l.level_number levelNumber, l.name, pl.status,
       pl.best_score bestScore, pl.attempt_count attemptCount, pl.unlocked_at unlockedAt, pl.completed_at completedAt
       FROM player_level_progress pl JOIN levels l ON l.id = pl.level_id JOIN regions r ON r.id = l.region_id
       WHERE pl.player_id = ? ORDER BY r.sort_order, l.level_number`, [playerId]);
        return { regions, levels };
    }
    async startAttempt(playerId, attemptId, regionId, levelNumber) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const level = await this.lockLevel(connection, playerId, regionId, levelNumber);
            if (level.status === "locked")
                throw new ApiError(403, "LEVEL_LOCKED", "Este nível ainda está bloqueado.");
            const [existing] = await connection.execute("SELECT id, status, player_id playerId, level_id levelId, score FROM attempts WHERE id = ?", [attemptId]);
            if (existing[0]) {
                if (existing[0].playerId !== playerId || existing[0].levelId !== level.id) {
                    throw new ApiError(409, "ATTEMPT_ID_CONFLICT", "O identificador da tentativa já está em uso.");
                }
                await connection.commit();
                return { attemptId, status: existing[0].status, idempotent: true };
            }
            const [numberRows] = await connection.execute("SELECT COALESCE(MAX(attempt_number), 0) + 1 attemptNumber FROM attempts WHERE player_id = ? AND level_id = ? FOR UPDATE", [playerId, level.id]);
            const attemptNumber = Number(numberRows[0]?.attemptNumber ?? 1);
            await connection.execute("INSERT INTO attempts (id, player_id, level_id, attempt_number) VALUES (?, ?, ?, ?)", [attemptId, playerId, level.id, attemptNumber]);
            await connection.execute("UPDATE player_level_progress SET attempt_count = attempt_count + 1 WHERE player_id = ? AND level_id = ?", [playerId, level.id]);
            await connection.commit();
            return { attemptId, attemptNumber, status: "started", maxScore: level.maxScore, idempotent: false };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async completeAttempt(playerId, attemptId, input) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [rows] = await connection.execute(`SELECT a.id, a.status, a.player_id playerId, a.level_id levelId, a.score,
         l.region_id regionId, l.level_number levelNumber, l.max_score maxScore
         FROM attempts a JOIN levels l ON l.id = a.level_id WHERE a.id = ? FOR UPDATE`, [attemptId]);
            const attempt = rows[0];
            if (!attempt || attempt.playerId !== playerId)
                throw new ApiError(404, "ATTEMPT_NOT_FOUND", "Tentativa não encontrada.");
            if (input.score > attempt.maxScore) {
                throw new ApiError(400, "SCORE_OUT_OF_RANGE", `A pontuação máxima deste nível é ${attempt.maxScore}.`);
            }
            if (attempt.status === "completed") {
                if (attempt.score !== input.score)
                    throw new ApiError(409, "ATTEMPT_ALREADY_COMPLETED", "A tentativa já foi concluída com outros dados.");
                await connection.commit();
                return { attemptId, status: "completed", score: attempt.score, idempotent: true };
            }
            await connection.execute(`UPDATE attempts SET status = 'completed', score = ?, correct_answers = ?, incorrect_answers = ?,
         duration_seconds = ?, completed_at = NOW(3) WHERE id = ?`, [input.score, input.correctAnswers, input.incorrectAnswers, input.durationSeconds, attemptId]);
            await connection.execute(`UPDATE player_level_progress SET status = 'completed', best_score = GREATEST(best_score, ?),
         completed_at = COALESCE(completed_at, NOW(3)) WHERE player_id = ? AND level_id = ?`, [input.score, playerId, attempt.levelId]);
            await this.applyUnlocks(connection, playerId, attempt.regionId, attempt.levelNumber);
            const awardedMedals = await this.awardEligibleMedals(connection, playerId, attempt.regionId);
            await connection.commit();
            return { attemptId, status: "completed", score: input.score, idempotent: false, awardedMedals };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async getMedals(playerId) {
        const [rows] = await pool.execute(`SELECT m.id, m.name, m.description, m.region_id regionId, pm.awarded_at awardedAt
       FROM player_medals pm JOIN medals m ON m.id = pm.medal_id
       WHERE pm.player_id = ? ORDER BY pm.awarded_at`, [playerId]);
        return rows;
    }
    async resetProgress(playerId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute("DELETE FROM attempts WHERE player_id = ?", [playerId]);
            await connection.execute("DELETE FROM player_medals WHERE player_id = ?", [playerId]);
            await connection.execute("DELETE FROM player_level_progress WHERE player_id = ?", [playerId]);
            await connection.execute("DELETE FROM player_region_progress WHERE player_id = ?", [playerId]);
            await connection.execute(`INSERT INTO player_region_progress (player_id, region_id, status, unlocked_at)
         SELECT ?, id, IF(sort_order = 1, 'unlocked', 'locked'), IF(sort_order = 1, NOW(3), NULL) FROM regions`, [playerId]);
            await connection.execute(`INSERT INTO player_level_progress (player_id, level_id, status, unlocked_at)
         SELECT ?, l.id, IF(r.sort_order = 1 AND l.level_number = 1, 'unlocked', 'locked'),
         IF(r.sort_order = 1 AND l.level_number = 1, NOW(3), NULL)
         FROM levels l JOIN regions r ON r.id = l.region_id`, [playerId]);
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async lockLevel(connection, playerId, regionId, levelNumber) {
        const [rows] = await connection.execute(`SELECT l.id, l.region_id regionId, l.level_number levelNumber, l.max_score maxScore, pl.status
       FROM levels l JOIN player_level_progress pl ON pl.level_id = l.id
       WHERE pl.player_id = ? AND l.region_id = ? AND l.level_number = ? AND l.active = TRUE FOR UPDATE`, [playerId, regionId, levelNumber]);
        if (!rows[0])
            throw new ApiError(404, "LEVEL_NOT_FOUND", "Nível inexistente ou indisponível.");
        return rows[0];
    }
    async applyUnlocks(connection, playerId, regionId, levelNumber) {
        const [next] = await connection.execute("SELECT id FROM levels WHERE region_id = ? AND level_number = ? AND active = TRUE", [regionId, levelNumber + 1]);
        if (next[0]) {
            await connection.execute(`UPDATE player_level_progress SET status = IF(status = 'locked', 'unlocked', status),
         unlocked_at = COALESCE(unlocked_at, NOW(3)) WHERE player_id = ? AND level_id = ?`, [playerId, next[0].id]);
            return;
        }
        const [count] = await connection.execute(`SELECT COUNT(*) total, SUM(pl.status = 'completed') completed FROM levels l
       JOIN player_level_progress pl ON pl.level_id = l.id
       WHERE pl.player_id = ? AND l.region_id = ? AND l.active = TRUE`, [playerId, regionId]);
        if (!count[0] || Number(count[0].total) !== Number(count[0].completed))
            return;
        await connection.execute("UPDATE player_region_progress SET status = 'completed', completed_at = COALESCE(completed_at, NOW(3)) WHERE player_id = ? AND region_id = ?", [playerId, regionId]);
        const [nextRegion] = await connection.execute(`SELECT next.id FROM regions current JOIN regions next ON next.sort_order = current.sort_order + 1
       WHERE current.id = ? AND next.active = TRUE`, [regionId]);
        if (nextRegion[0]) {
            await connection.execute(`UPDATE player_region_progress SET status = IF(status = 'locked', 'unlocked', status),
         unlocked_at = COALESCE(unlocked_at, NOW(3)) WHERE player_id = ? AND region_id = ?`, [playerId, nextRegion[0].id]);
            await connection.execute(`UPDATE player_level_progress pl JOIN levels l ON l.id = pl.level_id
         SET pl.status = IF(pl.status = 'locked', 'unlocked', pl.status), pl.unlocked_at = COALESCE(pl.unlocked_at, NOW(3))
         WHERE pl.player_id = ? AND l.region_id = ? AND l.level_number = 1`, [playerId, nextRegion[0].id]);
        }
    }
    async awardEligibleMedals(connection, playerId, regionId) {
        const [result] = await connection.execute("SELECT status FROM player_region_progress WHERE player_id = ? AND region_id = ?", [playerId, regionId]);
        if (result[0]?.status !== "completed")
            return [];
        const [medals] = await connection.execute("SELECT id FROM medals WHERE region_id = ? AND criterion_type = 'region_complete' AND active = TRUE", [regionId]);
        const awarded = [];
        for (const medal of medals) {
            const [insert] = await connection.execute("INSERT IGNORE INTO player_medals (player_id, medal_id) VALUES (?, ?)", [playerId, medal.id]);
            if (insert.affectedRows === 1)
                awarded.push(String(medal.id));
        }
        return awarded;
    }
}
