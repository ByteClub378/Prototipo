import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const safeEqual = (received, expected) => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
};

export const requireAdmin = (authService, config = env) => async (request, _response, next) => {
  try {
    const cookieSession = await authService.authenticate(request.cookies?.[config.ADMIN_COOKIE_NAME]);
    if (cookieSession) {
      request.admin = cookieSession;
      next();
      return;
    }
    const authorization = request.get("authorization") ?? "";
    const [scheme, token, extra] = authorization.split(" ");
    if (config.ADMIN_API_KEY && scheme === "Bearer" && token && !extra && safeEqual(token, config.ADMIN_API_KEY)) {
      request.admin = { username: "api-key", role: "admin", authentication: "bearer" };
      next();
      return;
    }
    throw new ApiError(401, "ADMIN_UNAUTHORIZED", "Sessão ou credencial administrativa inválida.");
  } catch (error) {
    next(error);
  }
};
