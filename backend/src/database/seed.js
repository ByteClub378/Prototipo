import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";
const here = dirname(fileURLToPath(import.meta.url));
const sql = await readFile(resolve(here, "../../database/seeds/001_catalog.sql"), "utf8");
const connection = await mysql.createConnection({
    host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER, password: env.DB_PASSWORD,
    database: env.DB_NAME, multipleStatements: true,
});
try {
    await connection.query(sql);
    console.log("Catálogo inicial carregado.");
}
finally {
    await connection.end();
}
