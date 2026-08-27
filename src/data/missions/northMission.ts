export interface MissionItem {
  id: string;
  name: string;
  icon: string;
  /** habitat correto do item. null = distrator, não pertence a nenhum ambiente da fase. */
  habitatId: string | null;
  fact: string;
}

export interface Habitat {
  id: string;
  name: string;
  icon: string;
}

export const HABITATS: Habitat[] = [
  { id: "floresta", name: "Floresta Amazônica", icon: "🌲" },
  { id: "rios", name: "Rios do Norte", icon: "🌊" },
];

// Itens principais usados nos níveis de introdução, aleatoriedade e tempo.
export const CORE_ITEMS: MissionItem[] = [
  {
    id: "onca",
    name: "Onça-pintada",
    icon: "🐆",
    habitatId: "floresta",
    fact: "A onça-pintada é o maior felino das Américas e vive nas matas da Amazônia.",
  },
  {
    id: "arara",
    name: "Arara-azul",
    icon: "🦜",
    habitatId: "floresta",
    fact: "A arara-azul vive nas copas das árvores da floresta amazônica.",
  },
  {
    id: "peixe-boi",
    name: "Peixe-boi",
    icon: "🐬",
    habitatId: "rios",
    fact: "O peixe-boi da Amazônia vive nos rios e se alimenta de plantas aquáticas.",
  },
  {
    id: "vitoria-regia",
    name: "Vitória-régia",
    icon: "🌸",
    habitatId: "rios",
    fact: "A vitória-régia é uma planta aquática gigante encontrada nos rios da região Norte.",
  },
];

// Itens extras, usados para dar variedade no desafio final.
export const EXTRA_ITEMS: MissionItem[] = [
  {
    id: "preguica",
    name: "Preguiça",
    icon: "🦥",
    habitatId: "floresta",
    fact: "A preguiça se move bem devagar e vive nas árvores da floresta amazônica.",
  },
  {
    id: "tucano",
    name: "Tucano",
    icon: "🦤",
    habitatId: "floresta",
    fact: "O tucano tem um bico grande e colorido e vive nas árvores da floresta.",
  },
  {
    id: "boto",
    name: "Boto-cor-de-rosa",
    icon: "🐳",
    habitatId: "rios",
    fact: "O boto-cor-de-rosa é um golfinho de água doce que vive nos rios amazônicos.",
  },
  {
    id: "jacare",
    name: "Jacaré-açu",
    icon: "🐊",
    habitatId: "rios",
    fact: "O jacaré-açu é um dos maiores répteis dos rios da Amazônia.",
  },
];

// Distratores: não pertencem a nenhum ambiente da região Norte.
export const DISTRACTOR_ITEMS: MissionItem[] = [
  {
    id: "pinguim",
    name: "Pinguim",
    icon: "🐧",
    habitatId: null,
    fact: "O pinguim vive em regiões geladas, bem diferente da Amazônia quente e úmida.",
  },
  {
    id: "leao",
    name: "Leão",
    icon: "🦁",
    habitatId: null,
    fact: "O leão vive nas savanas da África e não faz parte da fauna brasileira.",
  },
];

export const ALL_ITEMS: MissionItem[] = [...CORE_ITEMS, ...EXTRA_ITEMS, ...DISTRACTOR_ITEMS];

const ITEM_MAP = new Map(ALL_ITEMS.map((item) => [item.id, item]));

export function getItemById(id: string): MissionItem {
  const item = ITEM_MAP.get(id);
  if (!item) throw new Error(`Item de missão não encontrado: ${id}`);
  return item;
}
