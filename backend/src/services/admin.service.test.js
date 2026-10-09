import { describe, expect, it, vi } from "vitest";
import { AdminService } from "./admin.service.js";

describe("estatísticas administrativas", () => {
  it("calcula visão geral e reutiliza o cache", async () => {
    const repository = { getOverview: vi.fn().mockResolvedValue({
      totalPlayers: 10, playersWhoPlayed: 8, totalAttempts: 20, passedAttempts: 15,
      averageDurationSeconds: 42.126, totalCorrectAnswers: 75, totalIncorrectAnswers: 25,
    }) };
    const service = new AdminService(repository, 300);
    const first = await service.getOverview();
    const second = await service.getOverview();
    expect(first.players).toEqual({ total: 10, whoPlayed: 8, whoOnlyOpened: 2 });
    expect(first.attempts).toMatchObject({ total: 20, passRate: 75, accuracyRate: 75, averageDurationSeconds: 42.13 });
    expect(second).toBe(first);
    expect(repository.getOverview).toHaveBeenCalledTimes(1);
  });

  it("ordena fases por volume e desempenho", async () => {
    const repository = { getLevels: vi.fn().mockResolvedValue([
      { regionId: "norte", levelNumber: 1, name: "A", maxScore: 400, minScore: 240, totalAttempts: 10, passedAttempts: 5, averageScore: 200, averageDurationSeconds: 30, totalCorrectAnswers: 20, totalIncorrectAnswers: 20 },
      { regionId: "norte", levelNumber: 2, name: "B", maxScore: 400, minScore: 240, totalAttempts: 4, passedAttempts: 4, averageScore: 350, averageDurationSeconds: 25, totalCorrectAnswers: 14, totalIncorrectAnswers: 2 },
    ]) };
    const result = await new AdminService(repository, 300).getLevels();
    expect(result.rankings.mostPlayed[0].name).toBe("A");
    expect(result.rankings.bestPerformance[0].name).toBe("B");
    expect(result.levels[1]).toMatchObject({ passRate: 100, averageScorePercent: 87.5, accuracyRate: 87.5 });
  });
});
