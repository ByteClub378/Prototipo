import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../database/firebase.js";
import { LEVELS, MEDALS, REGIONS, initialProgress, levelId, minimumScore, meetsPassingAccuracy, usesPhaseAccuracy } from "../database/catalog.js";
import { assertUnlocked, journeyIdOf, newJourney, nextCheckpoint, totalScoreOf, unlock, validateAnswers } from "../domain/journey.js";
import { ApiError } from "../utils/api-error.js";

const date = value => value?.toDate?.() ?? value ?? null;
function normalizedProgress(data) {
  const initial = initialProgress();
  const regions = { ...initial.regions, ...data.regions };
  const levels = { ...initial.levels, ...data.levels };
  for (const region of REGIONS) {
    const id = levelId(region.id, 1);
    if (regions[region.id].status !== "locked" && levels[id].status === "locked") {
      levels[id] = unlock(levels[id], regions[region.id].unlockedAt);
    }
  }
  if (REGIONS.every(region => regions[region.id].status === "completed")) {
    levels.bonus_1 = unlock(levels.bonus_1, null);
  }
  return { regions, levels };
}
function stateOf(data) {
  const { regions, levels } = normalizedProgress(data);
  const serialize = item => ({ ...item, unlockedAt: date(item.unlockedAt), completedAt: date(item.completedAt) });
  return {
    playerId: data.publicId, journeyId: journeyIdOf(data), revision: data.revision ?? 1,
    totalScore: totalScoreOf(levels),
    hasProgress: Object.values(levels).some(level => level.attemptCount > 0 || level.bestScore > 0 || level.status === "completed") || Object.keys(data.medals ?? {}).length > 0 || Object.keys(data.checkpoints ?? {}).length > 0,
    checkpoints: data.checkpoints ?? {},
    progress: {
      regions: REGIONS.map(region => serialize({ regionId: region.id, name: region.name, ...regions[region.id] })),
      levels: LEVELS.map(level => serialize({ ...level, ...levels[levelId(level.regionId, level.levelNumber)] })),
    },
    medals: MEDALS.filter(medal => data.medals?.[medal.id]).map(medal => ({ ...medal, awardedAt: date(data.medals[medal.id].awardedAt) })),
  };
}
export class GameRepository {
  async loadPlayer(playerId) {
    const player = await db.collection("players").doc(playerId).get();
    if (!player.exists) throw new ApiError(401, "SESSION_INVALID", "Jogador da sessão não existe mais.");
    return player;
  }
  async getState(playerId) { return stateOf((await this.loadPlayer(playerId)).data()); }
  async getProgress(playerId) { return (await this.getState(playerId)).progress; }
  async getMedals(playerId) { return (await this.getState(playerId)).medals; }

  async startAttempt(playerId, attemptId, regionId, levelNumber, expectedJourneyId, requestedRunId) {
    const level = LEVELS.find(item => item.regionId === regionId && item.levelNumber === levelNumber);
    if (!level) throw new ApiError(404, "LEVEL_NOT_FOUND", "Nível inexistente.");
    const playerRef = db.collection("players").doc(playerId);
    const attemptRef = db.collection("attempts").doc(attemptId);
    return db.runTransaction(async transaction => {
      const [player, attempt] = await Promise.all([transaction.get(playerRef), transaction.get(attemptRef)]);
      if (!player.exists) throw new ApiError(401, "SESSION_INVALID", "Jogador inexistente.");
      const data = player.data();
      const journeyId = journeyIdOf(data);
      if (expectedJourneyId && expectedJourneyId !== journeyId) throw new ApiError(409, "JOURNEY_CHANGED", "A jornada mudou. Atualize a página.");
      const current = attempt.exists ? attempt.data() : null;
      const id = levelId(regionId, levelNumber);
      if (current) {
        if (current.playerId !== playerId || current.levelId !== id || current.journeyId !== journeyId) throw new ApiError(409, "ATTEMPT_ID_CONFLICT", "Tentativa incompatível.");
        return { attemptId, runId: current.runId, journeyId, status: "accepted", persisted: true, idempotent: true };
      }
      const { levels, regions } = normalizedProgress(data);
      assertUnlocked({ ...data, regions }, levels, regionId, id);
      const checkpoints = { ...data.checkpoints };
      const checkpoint = checkpoints[regionId];
      const continuing = checkpoint && checkpoint.nextLevelNumber === levelNumber && checkpoint.runId === requestedRunId;
      if (levelNumber > 1 && !continuing) throw new ApiError(409, "CHECKPOINT_REQUIRED", "Retome a rodada salva ou comece pela primeira rodada.");
      const now = Timestamp.now();
      const runId = continuing ? checkpoint.runId : randomUUID();
      checkpoints[regionId] = continuing ? checkpoint : { runId, nextLevelNumber: levelNumber, correctAnswers: 0, incorrectAnswers: 0 };
      transaction.create(attemptRef, { playerId, journeyId, runId, regionId, levelNumber, levelId: id, status: "started", startedAt: now });
      transaction.update(playerRef, { checkpoints, revision: (data.revision ?? 1) + 1, lastSeenAt: now });
      return { attemptId, runId, journeyId, status: "accepted", persisted: true, minScore: minimumScore(level), maxScore: level.maxScore, idempotent: false };
    });
  }

  async completeAttempt(playerId, attemptId, input) {
    const playerRef = db.collection("players").doc(playerId);
    const attemptRef = db.collection("attempts").doc(attemptId);
    return db.runTransaction(async transaction => {
      const [player, attempt] = await Promise.all([transaction.get(playerRef), transaction.get(attemptRef)]);
      if (!player.exists) throw new ApiError(401, "SESSION_INVALID", "Jogador inexistente.");
      if (!attempt.exists) throw new ApiError(409, "ATTEMPT_NOT_STARTED", "Inicie uma nova tentativa.");
      const data = player.data();
      const current = attempt.data();
      const id = levelId(input.regionId, input.levelNumber);
      if (current.playerId !== playerId || current.levelId !== id) throw new ApiError(409, "ATTEMPT_ID_CONFLICT", "Tentativa incompatível.");
      if (current.journeyId !== journeyIdOf(data)) throw new ApiError(409, "JOURNEY_CHANGED", "Esta tentativa pertence à jornada anterior.");
      if (current.status === "completed") {
        if (JSON.stringify(current.resultInput) !== JSON.stringify(input)) throw new ApiError(409, "ATTEMPT_ALREADY_COMPLETED", "Resultado já salvo com outros dados.");
        return { ...current.resultResponse, idempotent: true };
      }
      const level = LEVELS.find(item => item.regionId === input.regionId && item.levelNumber === input.levelNumber);
      if (!level) throw new ApiError(404, "LEVEL_NOT_FOUND", "Nível inexistente.");
      validateAnswers(level, input);
      const { regions, levels } = normalizedProgress(data);
      assertUnlocked({ ...data, regions }, levels, input.regionId, id);
      const checkpoints = { ...data.checkpoints };
      const checkpoint = checkpoints[input.regionId];
      if (!checkpoint || checkpoint.runId !== current.runId || checkpoint.nextLevelNumber !== input.levelNumber) throw new ApiError(409, "RUN_CHANGED", "Uma nova tentativa substituiu esta rodada.");
      const correct = checkpoint.correctAnswers + input.correctAnswers;
      const incorrect = checkpoint.incorrectAnswers + input.incorrectAnswers;
      const nextLevel = LEVELS.find(item => item.regionId === input.regionId && item.levelNumber === input.levelNumber + 1);
      const accuracy = usesPhaseAccuracy(input.regionId);
      if (accuracy && !nextLevel && (input.missionCorrectAnswers !== correct || input.missionIncorrectAnswers !== incorrect)) throw new ApiError(400, "MISSION_TOTALS_INVALID", "Os totais devem corresponder às rodadas salvas desta tentativa.");
      const passed = accuracy ? Boolean(nextLevel) || meetsPassingAccuracy(correct, incorrect) : input.score >= minimumScore(level);
      const now = Timestamp.now();
      const before = levels[id];
      levels[id] = { ...before, status: passed ? "completed" : before.status, bestScore: Math.max(before.bestScore, input.score), attemptCount: before.attemptCount + 1, completedAt: passed ? before.completedAt ?? now : before.completedAt };
      const medals = { ...data.medals };
      const awardedMedals = [];
      if (passed && nextLevel) {
        const nextId = levelId(nextLevel.regionId, nextLevel.levelNumber);
        levels[nextId] = unlock(levels[nextId], now);
      } else if (passed && input.regionId !== "bonus") {
        const complete = LEVELS.filter(item => item.regionId === input.regionId).every(item => levels[levelId(item.regionId, item.levelNumber)].status === "completed");
        if (complete) {
          regions[input.regionId] = { ...regions[input.regionId], status: "completed", completedAt: regions[input.regionId].completedAt ?? now };
          const region = REGIONS.find(item => item.id === input.regionId);
          const nextRegion = REGIONS.find(item => item.sortOrder === region.sortOrder + 1);
          if (nextRegion) {
            regions[nextRegion.id] = unlock(regions[nextRegion.id], now);
            const nextId = levelId(nextRegion.id, 1);
            levels[nextId] = unlock(levels[nextId], now);
          }
          for (const medal of MEDALS.filter(item => item.regionId === input.regionId)) {
            if (!medals[medal.id]) { medals[medal.id] = { awardedAt: now }; awardedMedals.push(medal.id); }
          }
          if (REGIONS.every(item => regions[item.id].status === "completed")) levels.bonus_1 = unlock(levels.bonus_1, now);
        }
      }
      const next = nextCheckpoint(input.regionId, input.levelNumber, current.runId, correct, incorrect, passed);
      if (next) checkpoints[input.regionId] = next; else delete checkpoints[input.regionId];
      const revision = (data.revision ?? 1) + 1;
      const response = { attemptId, status: "completed", score: input.score, passed, minScore: minimumScore(level), maxScore: level.maxScore, revision, idempotent: false, awardedMedals };
      transaction.update(attemptRef, { ...input, resultInput: input, resultResponse: response, status: "completed", passed, attemptNumber: before.attemptCount + 1, awardedMedals, completedAt: now });
      transaction.update(playerRef, { levels, regions, medals, checkpoints, revision, lastSeenAt: now, hasPlayed: true, firstPlayedAt: data.firstPlayedAt ?? now, completedAttemptCount: (data.completedAttemptCount ?? 0) + 1 });
      return response;
    });
  }

  async resetProgress(playerId) {
    // Mantém tentativas históricas para o painel; troca a jornada atomicamente.
    const ref = db.collection("players").doc(playerId);
    return db.runTransaction(async transaction => {
      const player = await transaction.get(ref);
      if (!player.exists) throw new ApiError(401, "SESSION_INVALID", "Jogador inexistente.");
      const update = newJourney(player.data(), Timestamp.now());
      transaction.update(ref, update);
      return stateOf({ ...player.data(), ...update });
    });
  }
}
