import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "../utils/password.js";
import { AdminAuthService } from "./admin-auth.service.js";

describe("sessão administrativa", () => {
  it("cria, autentica e revoga uma sessão opaca", async () => {
    const sessions = new Map();
    const repository = {
      createSession: vi.fn(async (id, data) => sessions.set(id, data)),
      getSession: vi.fn(async (id) => sessions.get(id) ?? null),
      deleteSession: vi.fn(async (id) => sessions.delete(id)),
    };
    const config = {
      ADMIN_USERNAME: "administrador",
      ADMIN_PASSWORD_HASH: await hashPassword("senha-administrativa-forte"),
      ADMIN_SESSION_TTL_HOURS: 8,
    };
    const service = new AdminAuthService(repository, config);
    const login = await service.login("administrador", "senha-administrativa-forte");
    expect(login.token).toBeTruthy();
    await expect(service.authenticate(login.token)).resolves.toMatchObject({ username: "administrador", role: "admin" });
    await service.logout(login.token);
    await expect(service.authenticate(login.token)).resolves.toBeNull();
  });

  it("rejeita senha incorreta", async () => {
    const service = new AdminAuthService({}, {
      ADMIN_USERNAME: "administrador",
      ADMIN_PASSWORD_HASH: await hashPassword("senha-administrativa-forte"),
      ADMIN_SESSION_TTL_HOURS: 8,
    });
    await expect(service.login("administrador", "senha-incorreta-123")).resolves.toBeNull();
  });
});
