import { env } from "../config/env.js";
import { REGIONS } from "../database/catalog.js";

const round = (number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(number) || 0) * factor) / factor;
};

const percentage = (part, total) => total > 0 ? round(part * 100 / total) : 0;

const TOPICS = [
  ["fauna", "Fauna"],
  ["flora", "Flora"],
  ["biomas", "Biomas"],
  ["clima", "Clima"],
  ["estados-capitais", "Estados e capitais"],
  ["cultura", "Cultura"],
  ["culinaria", "Culinária"],
  ["festas-populares", "Festas populares"],
  ["historia", "História"],
  ["turismo", "Turismo"],
];

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

  async getDashboard(filters) {
    const cacheKey = `dashboard:${filters.from.toISOString()}:${filters.toExclusive.toISOString()}:${filters.regionId ?? "all"}`;
    return this.cached(cacheKey, async () => {
      const [playerData, attempts] = await Promise.all([
        this.repository.getOverview(),
        this.repository.getAttempts(filters),
      ]);
      const passed = attempts.filter((attempt) => attempt.passed).length;
      const correct = attempts.reduce((sum, attempt) => sum + (attempt.correctAnswers ?? 0), 0);
      const incorrect = attempts.reduce((sum, attempt) => sum + (attempt.incorrectAnswers ?? 0), 0);
      const scorePercent = attempts.reduce((sum, attempt) => {
        return sum + (attempt.maxScore > 0 ? attempt.score * 100 / attempt.maxScore : 0);
      }, 0);
      const activePlayers = new Set(attempts.map((attempt) => attempt.playerId).filter(Boolean));

      const overview = {
        generatedAt: new Date().toISOString(),
        players: {
          total: playerData.totalPlayers,
          whoPlayed: playerData.playersWhoPlayed,
          activeInPeriod: activePlayers.size,
          whoOnlyOpened: Math.max(0, playerData.totalPlayers - playerData.playersWhoPlayed),
        },
        attempts: {
          total: attempts.length,
          passed,
          failed: attempts.length - passed,
          passRate: percentage(passed, attempts.length),
          accuracyRate: percentage(correct, correct + incorrect),
          performanceIndex: attempts.length ? round(scorePercent / attempts.length) : 0,
          averageDurationSeconds: attempts.length
            ? round(attempts.reduce((sum, attempt) => sum + (attempt.durationSeconds ?? 0), 0) / attempts.length)
            : 0,
          totalCorrectAnswers: correct,
          totalIncorrectAnswers: incorrect,
        },
      };

      const regions = REGIONS.map((region) => {
        const regionAttempts = attempts.filter((attempt) => attempt.regionId === region.id);
        const regionPassed = regionAttempts.filter((attempt) => attempt.passed).length;
        const regionCorrect = regionAttempts.reduce((sum, attempt) => sum + (attempt.correctAnswers ?? 0), 0);
        const regionIncorrect = regionAttempts.reduce((sum, attempt) => sum + (attempt.incorrectAnswers ?? 0), 0);
        const regionScorePercent = regionAttempts.reduce((sum, attempt) => {
          return sum + (attempt.maxScore > 0 ? attempt.score * 100 / attempt.maxScore : 0);
        }, 0);
        return {
          regionId: region.id,
          name: region.name,
          totalAttempts: regionAttempts.length,
          passedAttempts: regionPassed,
          failedAttempts: regionAttempts.length - regionPassed,
          passRate: percentage(regionPassed, regionAttempts.length),
          accuracyRate: percentage(regionCorrect, regionCorrect + regionIncorrect),
          performanceIndex: regionAttempts.length ? round(regionScorePercent / regionAttempts.length) : 0,
        };
      });

      const topicTotals = new Map(TOPICS.map(([id]) => [id, { correctAnswers: 0, incorrectAnswers: 0 }]));
      for (const attempt of attempts) {
        for (const result of attempt.topicResults ?? []) {
          const total = topicTotals.get(result.topicId);
          if (!total) continue;
          total.correctAnswers += result.correctAnswers;
          total.incorrectAnswers += result.incorrectAnswers;
        }
      }
      const topics = TOPICS.map(([id, name]) => {
        const total = topicTotals.get(id);
        const totalAnswers = total.correctAnswers + total.incorrectAnswers;
        const accuracyRate = percentage(total.correctAnswers, totalAnswers);
        return {
          id,
          name,
          correctAnswers: total.correctAnswers,
          incorrectAnswers: total.incorrectAnswers,
          totalAnswers,
          accuracyRate,
          difficultyIndex: totalAnswers ? round(100 - accuracyRate) : null,
        };
      });

      return { generatedAt: overview.generatedAt, overview, regions, topics };
    });
  }

  async getFilteredOverview(filters) {
    return (await this.getDashboard(filters)).overview;
  }

  async getFilteredRegions(filters) {
    const dashboard = await this.getDashboard(filters);
    return { generatedAt: dashboard.generatedAt, regions: dashboard.regions };
  }

  async getTopics(filters) {
    const dashboard = await this.getDashboard(filters);
    return { generatedAt: dashboard.generatedAt, topics: dashboard.topics };
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
