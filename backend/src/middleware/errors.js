import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";
export const notFound = (_req, _res, next) => next(new ApiError(404, "ROUTE_NOT_FOUND", "Rota não encontrada."));
export const errorHandler = (error, _req, response, _next) => {
    if (error instanceof ZodError) {
        response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details: error.issues } });
        return;
    }
    if (error instanceof ApiError) {
        response.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } });
        return;
    }
    console.error("[internal_error]", error instanceof Error ? error.message : "Erro desconhecido");
    response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." } });
};
