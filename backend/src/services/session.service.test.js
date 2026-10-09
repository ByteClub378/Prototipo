import { describe, expect, it, vi } from "vitest";
import { SessionService } from "./session.service.js";

describe("SessionService", () => {
  it("creates a new player when bootstrap is forced after an invalid session", async () => {
    const repository = { createPlayer: vi.fn() };
    const service = new SessionService(repository);
    const existingToken = service.issue({
      playerId: "deleted-player",
      publicId: "deleted-public-id",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await service.bootstrap(existingToken, true);

    expect(repository.createPlayer).toHaveBeenCalledOnce();
    expect(result.created).toBe(true);
    expect(result.token).not.toBe(existingToken);
    expect(result.playerId).not.toBe("deleted-public-id");
  });
});
