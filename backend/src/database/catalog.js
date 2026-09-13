export const REGIONS = [
  { id: "norte", name: "Norte", sortOrder: 1 },
  { id: "nordeste", name: "Nordeste", sortOrder: 2 },
  { id: "centro-oeste", name: "Centro-Oeste", sortOrder: 3 },
  { id: "sudeste", name: "Sudeste", sortOrder: 4 },
  { id: "sul", name: "Sul", sortOrder: 5 },
];

export const LEVELS = [
  { regionId: "norte", levelNumber: 1, name: "Introdução", maxScore: 100 },
  { regionId: "norte", levelNumber: 2, name: "Aleatoriedade", maxScore: 100 },
  { regionId: "norte", levelNumber: 3, name: "Contra o tempo", maxScore: 100 },
  { regionId: "norte", levelNumber: 4, name: "Pegadinhas", maxScore: 100 },
  { regionId: "norte", levelNumber: 5, name: "Desafio surpresa", maxScore: 100 },
  { regionId: "norte", levelNumber: 6, name: "Desafio final", maxScore: 100 },
];

export const MEDALS = [
  { id: "norte-completo", name: "Medalha do Norte", description: "Conclua todos os níveis da região Norte.", regionId: "norte", criterionType: "region_complete" },
];

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
