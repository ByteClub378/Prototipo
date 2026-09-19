// Entrada serverless da Vercel. Não chame app.listen() aqui: a plataforma
// cria o servidor e encaminha cada requisição para a instância do Express.
export { app as default } from "../backend/src/app.js";
