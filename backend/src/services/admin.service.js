import { env } from "../config/env.js";
import { REGIONS } from "../database/catalog.js";

const round = (number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(number) || 0) * factor) / factor;
};

const percentage = (part, total) => total > 0 ? round(part * 100 / total) : 0;

const enrichLevel = (level) => {
  const answered = level.totalCorrectAnswers + level.totalIncorrectAnswers;
  return {
    ...level,
    failedAttempts: Math.max(0, level.totalAttempts - level.passedAttempts),
    passRate: percentage(level.passedAttempts, level.totalAttempts),
    averageScore: round(level.averageScore),
    averageScorePercent: percentage(level.averageScore, level.maxScore),
    averageDurationSeconds: round(level.averageDurationSeconds),
    accuracyRate: percentage(level.totalCorrectAnswers, answered),
  };
};

export class AdminService {
  constructor(repository, cacheTtlSeconds = env.ADMIN_CACHE_TTL_SECONDS) {
    this.repository = repository;
    this.cacheTtlMs = cacheTtlSeconds * 1000;
    this.cache = new Map();
  }

  cached(key, loader) {
    const current = this.cache.get(key);
    if (current && current.expiresAt > Date.now()) return current.promise;
    const promise = Promise.resolve().then(loader).catch((error) => {
      this.cache.delete(key);
      throw error;
    });
    this.cache.set(key, { expiresAt: Date.now() + this.cacheTtlMs, promise });
    return promise;
  }

  async getOverview() {
    return this.cached("overview", async () => {
      const data = await this.repository.getOverview();
      const answered = data.totalCorrectAnswers + data.totalIncorrectAnswers;
      return {
        generatedAt: new Date().toISOString(),
        cacheTtlSeconds: this.cacheTtlMs / 1000,
        players: {
          total: data.totalPlayers,
          whoPlayed: data.playersWhoPlayed,
          whoOnlyOpened: Math.max(0, data.totalPlayers - data.playersWhoPlayed),
        },
        attempts: {
          total: data.totalAttempts,
          passed: data.passedAttempts,
          failed: Math.max(0, data.totalAttempts - data.passedAttempts),
          passRate: percentage(data.passedAttempts, data.totalAttempts),
          accuracyRate: percentage(data.totalCorrectAnswers, answered),
          averageDurationSeconds: round(data.averageDurationSeconds),
          totalCorrectAnswers: data.totalCorrectAnswers,
          totalIncorrectAnswers: data.totalIncorrectAnswers,
        },
      };
    });
  }

  async getLevels() {
    return this.cached("levels", async () => {
      const levels = (await this.repository.getLevels()).map(enrichLevel);
      const played = levels.filter((level) => level.totalAttempts > 0);
      return {
        generatedAt: new Date().toISOString(),
        cacheTtlSeconds: this.cacheTtlMs / 1000,
        levels,
        rankings: {
          mostPlayed: [...played].sort((a, b) => b.totalAttempts - a.totalAttempts),
          bestPerformance: [...played].sort((a, b) => b.passRate - a.passRate || b.averageScorePercent - a.averageScorePercent),
        },
      };
    });
  }

  async getRegions() {
    const levelData = await this.getLevels();
    const regions = REGIONS.map((region) => {
      const levels = levelData.levels.filter((level) => level.regionId === region.id);
      const totalAttempts = levels.reduce((sum, level) => sum + level.totalAttempts, 0);
      const passedAttempts = levels.reduce((sum, level) => sum + level.passedAttempts, 0);
      const correct = levels.reduce((sum, level) => sum + level.totalCorrectAnswers, 0);
      const incorrect = levels.reduce((sum, level) => sum + level.totalIncorrectAnswers, 0);
      const weightedScorePercent = levels.reduce((sum, level) => sum + level.averageScorePercent * level.totalAttempts, 0);
      return {
        regionId: region.id,
        name: region.name,
        totalAttempts,
        passedAttempts,
        failedAttempts: Math.max(0, totalAttempts - passedAttempts),
        passRate: percentage(passedAttempts, totalAttempts),
        accuracyRate: percentage(correct, correct + incorrect),
        averageScorePercent: totalAttempts > 0 ? round(weightedScorePercent / totalAttempts) : 0,
      };
    });
    const played = regions.filter((region) => region.totalAttempts > 0);
    return {
      generatedAt: levelData.generatedAt,
      cacheTtlSeconds: levelData.cacheTtlSeconds,
      regions,
      rankings: {
        mostPlayed: [...played].sort((a, b) => b.totalAttempts - a.totalAttempts),
        bestPerformance: [...played].sort((a, b) => b.passRate - a.passRate || b.averageScorePercent - a.averageScorePercent),
      },
    };
  }
}
