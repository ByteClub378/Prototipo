export const REGIONS = [
  { id: "norte", name: "Norte", sortOrder: 1 },
  { id: "nordeste", name: "Nordeste", sortOrder: 2 },
  { id: "centro-oeste", name: "Centro-Oeste", sortOrder: 3 },
  { id: "sudeste", name: "Sudeste", sortOrder: 4 },
  { id: "sul", name: "Sul", sortOrder: 5 },
];

export const LEVELS = [
  { regionId: "norte", levelNumber: 1, name: "Introdução", maxScore: 400 },
  { regionId: "norte", levelNumber: 2, name: "Aleatoriedade", maxScore: 400 },
  { regionId: "norte", levelNumber: 3, name: "Contra o tempo", maxScore: 400 },
  { regionId: "norte", levelNumber: 4, name: "Pegadinhas", maxScore: 600 },
  { regionId: "norte", levelNumber: 5, name: "Desafio surpresa", maxScore: 400 },
  { regionId: "norte", levelNumber: 6, name: "Desafio final", maxScore: 1000 },
  { regionId: "nordeste", levelNumber: 1, name: "Introdução", maxScore: 400 },
  { regionId: "nordeste", levelNumber: 2, name: "Quiz visual", maxScore: 400 },
  { regionId: "nordeste", levelNumber: 3, name: "Mais alternativas", maxScore: 600 },
  { regionId: "nordeste", levelNumber: 4, name: "Pegadinhas", maxScore: 800 },
  { regionId: "nordeste", levelNumber: 5, name: "Contra o tempo", maxScore: 600 },
  { regionId: "nordeste", levelNumber: 6, name: "Desafio final", maxScore: 900 },
];

export const MEDALS = [
  { id: "norte-completo", name: "Medalha do Norte", description: "Conclua todos os níveis da região Norte.", regionId: "norte", criterionType: "region_complete" },
  { id: "nordeste-completo", name: "Medalha do Nordeste", description: "Conclua todos os níveis da região Nordeste.", regionId: "nordeste", criterionType: "region_complete" },
];

export const PASSING_PERCENT = 60;
export const minimumScore = (level) => Math.ceil(level.maxScore * PASSING_PERCENT / 100);

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
