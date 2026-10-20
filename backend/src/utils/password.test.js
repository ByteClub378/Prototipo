import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("senha administrativa", () => {
  it("gera hash e valida somente a senha correta", async () => {
    const hash = await hashPassword("uma-senha-forte-de-teste");
    expect(hash).not.toContain("uma-senha-forte-de-teste");
    await expect(verifyPassword("uma-senha-forte-de-teste", hash)).resolves.toBe(true);
    await expect(verifyPassword("senha-errada", hash)).resolves.toBe(false);
  });
});
