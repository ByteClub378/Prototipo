import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const safeEqual = (received, expected) => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
};

export const requireAdmin = (config = env) => (request, _response, next) => {
  if (!config.ADMIN_API_KEY) {
    next(new ApiError(503, "ADMIN_NOT_CONFIGURED", "Acesso administrativo ainda não foi configurado."));
    return;
  }

  const authorization = request.get("authorization") ?? "";
  const [scheme, token, extra] = authorization.split(" ");
  if (scheme !== "Bearer" || !token || extra || !safeEqual(token, config.ADMIN_API_KEY)) {
    next(new ApiError(401, "ADMIN_UNAUTHORIZED", "Credencial administrativa inválida ou ausente."));
    return;
  }

  next();
};
