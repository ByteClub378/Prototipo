import { env } from "../config/env.js";
import { newId, signPayload, verifyPayload } from "../utils/crypto.js";
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
                return { token: existingToken, playerId: current.publicId, expiresAt: current.expiresAt, created: false };
            }
        }
        const expiresAt = expiration();
        const playerId = newId();
        const publicId = newId();
        await this.repository.createPlayer({ playerId, publicId });
        const token = this.issue({ playerId, publicId, expiresAt });
        return { token, playerId: publicId, expiresAt, created: true };
    }
    authenticate(token) {
        const payload = verifyPayload(token, env.SESSION_SECRET);
        if (!payload || payload.v !== 1 || !payload.pid || !payload.pub || !payload.sid || !Number.isInteger(payload.exp) || payload.exp <= Date.now()) return null;
        return { sessionId: payload.sid, playerId: payload.pid, publicId: payload.pub, expiresAt: new Date(payload.exp) };
    }
    async refresh(record) {
        const expiresAt = expiration();
        const token = this.issue({ playerId: record.playerId, publicId: record.publicId, expiresAt });
        return { token, expiresAt };
    }
    issue({ playerId, publicId, expiresAt }) {
        return signPayload({ v: 1, sid: newId(), pid: playerId, pub: publicId, iat: Date.now(), exp: expiresAt.getTime() }, env.SESSION_SECRET);
    }
}
