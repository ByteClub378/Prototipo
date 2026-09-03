import "dotenv/config";
import { pool } from "./pool.js";
import { env } from "../config/env.js";
try {
    const [sessions] = await pool.execute("DELETE FROM sessions WHERE expires_at < DATE_SUB(NOW(3), INTERVAL 30 DAY) OR revoked_at < DATE_SUB(NOW(3), INTERVAL 30 DAY)");
    const [players] = await pool.execute(`DELETE FROM players WHERE last_seen_at < DATE_SUB(NOW(3), INTERVAL ? DAY)
     AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.player_id = players.id AND s.revoked_at IS NULL AND s.expires_at > NOW(3))`, [env.PLAYER_RETENTION_DAYS]);
    console.log(`Limpeza concluída: ${sessions.affectedRows} sessões e ${players.affectedRows} jogadores removidos.`);
}
finally {
    await pool.end();
}
