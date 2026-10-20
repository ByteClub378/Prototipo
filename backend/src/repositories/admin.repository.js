import { AggregateField, Timestamp } from "firebase-admin/firestore";
import { db } from "../database/firebase.js";
import { LEVELS, REGIONS, TOPICS, levelId } from "../database/catalog.js";

const value = (data, field) => data[field] ?? 0;

const applyDateRange = (query, field, filters = {}) => {
  let result = query;
  if (filters.fromDate) result = result.where(field, ">=", Timestamp.fromDate(filters.fromDate));
  if (filters.toExclusiveDate) result = result.where(field, "<", Timestamp.fromDate(filters.toExclusiveDate));
  return result;
};

const applyAttemptFilters = (query, filters = {}) => {
  let result = query;
  if (filters.regionId) result = result.where("regionId", "==", filters.regionId);
  return applyDateRange(result, "completedAt", filters);
};

const attemptAggregates = async (query) => {
  const [mainSnapshot, normalizedScoreSnapshot] = await Promise.all([
    query.aggregate({
  total: AggregateField.count(),
  averageScore: AggregateField.average("score"),
  averageDurationSeconds: AggregateField.average("durationSeconds"),
  totalCorrectAnswers: AggregateField.sum("correctAnswers"),
  totalIncorrectAnswers: AggregateField.sum("incorrectAnswers"),
    }).get(),
    query.aggregate({ averageScorePercent: AggregateField.average("scorePercent") }).get(),
  ]);
  return { ...mainSnapshot.data(), ...normalizedScoreSnapshot.data() };
};

const attemptMetrics = async (query) => {
  const [data, passedSnapshot] = await Promise.all([
    attemptAggregates(query),
    query.where("passed", "==", true).count().get(),
  ]);
  return {
    totalAttempts: value(data, "total"),
    passedAttempts: passedSnapshot.data().count,
    averageScore: value(data, "averageScore"),
    averageScorePercent: value(data, "averageScorePercent"),
    averageDurationSeconds: value(data, "averageDurationSeconds"),
    totalCorrectAnswers: value(data, "totalCorrectAnswers"),
    totalIncorrectAnswers: value(data, "totalIncorrectAnswers"),
  };
};

export class AdminRepository {
  async getOverview(filters = {}) {
    const attemptsQuery = applyAttemptFilters(db.collection("attempts"), filters);
    const activePlayersQuery = applyDateRange(db.collection("players").where("hasPlayed", "==", true), "lastSeenAt", filters);
    const [playersSnapshot, playersWhoPlayedSnapshot, activePlayersSnapshot, attempts] = await Promise.all([
      db.collection("players").count().get(),
      db.collection("players").where("hasPlayed", "==", true).count().get(),
      activePlayersQuery.count().get(),
      attemptMetrics(attemptsQuery),
    ]);
    return {
      totalPlayers: playersSnapshot.data().count,
      playersWhoPlayed: playersWhoPlayedSnapshot.data().count,
      activePlayers: activePlayersSnapshot.data().count,
      ...attempts,
    };
  }

  async getLevels(filters = {}) {
    const levels = filters.regionId ? LEVELS.filter((level) => level.regionId === filters.regionId) : LEVELS;
    return Promise.all(levels.map(async (level) => {
      let query = db.collection("attempts").where("levelId", "==", levelId(level.regionId, level.levelNumber));
      query = applyDateRange(query, "completedAt", filters);
      return { ...level, ...await attemptMetrics(query) };
    }));
  }

  async getTrends(intervals, regionId) {
    return Promise.all(intervals.map(async (interval) => {
      const metrics = await attemptMetrics(applyAttemptFilters(db.collection("attempts"), {
        regionId,
        fromDate: interval.fromDate,
        toExclusiveDate: interval.toExclusiveDate,
      }));
      return { date: interval.date, ...metrics };
    }));
  }

  async getTopics(filters = {}) {
    return Promise.all(TOPICS.map(async (topic) => {
      const alias = topic.id.replaceAll("-", "_");
      const snapshot = await applyAttemptFilters(db.collection("attempts"), filters).aggregate({
        [`${alias}_correct`]: AggregateField.sum(`topicStats.${topic.id}.correctAnswers`),
        [`${alias}_incorrect`]: AggregateField.sum(`topicStats.${topic.id}.incorrectAnswers`),
      }).get();
      const data = snapshot.data();
      return {
        ...topic,
        correctAnswers: value(data, `${alias}_correct`),
        incorrectAnswers: value(data, `${alias}_incorrect`),
      };
    }));
  }

  async getLearningEvolution(filters = {}) {
    const base = applyAttemptFilters(db.collection("attempts"), filters);
    const [firstAttempts, repeatAttempts] = await Promise.all([
      attemptMetrics(base.where("isRepeatAttempt", "==", false)),
      attemptMetrics(base.where("isRepeatAttempt", "==", true)),
    ]);
    return { firstAttempts, repeatAttempts };
  }

  async getScoreDistribution(filters = {}) {
    const base = applyAttemptFilters(db.collection("attempts"), filters);
    const bands = ["0-20", "21-40", "41-60", "61-80", "81-100"];
    return Promise.all(bands.map(async (band) => {
      const query = base.where("scoreBand", "==", band);
      const snapshot = await query.count().get();
      return { band, count: snapshot.data().count };
    }));
  }

  async getRegionCompletions(filters = {}) {
    return Promise.all(REGIONS.map(async (region) => {
      let query = db.collection("players");
      if (filters.fromDate || filters.toExclusiveDate) {
        query = applyDateRange(query, `regions.${region.id}.completedAt`, filters);
      } else {
        query = query.where(`regions.${region.id}.status`, "==", "completed");
      }
      const snapshot = await query.count().get();
      return { regionId: region.id, name: region.name, completedPlayers: snapshot.data().count };
    }));
  }
}
