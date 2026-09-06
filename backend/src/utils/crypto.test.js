import { describe, expect, it } from "vitest";
import { hashToken, newOpaqueToken } from "./crypto.js";

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
