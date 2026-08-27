export type LevelMechanic = "direct" | "inverted";

export interface NorthLevelConfig {
  id: number;
  title: string;
  instruction: string;
  bannerIcon: string;
  /** Ids de MissionItem usados neste nível. */
  itemIds: string[];
  /** false = todos os itens aparecem juntos (nível 1). true = um item por vez, em ordem sorteada. */
  sequential: boolean;
  /** Tempo em segundos por item, na ordem de apresentação. Ausente = sem cronômetro. */
  perItemTimers?: number[];
  includeDistractors: boolean;
  mechanic: LevelMechanic;
}

const CORE_IDS = ["onca", "arara", "peixe-boi", "vitoria-regia"];
const DISTRACTOR_IDS = ["pinguim", "leao"];
const FINAL_IDS = ["onca", "arara", "preguica", "tucano", "peixe-boi", "vitoria-regia", "boto", "jacare"];

export const NORTH_LEVELS: NorthLevelConfig[] = [
  {
    id: 1,
    title: "Introdução",
    instruction: "Arraste cada elemento para o ambiente correto. Sem pressa, vamos aprender juntos!",
    bannerIcon: "🌱",
    itemIds: CORE_IDS,
    sequential: false,
    includeDistractors: false,
    mechanic: "direct",
  },
  {
    id: 2,
    title: "Aleatoriedade",
    instruction: "Agora os elementos aparecem um de cada vez, em ordem surpresa!",
    bannerIcon: "🔀",
    itemIds: CORE_IDS,
    sequential: true,
    includeDistractors: false,
    mechanic: "direct",
  },
  {
    id: 3,
    title: "Contra o tempo",
    instruction: "Responda antes que o tempo acabe!",
    bannerIcon: "⏱️",
    itemIds: CORE_IDS,
    sequential: true,
    perItemTimers: [12, 10, 9, 8],
    includeDistractors: false,
    mechanic: "direct",
  },
  {
    id: 4,
    title: "Pegadinhas",
    instruction: "Cuidado! Alguns elementos não pertencem a nenhum ambiente daqui.",
    bannerIcon: "🕵️",
    itemIds: [...CORE_IDS, ...DISTRACTOR_IDS],
    sequential: true,
    perItemTimers: [10, 10, 9, 9, 8, 8],
    includeDistractors: true,
    mechanic: "direct",
  },
  {
    id: 5,
    title: "Desafio surpresa!",
    instruction: "Agora é ao contrário: veja o ambiente e diga se cada animal pertence a ele.",
    bannerIcon: "⚡",
    itemIds: CORE_IDS,
    sequential: true,
    includeDistractors: false,
    mechanic: "inverted",
  },
  {
    id: 6,
    title: "Desafio final",
    instruction: "Combine tudo o que você aprendeu: ordem surpresa, tempo e pegadinhas!",
    bannerIcon: "🏆",
    itemIds: [...FINAL_IDS, ...DISTRACTOR_IDS],
    sequential: true,
    perItemTimers: [10, 9, 9, 8, 8, 7, 7, 7, 6, 6],
    includeDistractors: true,
    mechanic: "direct",
  },
];
