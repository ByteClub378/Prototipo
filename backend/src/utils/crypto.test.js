import { describe, expect, it } from "vitest";
import { hashToken, newOpaqueToken, signPayload, verifyPayload } from "./crypto.js";

describe("tokens de sessão", () => {
  it("gera tokens opacos distintos e hashes SHA-256", () => {
    const first = newOpaqueToken();
    const second = newOpaqueToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashToken(first)).toHaveLength(32);
    expect(hashToken(first).equals(hashToken(second))).toBe(false);
  });
});
describe("cookie assinado", () => {
    it("valida conteúdo legítimo e rejeita adulteração", () => {
        const secret = "uma-chave-de-teste-com-mais-de-32-caracteres";
        const token = signPayload({ pid: "player", exp: Date.now() + 1000 }, secret);
        expect(verifyPayload(token, secret).pid).toBe("player");
        expect(verifyPayload(`${token}x`, secret)).toBeNull();
    });
});
