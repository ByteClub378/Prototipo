import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
export const requireSession = (service) => async (request, _response, next) => {
    try {
        const record = await service.authenticate(request.cookies?.[env.COOKIE_NAME]);
        if (!record)
            throw new ApiError(401, "SESSION_INVALID", "Sessão ausente, expirada ou inválida.");
        request.auth = { playerId: record.playerId, publicId: record.publicId, sessionId: record.sessionId };
        next();
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=auth.js.map