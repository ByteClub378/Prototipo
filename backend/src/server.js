import { app } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabase } from "./database/firebase.js";
await checkDatabase();
const server = app.listen(env.PORT, () => console.log(`API disponível na porta ${env.PORT}`));
let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown)
        return;
    shuttingDown = true;
    console.log(`Encerrando após ${signal}...`);
    server.close(async () => {
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
