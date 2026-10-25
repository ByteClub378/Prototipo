import { z } from "zod";
import { env } from "../config/env.js";
import { REGIONS } from "../database/catalog.js";

const regionIds = REGIONS.map((region) => region.id);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(datePattern, "Use a data no formato YYYY-MM-DD.").optional();

const saoPauloStart = (date) => new Date(`${date}T00:00:00-03:00`);
const dayString = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000);

const buildFilters = (input, defaultDays, maxDays) => {
  if (!input.from && !input.to && !defaultDays) {
    return { from: undefined, to: undefined, fromDate: undefined, toExclusiveDate: undefined, regionId: input.regionId };
  }
  const today = dayString(new Date());
  const to = input.to ?? today;
  const toExclusiveDate = addDays(saoPauloStart(to), 1);
  const from = input.from ?? (defaultDays ? dayString(addDays(toExclusiveDate, -defaultDays)) : undefined);
  const fromDate = from ? saoPauloStart(from) : undefined;
  if (fromDate && (Number.isNaN(fromDate.getTime()) || fromDate >= toExclusiveDate)) throw new Error("DATE_RANGE_INVALID");
  if (fromDate && (toExclusiveDate.getTime() - fromDate.getTime()) / 86_400_000 > maxDays) throw new Error("DATE_RANGE_TOO_LARGE");
  return { from, to, fromDate, toExclusiveDate, regionId: input.regionId };
};

const rawFilterSchema = z.object({
  from: dateField,
  to: dateField,
  regionId: z.enum(regionIds).optional(),
}).strict();

export const statsFilterSchema = rawFilterSchema.transform((input, context) => {
  try { return buildFilters(input, null, 366); }
  catch (error) {
    context.addIssue({ code: "custom", message: error.message === "DATE_RANGE_TOO_LARGE" ? "O período máximo é de 366 dias." : "O período informado é inválido." });
    return z.NEVER;
  }
});

export const trendFilterSchema = rawFilterSchema.transform((input, context) => {
  try { return buildFilters(input, 14, 31); }
  catch (error) {
    context.addIssue({ code: "custom", message: error.message === "DATE_RANGE_TOO_LARGE" ? "Tendências aceitam no máximo 31 dias." : "O período informado é inválido." });
    return z.NEVER;
  }
});

const round = (number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(number) || 0) * factor) / factor;
};
const percentage = (part, total) => total > 0 ? round(part * 100 / total) : 0;
const performanceIndex = (accuracyRate, passRate) => round(accuracyRate * 0.7 + passRate * 0.3);
const filterKey = (filters) => JSON.stringify({ from: filters.from, to: filters.to, regionId: filters.regionId });
const publicPeriod = (filters) => ({ from: filters.from ?? null, to: filters.to ?? null, regionId: filters.regionId ?? null });

const enrichMetrics = (data) => {
  const answered = data.totalCorrectAnswers + data.totalIncorrectAnswers;
  const passRate = percentage(data.passedAttempts, data.totalAttempts);
  const accuracyRate = percentage(data.totalCorrectAnswers, answered);
  return {
    ...data,
    failedAttempts: Math.max(0, data.totalAttempts - data.passedAttempts),
    passRate,
    accuracyRate,
    performanceIndex: performanceIndex(accuracyRate, passRate),
    averageScore: round(data.averageScore),
    averageScorePercent: round(data.averageScorePercent || percentage(data.averageScore, data.maxScore)),
    averageDurationSeconds: round(data.averageDurationSeconds),
  };
};

export class AdminService {
  constructor(repository, cacheTtlSeconds = env.ADMIN_CACHE_TTL_SECONDS, minimumSampleSize = env.PUBLIC_STATS_MIN_SAMPLE_SIZE) {
    this.repository = repository;
    this.cacheTtlMs = cacheTtlSeconds * 1000;
    this.minimumSampleSize = minimumSampleSize;
    this.cache = new Map();
  }

  cached(key, loader) {
    const current = this.cache.get(key);
    if (current && current.expiresAt > Date.now()) return current.promise;
    const promise = Promise.resolve().then(loader).catch((error) => { this.cache.delete(key); throw error; });
    this.cache.set(key, { expiresAt: Date.now() + this.cacheTtlMs, promise });
    return promise;
  }

  envelope(filters, data) {
    return { generatedAt: new Date().toISOString(), cacheTtlSeconds: this.cacheTtlMs / 1000, minimumSampleSize: this.minimumSampleSize, period: publicPeriod(filters), ...data };
  }

  async getOverview(filters = {}) {
    return this.cached(`overview:${filterKey(filters)}`, async () => {
      const raw = await this.repository.getOverview(filters);
      const attempts = enrichMetrics(raw);
      return this.envelope(filters, {
        players: { total: raw.totalPlayers, whoPlayed: raw.playersWhoPlayed, activeInPeriod: raw.activePlayers, whoOnlyOpened: Math.max(0, raw.totalPlayers - raw.playersWhoPlayed) },
        attempts: {
          total: attempts.totalAttempts, passed: attempts.passedAttempts, failed: attempts.failedAttempts,
          passRate: attempts.passRate, accuracyRate: attempts.accuracyRate, performanceIndex: attempts.performanceIndex,
          averageDurationSeconds: attempts.averageDurationSeconds,
          totalCorrectAnswers: attempts.totalCorrectAnswers, totalIncorrectAnswers: attempts.totalIncorrectAnswers,
        },
      });
    });
  }

  async getLevels(filters = {}) {
    return this.cached(`levels:${filterKey(filters)}`, async () => {
      const levels = (await this.repository.getLevels(filters)).map(enrichMetrics);
      const visible = levels.filter((level) => level.totalAttempts >= this.minimumSampleSize);
      return this.envelope(filters, { levels: visible, suppressedLevelCount: levels.length - visible.length, rankings: {
        mostPlayed: [...visible].sort((a, b) => b.totalAttempts - a.totalAttempts),
        bestPerformance: [...visible].sort((a, b) => b.performanceIndex - a.performanceIndex),
        mostDifficult: [...visible].sort((a, b) => a.performanceIndex - b.performanceIndex),
      } });
    });
  }

  async getRegions(filters = {}) {
    const levelData = (await this.repository.getLevels(filters)).map(enrichMetrics);
    const regions = REGIONS.filter((region) => !filters.regionId || region.id === filters.regionId).map((region) => {
      const levels = levelData.filter((level) => level.regionId === region.id);
      const totalAttempts = levels.reduce((sum, level) => sum + level.totalAttempts, 0);
      const passedAttempts = levels.reduce((sum, level) => sum + level.passedAttempts, 0);
      const correct = levels.reduce((sum, level) => sum + level.totalCorrectAnswers, 0);
      const incorrect = levels.reduce((sum, level) => sum + level.totalIncorrectAnswers, 0);
      const passRate = percentage(passedAttempts, totalAttempts);
      const accuracyRate = percentage(correct, correct + incorrect);
      return { regionId: region.id, name: region.name, totalAttempts, passedAttempts, failedAttempts: Math.max(0, totalAttempts - passedAttempts), passRate, accuracyRate, performanceIndex: performanceIndex(accuracyRate, passRate) };
    });
    const visible = regions.filter((region) => region.totalAttempts >= this.minimumSampleSize);
    return this.envelope(filters, { regions: visible, suppressedRegionCount: regions.length - visible.length, rankings: {
      mostPlayed: [...visible].sort((a, b) => b.totalAttempts - a.totalAttempts),
      bestPerformance: [...visible].sort((a, b) => b.performanceIndex - a.performanceIndex),
      mostDifficult: [...visible].sort((a, b) => a.performanceIndex - b.performanceIndex),
    } });
  }

  async getTrends(filters) {
    return this.cached(`trends:${filterKey(filters)}`, async () => {
      const intervals = [];
      for (let cursor = filters.fromDate; cursor < filters.toExclusiveDate; cursor = addDays(cursor, 1)) {
        intervals.push({ date: dayString(cursor), fromDate: cursor, toExclusiveDate: addDays(cursor, 1) });
      }
      const allPoints = (await this.repository.getTrends(intervals, filters.regionId)).map((point) => ({ date: point.date, ...enrichMetrics(point) }));
      const points = allPoints.filter((point) => point.totalAttempts >= this.minimumSampleSize);
      return this.envelope(filters, { interval: "day", points, suppressedPointCount: allPoints.length - points.length });
    });
  }

  async getTopics(filters = {}) {
    return this.cached(`topics:${filterKey(filters)}`, async () => {
      const topics = (await this.repository.getTopics(filters)).map((topic) => {
        const totalAnswers = topic.correctAnswers + topic.incorrectAnswers;
        const accuracyRate = percentage(topic.correctAnswers, totalAnswers);
        return { ...topic, totalAnswers, accuracyRate, difficultyIndex: totalAnswers > 0 ? round(100 - accuracyRate) : null };
      });
      const visible = topics.filter((topic) => topic.totalAnswers >= this.minimumSampleSize);
      return this.envelope(filters, { topics: visible, suppressedTopicCount: topics.length - visible.length, rankings: {
        bestDeveloped: [...visible].sort((a, b) => b.accuracyRate - a.accuracyRate),
        needsReinforcement: [...visible].sort((a, b) => a.accuracyRate - b.accuracyRate),
      } });
    });
  }

  async getDifficulties(filters = {}) {
    const levelData = await this.getLevels(filters);
    const maximumDuration = Math.max(0, ...levelData.levels.map((level) => level.averageDurationSeconds));
    const levels = levelData.levels.filter((level) => level.totalAttempts > 0).map((level) => {
      const failureRate = 100 - level.passRate;
      const errorRate = 100 - level.accuracyRate;
      const timePressure = maximumDuration > 0 ? percentage(level.averageDurationSeconds, maximumDuration) : 0;
      return { ...level, difficultyIndex: round(failureRate * 0.5 + errorRate * 0.35 + timePressure * 0.15) };
    }).sort((a, b) => b.difficultyIndex - a.difficultyIndex);
    return this.envelope(filters, { formula: { failureRate: 0.5, errorRate: 0.35, relativeDuration: 0.15 }, levels });
  }

  async getLearningEvolution(filters = {}) {
    return this.cached(`learning:${filterKey(filters)}`, async () => {
      const raw = await this.repository.getLearningEvolution(filters);
      const firstAttempts = enrichMetrics(raw.firstAttempts);
      const repeatAttempts = enrichMetrics(raw.repeatAttempts);
      if (firstAttempts.totalAttempts < this.minimumSampleSize || repeatAttempts.totalAttempts < this.minimumSampleSize) {
        return this.envelope(filters, { suppressed: true, firstAttempts: null, repeatAttempts: null, evolution: null,
          methodology: "Dados ocultados até que primeiras tentativas e repetições atinjam a amostra mínima." });
      }
      return this.envelope(filters, {
        firstAttempts, repeatAttempts,
        evolution: {
          accuracyGain: round(repeatAttempts.accuracyRate - firstAttempts.accuracyRate),
          passRateGain: round(repeatAttempts.passRate - firstAttempts.passRate),
          performanceIndexGain: round(repeatAttempts.performanceIndex - firstAttempts.performanceIndex),
        },
        methodology: "Compara o grupo de primeiras tentativas com o grupo de repetições; não é uma avaliação individual pareada.",
      });
    });
  }

  async getScoreDistribution(filters = {}) {
    return this.cached(`scores:${filterKey(filters)}`, async () => {
      const bands = await this.repository.getScoreDistribution(filters);
      const total = bands.reduce((sum, band) => sum + band.count, 0);
      if (total < this.minimumSampleSize) return this.envelope(filters, { suppressed: true, totalMeasuredAttempts: 0, bands: [] });
      return this.envelope(filters, { suppressed: false, totalMeasuredAttempts: total, bands: bands.map((band) => ({ ...band, percentage: percentage(band.count, total) })) });
    });
  }

  async getEngagement(filters = {}) {
    return this.cached(`engagement:${filterKey(filters)}`, async () => {
      const [overview, learning, regionCompletions] = await Promise.all([
        this.getOverview(filters), this.getLearningEvolution(filters), this.repository.getRegionCompletions(filters),
      ]);
      const first = learning.firstAttempts?.totalAttempts ?? 0;
      const repeats = learning.repeatAttempts?.totalAttempts ?? 0;
      return this.envelope(filters, {
        players: overview.players,
        attemptsPerActivePlayer: overview.players.activeInPeriod > 0 ? round(overview.attempts.total / overview.players.activeInPeriod) : 0,
        firstAttempts: first,
        repeatAttempts: repeats,
        repeatAttemptRate: percentage(repeats, first + repeats),
        regionCompletions: regionCompletions.filter((region) => region.completedPlayers >= this.minimumSampleSize),
        suppressedRegionCompletionCount: regionCompletions.filter((region) => region.completedPlayers < this.minimumSampleSize).length,
      });
    });
  }
}
