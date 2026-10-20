import { env } from "../config/env.js";
import { hashToken, newOpaqueToken } from "../utils/crypto.js";
import { verifyPassword } from "../utils/password.js";

const sessionId = (token) => hashToken(token).toString("hex");

export class AdminAuthService {
  constructor(repository, config = env) {
    this.repository = repository;
    this.config = config;
  }

  isConfigured() {
    return Boolean(this.config.ADMIN_USERNAME && this.config.ADMIN_PASSWORD_HASH);
  }

  async login(username, password) {
    if (!this.isConfigured()) return null;
    const usernameMatches = username === this.config.ADMIN_USERNAME;
    const passwordMatches = await verifyPassword(password, this.config.ADMIN_PASSWORD_HASH);
    if (!usernameMatches || !passwordMatches) return null;
    const token = newOpaqueToken();
    const expiresAt = new Date(Date.now() + this.config.ADMIN_SESSION_TTL_HOURS * 3_600_000);
    await this.repository.createSession(sessionId(token), { username, role: "admin", expiresAt });
    return { token, expiresAt, username, role: "admin" };
  }

  async authenticate(token) {
    if (typeof token !== "string" || token.length < 32 || token.length > 256) return null;
    const id = sessionId(token);
    const session = await this.repository.getSession(id);
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.repository.deleteSession(id);
      return null;
    }
    return { sessionId: id, username: session.username, role: session.role, expiresAt: session.expiresAt };
  }

  async logout(token) {
    if (typeof token === "string" && token.length >= 32 && token.length <= 256) {
      await this.repository.deleteSession(sessionId(token));
    }
  }
}
