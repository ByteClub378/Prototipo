import { describe, expect, it } from "vitest";
import { REGIONS } from "../database/catalog.js";
import { bonusProgress } from "./game.repository.js";

describe("progresso da fase bônus", () => {
  it("permanece bloqueada enquanto alguma região não foi concluída", () => {
    const regions = Object.fromEntries(REGIONS.map((region) => [region.id, {
      status: region.id === "sul" ? "unlocked" : "completed",
      completedAt: new Date("2026-10-01T12:00:00.000Z"),
    }]));

    expect(bonusProgress(regions)).toEqual({ status: "locked", unlockedAt: null });
  });

  it("é liberada na conclusão da última região", () => {
    const regions = Object.fromEntries(REGIONS.map((region, index) => [region.id, {
      status: "completed",
      completedAt: new Date(`2026-10-0${index + 1}T12:00:00.000Z`),
    }]));

    expect(bonusProgress(regions)).toEqual({
      status: "unlocked",
      unlockedAt: new Date("2026-10-05T12:00:00.000Z"),
    });
  });
});
