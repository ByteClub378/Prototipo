import { DISTRACTOR_ITEMS, NATIVE_ITEMS } from "./northMission";
import { shuffle } from "../../utils/random";

export interface NorthLevelConfig {
  id: number;
  title: string;
  instruction: string;
  bannerIcon: string;
  itemIds: string[];
  durationSeconds: number;
  includeDistractors: boolean;
  mechanic: "direct" | "inverted";
}

export function createNorthLevels(): NorthLevelConfig[] {
  const nativeIds = shuffle(NATIVE_ITEMS.map((item) => item.id));
  const distractorIds = shuffle(DISTRACTOR_ITEMS.map((item) => item.id));

  return [
    {
      id: 1,
      title: "Escolha o ambiente",
      instruction: "Arraste o cartão ou toque no ambiente correto.",
      bannerIcon: "🌱",
      itemIds: nativeIds.slice(0, 4),
      durationSeconds: 15,
      includeDistractors: false,
      mechanic: "direct",
    },
    {
      id: 2,
      title: "Combina ou não?",
      instruction: "Descubra se o elemento pertence ao ambiente mostrado.",
      bannerIcon: "🔎",
      itemIds: nativeIds.slice(4, 8),
      durationSeconds: 10,
      includeDistractors: false,
      mechanic: "inverted",
    },
    {
      id: 3,
      title: "Desafio relâmpago",
      instruction: "Agora existem pegadinhas. Responda rápido!",
      bannerIcon: "⚡",
      itemIds: shuffle([
        ...nativeIds.slice(8, 11),
        ...distractorIds.slice(0, 2),
      ]),
      durationSeconds: 7,
      includeDistractors: true,
      mechanic: "direct",
    },
  ];
}
