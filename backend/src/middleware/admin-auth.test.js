import { describe, expect, it, vi } from "vitest";
import { requireAdmin } from "./admin-auth.js";

const key = "chave-administrativa-de-teste-com-32-caracteres";

const run = async ({ authorization, cookieSession = null, config = { ADMIN_API_KEY: key, ADMIN_COOKIE_NAME: "adminSession" } } = {}) => {
  const next = vi.fn();
  const authService = { authenticate: vi.fn().mockResolvedValue(cookieSession) };
  await requireAdmin(authService, config)({ cookies: {}, get: () => authorization }, {}, next);
  return { error: next.mock.calls[0]?.[0], authService };
};

describe("autenticação administrativa", () => {
  it("aceita Bearer token correto", async () => {
    expect((await run({ authorization: `Bearer ${key}` })).error).toBeUndefined();
  });

  it("aceita sessão administrativa válida", async () => {
    expect((await run({ cookieSession: { username: "admin", role: "admin" } })).error).toBeUndefined();
  });

  it("rejeita credencial incorreta", async () => {
    const { error } = await run({ authorization: "Bearer token-incorreto" });
    expect(error.status).toBe(401);
    expect(error.code).toBe("ADMIN_UNAUTHORIZED");
  });
});
