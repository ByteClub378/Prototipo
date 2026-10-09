import { describe, expect, it, vi } from "vitest";
import { requireAdmin } from "./admin-auth.js";

const key = "chave-administrativa-de-teste-com-32-caracteres";

const run = (authorization, config = { ADMIN_API_KEY: key }) => {
  const next = vi.fn();
  requireAdmin(config)({ get: () => authorization }, {}, next);
  return next.mock.calls[0]?.[0];
};

describe("autenticação administrativa", () => {
  it("aceita Bearer token correto", () => {
    expect(run(`Bearer ${key}`)).toBeUndefined();
  });

  it("rejeita token incorreto", () => {
    const error = run("Bearer token-incorreto");
    expect(error.status).toBe(401);
    expect(error.code).toBe("ADMIN_UNAUTHORIZED");
  });

  it("informa quando o acesso administrativo não está configurado", () => {
    const error = run(undefined, {});
    expect(error.status).toBe(503);
    expect(error.code).toBe("ADMIN_NOT_CONFIGURED");
  });
});
