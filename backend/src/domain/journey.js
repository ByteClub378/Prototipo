import { randomUUID } from "node:crypto";
import { LEVELS, REGIONS, initialProgress } from "../database/catalog.js";
import { ApiError } from "../utils/api-error.js";

export const journeyIdOf = (player) => player.journeyId ?? "legacy";
export const totalScoreOf = (levels) => Object.values(levels).reduce(
  (sum, level) => sum + Math.max(0, Number(level.bestScore) || 0), 0,
);
export function newJourney(player, now) {
  return {
    ...initialProgress(), journeyId: randomUUID(), journeyStartedAt: now,
    checkpoints: {}, revision: (player.revision ?? 1) + 1, lastSeenAt: now,
  };
}
export function assertUnlocked(player, levels, regionId, id) {
  if (regionId === "bonus" && !REGIONS.every(region => player.regions?.[region.id]?.status === "completed")) {
    throw new ApiError(403, "LEVEL_LOCKED", "Complete as cinco regiões antes do bônus.");
  }
  if (!levels[id] || (regionId !== "bonus" && levels[id].status === "locked")) {
    throw new ApiError(403, "LEVEL_LOCKED", "Este nível ainda está bloqueado.");
  }
}
export function unlock(progress, now) {
  return { ...progress, status: progress.status === "locked" ? "unlocked" : progress.status,
    unlockedAt: progress.unlockedAt ?? now };
}
export function validateAnswers(level, input) {
  const answered = input.correctAnswers + input.incorrectAnswers;
  // Norte/Nordeste fazem uma única resolução por pergunta. Nos demais jogos,
  // cliques errados podem se repetir antes de completar o objetivo.
  if (["norte", "nordeste"].includes(level.regionId) && answered !== level.questionCount) {
    throw new ApiError(400, "ANSWER_COUNT_INVALID", "Quantidade de respostas diferente da rodada.");
  }
  if (input.correctAnswers > level.questionCount || input.score > level.maxScore) {
    throw new ApiError(400, "RESULT_OUT_OF_RANGE", "Resultado acima do limite do desafio.");
  }
  if (["centro-oeste", "sudeste", "sul", "bonus"].includes(level.regionId) && input.correctAnswers !== level.questionCount) {
    throw new ApiError(400, "MISSION_INCOMPLETE", "Conclua todos os objetivos antes de salvar.");
  }
  const bonus = level.regionId === "sudeste" ? 200 : 0;
  if (input.score > input.correctAnswers * 100 + bonus) {
    throw new ApiError(400, "SCORE_OUT_OF_RANGE", "Pontuação incompatível com os acertos.");
  }
}
export function nextCheckpoint(regionId, levelNumber, runId, correctAnswers, incorrectAnswers, passed) {
  const next = LEVELS.find(level => level.regionId === regionId && level.levelNumber === levelNumber + 1);
  return next && passed ? {
    runId, nextLevelNumber: next.levelNumber, correctAnswers, incorrectAnswers,
  } : null;
}
