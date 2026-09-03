import mysql from "mysql2/promise";
import { env } from "../config/env.js";
export const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    timezone: "Z",
    decimalNumbers: true,
});
export async function checkDatabase() {
    await pool.query("SELECT 1");
}
//# sourceMappingURL=pool.js.map