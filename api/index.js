import { app } from "../backend/src/app.js";
import { checkDatabase } from "../backend/src/database/firebase.js";

// Verifica o Firebase ao inicializar esta instância da função.
await checkDatabase();

// A Vercel recebe as requisições e as entrega ao Express.
export default app;