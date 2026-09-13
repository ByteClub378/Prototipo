import { Timestamp } from "firebase-admin/firestore";
import { db } from "../database/firebase.js";
import { LEVELS, MEDALS, REGIONS, initialProgress, levelId } from "../database/catalog.js";
import { ApiError } from "../utils/api-error.js";

const date = (value) => value?.toDate?.() ?? value ?? null;

const lockedLevelProgress = () => ({
  status: "locked",
  bestScore: 0,
  attemptCount: 0,
  unlockedAt: null,
  completedAt: null,
});

const storedRegionProgress = (data, region) => data.regions?.[region.id] ?? {
  status: region.sortOrder === 1 ? "unlocked" : "locked",
  unlockedAt: null,
  completedAt: null,
};

const storedLevelProgress = (data, level) => {
  const stored = data.levels?.[levelId(level.regionId, level.levelNumber)];
  if (stored) return stored;

  const region = data.regions?.[level.regionId];
  const regionIsAvailable = region?.status === "unlocked" || region?.status === "completed";
  const firstLevelIsAvailable = level.levelNumber === 1
    && (level.regionId === "norte" || regionIsAvailable);
  return firstLevelIsAvailable
    ? { ...lockedLevelProgress(), status: "unlocked" }
    : lockedLevelProgress();
};

export class GameRepository {
  async loadPlayer(playerId) {
    const player = await db.collection("players").doc(playerId).get();
    if (!player.exists) throw new ApiError(401, "SESSION_INVALID", "Jogador da sessão não existe mais.");
    return player;
  }

  async getProgress(playerId) {
    const player = await this.loadPlayer(playerId);
    const data = player.data();
    return {
      regions: REGIONS.map((region) => {
        const progress = storedRegionProgress(data, region);
        return { regionId: region.id, name: region.name, ...progress, unlockedAt: date(progress.unlockedAt), completedAt: date(progress.completedAt) };
      }),
      levels: LEVELS.map((level) => {
        const progress = storedLevelProgress(data, level);
        return { ...level, ...progress, unlockedAt: date(progress.unlockedAt), completedAt: date(progress.completedAt) };
      }),
    };
  }

  async getState(playerId) {
    const player = await this.loadPlayer(playerId);
    const data = player.data();
    const progress = {
      regions: REGIONS.map((region) => {
        const item = storedRegionProgress(data, region);
        return { regionId: region.id, name: region.name, ...item, unlockedAt: date(item.unlockedAt), completedAt: date(item.completedAt) };
      }),
      levels: LEVELS.map((level) => {
        const item = storedLevelProgress(data, level);
        return { ...level, ...item, unlockedAt: date(item.unlockedAt), completedAt: date(item.completedAt) };
      }),
    };
    const medals = MEDALS.filter((medal) => data.medals?.[medal.id]).map((medal) => ({ ...medal, awardedAt: date(data.medals[medal.id].awardedAt) }));
    return { playerId: data.publicId, revision: data.revision ?? 1, progress, medals };
  }

  async startAttempt(playerId, attemptId, regionId, levelNumber) {
    const level = LEVELS.find((item) => item.regionId === regionId && item.levelNumber === levelNumber);
    if (!level) throw new ApiError(404, "LEVEL_NOT_FOUND", "Nível inexistente ou indisponível.");
    return { attemptId, status: "accepted", minScore: level.minScore, maxScore: level.maxScore, persisted: false, idempotent: true };
  }

  async completeAttempt(playerId, attemptId, input) {
    const playerRef = db.collection("players").doc(playerId);
    const attemptRef = db.collection("attempts").doc(attemptId);
    return db.runTransaction(async (transaction) => {
      const [player, attempt] = await Promise.all([transaction.get(playerRef), transaction.get(attemptRef)]);
      if (!player.exists) throw new ApiError(401, "SESSION_INVALID", "Jogador da sessão não existe mais.");
      const current = attempt.exists ? attempt.data() : null;
      if (current && current.playerId !== playerId) throw new ApiError(409, "ATTEMPT_ID_CONFLICT", "O identificador da tentativa já está em uso.");
      const requestedLevelId = levelId(input.regionId, input.levelNumber);
      if (current && current.levelId !== requestedLevelId) throw new ApiError(409, "ATTEMPT_ID_CONFLICT", "A tentativa pertence a outro nível.");
      const level = LEVELS.find((item) => item.regionId === input.regionId && item.levelNumber === input.levelNumber);
      if (!level) throw new ApiError(404, "LEVEL_NOT_FOUND", "Nível inexistente ou indisponível.");
      if (input.score > level.maxScore) throw new ApiError(400, "SCORE_OUT_OF_RANGE", `A pontuação máxima deste nível é ${level.maxScore}.`);
      const score = Math.max(0, input.score);
      if (current?.status === "completed") {
        const differs = current.score !== score || current.correctAnswers !== input.correctAnswers || current.incorrectAnswers !== input.incorrectAnswers || current.durationSeconds !== input.durationSeconds;
        if (differs) throw new ApiError(409, "ATTEMPT_ALREADY_COMPLETED", "A tentativa já foi concluída com outros dados.");
        return { attemptId, status: "completed", score: current.score, passed: current.passed ?? current.score >= level.minScore, minScore: level.minScore, maxScore: level.maxScore, idempotent: true };
      }
      const data = player.data();
      const now = Timestamp.now();
      const progress = { ...data.levels };
      const currentProgress = progress[requestedLevelId] ?? storedLevelProgress(data, level);
      if (currentProgress.status === "locked") throw new ApiError(403, "LEVEL_LOCKED", "Este nível ainda está bloqueado.");
      const attemptNumber = currentProgress.attemptCount + 1;
      const passed = score >= level.minScore;
      progress[requestedLevelId] = { ...currentProgress, status: passed ? "completed" : currentProgress.status, attemptCount: attemptNumber, bestScore: Math.max(currentProgress.bestScore, score), completedAt: passed ? currentProgress.completedAt ?? now : currentProgress.completedAt };
      const nextLevel = LEVELS.find((item) => item.regionId === input.regionId && item.levelNumber === input.levelNumber + 1);
      const regions = { ...data.regions };
      const medals = { ...(data.medals ?? {}) };
      const awardedMedals = [];
      if (passed && nextLevel) {
        const id = levelId(nextLevel.regionId, nextLevel.levelNumber);
        const nextProgress = progress[id] ?? lockedLevelProgress();
        progress[id] = { ...nextProgress, status: nextProgress.status === "locked" ? "unlocked" : nextProgress.status, unlockedAt: nextProgress.unlockedAt ?? now };
      } else if (passed) {
        const complete = LEVELS.filter((item) => item.regionId === input.regionId).every((item) => progress[levelId(item.regionId, item.levelNumber)]?.status === "completed");
        if (complete) {
          regions[input.regionId] = { ...regions[input.regionId], status: "completed", completedAt: regions[input.regionId].completedAt ?? now };
          const region = REGIONS.find((item) => item.id === input.regionId);
          const nextRegion = REGIONS.find((item) => item.sortOrder === region.sortOrder + 1);
          if (nextRegion) {
            regions[nextRegion.id] = { ...regions[nextRegion.id], status: "unlocked", unlockedAt: regions[nextRegion.id].unlockedAt ?? now };
            const firstNextLevel = LEVELS.find((item) => item.regionId === nextRegion.id && item.levelNumber === 1);
            if (firstNextLevel) {
              const firstNextLevelId = levelId(firstNextLevel.regionId, firstNextLevel.levelNumber);
              const firstNextProgress = progress[firstNextLevelId] ?? lockedLevelProgress();
              progress[firstNextLevelId] = { ...firstNextProgress, status: firstNextProgress.status === "locked" ? "unlocked" : firstNextProgress.status, unlockedAt: firstNextProgress.unlockedAt ?? now };
            }
          }
          for (const medal of MEDALS.filter((item) => item.regionId === input.regionId && item.criterionType === "region_complete")) {
            if (!medals[medal.id]) { medals[medal.id] = { awardedAt: now }; awardedMedals.push(medal.id); }
          }
        }
      }
      const attemptData = { ...input, score, playerId, levelId: requestedLevelId, attemptNumber, status: "completed", passed, startedAt: now, completedAt: now };
      if (attempt.exists) transaction.update(attemptRef, attemptData); else transaction.create(attemptRef, attemptData);
      transaction.update(playerRef, { levels: progress, regions, medals, revision: (data.revision ?? 1) + 1, lastSeenAt: now });
      return { attemptId, status: "completed", score, passed, minScore: level.minScore, maxScore: level.maxScore, revision: (data.revision ?? 1) + 1, idempotent: false, awardedMedals };
    });
  }

  async getMedals(playerId) {
    const player = await this.loadPlayer(playerId);
    const medals = player.data().medals ?? {};
    return MEDALS.filter((medal) => medals[medal.id]).map((medal) => ({ ...medal, awardedAt: date(medals[medal.id].awardedAt) }));
  }

  async resetProgress(playerId) {
    const attempts = await db.collection("attempts").where("playerId", "==", playerId).get();
    const writer = db.bulkWriter();
    attempts.docs.forEach((doc) => writer.delete(doc.ref));
    await writer.close();
    await db.runTransaction(async (transaction) => {
      const ref = db.collection("players").doc(playerId);
      const player = await transaction.get(ref);
      transaction.update(ref, { ...initialProgress(), revision: (player.data().revision ?? 1) + 1, lastSeenAt: Timestamp.now() });
    });
  }
}
