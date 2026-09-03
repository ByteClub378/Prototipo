import { env } from "../config/env.js";
import { hashToken, newId, newOpaqueToken } from "../utils/crypto.js";
const expiration = () => new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
export class SessionService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async bootstrap(existingToken) {
        if (existingToken) {
            const current = await this.authenticate(existingToken);
            if (current) {
                await this.repository.touch(current.sessionId, current.playerId);
                return { token: existingToken, playerId: current.publicId, expiresAt: current.expiresAt, created: false };
            }
        }
        const token = newOpaqueToken();
        const expiresAt = expiration();
        const playerId = newId();
        const publicId = newId();
        await this.repository.createPlayerAndSession({
            playerId, publicId, sessionId: newId(), tokenHash: hashToken(token), expiresAt,
        });
        return { token, playerId: publicId, expiresAt, created: true };
    }
    authenticate(token) {
        if (!token || token.length < 32 || token.length > 128)
            return Promise.resolve(null);
        return this.repository.findActiveByTokenHash(hashToken(token));
    }
    async refresh(record) {
        const token = newOpaqueToken();
        const expiresAt = expiration();
        await this.repository.rotate(record.sessionId, hashToken(token), expiresAt);
        return { token, expiresAt };
    }
}
//# sourceMappingURL=session.service.js.map