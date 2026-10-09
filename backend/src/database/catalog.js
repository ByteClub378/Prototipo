export const REGIONS = [
  { id: "norte", name: "Norte", sortOrder: 1 },
  { id: "nordeste", name: "Nordeste", sortOrder: 2 },
  { id: "centro-oeste", name: "Centro-Oeste", sortOrder: 3 },
  { id: "sudeste", name: "Sudeste", sortOrder: 4 },
  { id: "sul", name: "Sul", sortOrder: 5 },
];

export const LEVELS = [
  { regionId: "norte", levelNumber: 1, name: "Escolha o ambiente", questionCount: 4, maxScore: 400, minScore: 240 },
  { regionId: "norte", levelNumber: 2, name: "Combina ou não?", questionCount: 4, maxScore: 400, minScore: 240 },
  { regionId: "norte", levelNumber: 3, name: "Desafio relâmpago", questionCount: 5, maxScore: 500, minScore: 300 },
  { regionId: "nordeste", levelNumber: 1, name: "Descoberta", questionCount: 4, maxScore: 400, minScore: 240 },
  { regionId: "nordeste", levelNumber: 2, name: "Explorador", questionCount: 4, maxScore: 400, minScore: 240 },
  { regionId: "nordeste", levelNumber: 3, name: "Desafio relâmpago", questionCount: 4, maxScore: 400, minScore: 240 },
  { regionId: "centro-oeste", levelNumber: 1, name: "Guardiões do Centro-Oeste", questionCount: 8, maxScore: 800, minScore: 0 },
  { regionId: "sudeste", levelNumber: 1, name: "Monte o mapa do Sudeste", questionCount: 8, maxScore: 1000, minScore: 600 },
];

export const MEDALS = [
  { id: "norte-completo", name: "Medalha do Norte", description: "Conclua todos os níveis da região Norte.", regionId: "norte", criterionType: "region_complete" },
  { id: "nordeste-completo", name: "Medalha do Nordeste", description: "Conclua todos os níveis da região Nordeste.", regionId: "nordeste", criterionType: "region_complete" },
  { id: "centro-oeste-completo", name: "Medalha do Centro-Oeste", description: "Encontre as oito descobertas do Centro-Oeste.", regionId: "centro-oeste", criterionType: "region_complete" },
  { id: "sudeste-completo", name: "Medalha do Sudeste", description: "Responda aos desafios e encaixe os quatro estados do Sudeste.", regionId: "sudeste", criterionType: "region_complete" },
];

export const PASSING_PERCENT = 60;

export const minimumScore = (level) =>
  level.minScore ??
  Math.ceil(
    level.maxScore *
      PASSING_PERCENT /
      100,
  );

export const meetsPassingAccuracy = (correctAnswers, incorrectAnswers) => {
  const answered = correctAnswers + incorrectAnswers;
  return answered > 0 && correctAnswers * 100 >= answered * PASSING_PERCENT;
};

export const usesPhaseAccuracy = (regionId) =>
  regionId === "norte" || regionId === "nordeste";

export const levelId = (regionId, levelNumber) => `${regionId}_${levelNumber}`;

export function initialProgress() {
  const now = new Date();
  return {
    regions: Object.fromEntries(REGIONS.map((region) => [region.id, {
      status: region.sortOrder === 1 ? "unlocked" : "locked",
      unlockedAt: region.sortOrder === 1 ? now : null,
      completedAt: null,
    }])),
    levels: Object.fromEntries(LEVELS.map((level) => [levelId(level.regionId, level.levelNumber), {
      status: level.regionId === "norte" && level.levelNumber === 1 ? "unlocked" : "locked",
      bestScore: 0,
      attemptCount: 0,
      unlockedAt: level.regionId === "norte" && level.levelNumber === 1 ? now : null,
      completedAt: null,
    }])),
    medals: {},
  };
}
