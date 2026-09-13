import { describe, expect, it } from "vitest";
import { LEVELS, MEDALS, initialProgress, levelId } from "./catalog.js";

describe("catálogo do jogo", () => {
  it("mantém as três rodadas do Norte e do Nordeste alinhadas ao front", () => {
    expect(LEVELS.filter((level) => level.regionId === "norte")).toHaveLength(3);
    expect(LEVELS.filter((level) => level.regionId === "nordeste")).toHaveLength(3);
  });

  it("exige 60% da pontuação máxima em todas as rodadas", () => {
    for (const level of LEVELS) {
      expect(level.minScore).toBe(Math.ceil(level.maxScore * 0.6));
    }
  });

  it("começa somente com a primeira rodada do Norte liberada", () => {
    const progress = initialProgress();

    expect(progress.levels[levelId("norte", 1)].status).toBe("unlocked");
    expect(progress.levels[levelId("norte", 2)].status).toBe("locked");
    expect(progress.levels[levelId("nordeste", 1)].status).toBe("locked");
  });

  it("possui medalhas para as duas regiões implementadas", () => {
    expect(MEDALS.map((medal) => medal.regionId)).toEqual(["norte", "nordeste"]);
  });
});
