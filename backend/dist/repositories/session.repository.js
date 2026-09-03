export class SessionRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async createPlayerAndSession(input) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute("INSERT INTO players (id, public_id) VALUES (?, ?)", [input.playerId, input.publicId]);
            await connection.execute("INSERT INTO sessions (id, player_id, token_hash, expires_at) VALUES (?, ?, ?, ?)", [input.sessionId, input.playerId, input.tokenHash, input.expiresAt]);
            await connection.execute(`INSERT INTO player_region_progress (player_id, region_id, status, unlocked_at)
         SELECT ?, id, IF(sort_order = 1, 'unlocked', 'locked'), IF(sort_order = 1, NOW(3), NULL) FROM regions`, [input.playerId]);
            await connection.execute(`INSERT INTO player_level_progress (player_id, level_id, status, unlocked_at)
         SELECT ?, l.id, IF(r.sort_order = 1 AND l.level_number = 1, 'unlocked', 'locked'),
         IF(r.sort_order = 1 AND l.level_number = 1, NOW(3), NULL)
         FROM levels l JOIN regions r ON r.id = l.region_id`, [input.playerId]);
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
    async findActiveByTokenHash(tokenHash) {
        const [rows] = await this.db.execute(`SELECT s.id sessionId, s.player_id playerId, p.public_id publicId, s.expires_at expiresAt
       FROM sessions s JOIN players p ON p.id = s.player_id
       WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW(3) AND p.deleted_at IS NULL`, [tokenHash]);
        return rows[0] ?? null;
    }
    async touch(sessionId, playerId) {
        await Promise.all([
            this.db.execute("UPDATE sessions SET last_used_at = NOW(3) WHERE id = ?", [sessionId]),
            this.db.execute("UPDATE players SET last_seen_at = NOW(3) WHERE id = ?", [playerId]),
        ]);
    }
    async rotate(sessionId, tokenHash, expiresAt) {
        const [result] = await this.db.execute("UPDATE sessions SET token_hash = ?, expires_at = ?, last_used_at = NOW(3) WHERE id = ? AND revoked_at IS NULL", [tokenHash, expiresAt, sessionId]);
        if (result.affectedRows !== 1)
            throw new Error("Sessão não encontrada para rotação");
    }
    async revoke(sessionId) {
        await this.db.execute("UPDATE sessions SET revoked_at = NOW(3) WHERE id = ?", [sessionId]);
    }
    async deletePlayer(playerId) {
        await this.db.execute("DELETE FROM players WHERE id = ?", [playerId]);
    }
}
//# sourceMappingURL=session.repository.js.map