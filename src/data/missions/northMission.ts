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

export const ALL_ITEMS: MissionItem[] = [
  { id: "onca", name: "Onça-pintada", icon: "🐆", habitatId: "floresta", fact: "A onça-pintada é o maior felino das Américas." },
  { id: "arara", name: "Arara-vermelha", icon: "🦜", habitatId: "floresta", fact: "A arara vive e se alimenta nas árvores da floresta." },
  { id: "preguica", name: "Bicho-preguiça", icon: "🦥", habitatId: "floresta", fact: "A preguiça passa grande parte da vida nas árvores." },
  { id: "tucano", name: "Tucano", icon: "🐦", habitatId: "floresta", fact: "O tucano ajuda a espalhar sementes pela floresta." },
  { id: "castanheira", name: "Castanheira", icon: "🌳", habitatId: "floresta", fact: "A castanheira produz a castanha-do-pará." },
  { id: "seringueira", name: "Seringueira", icon: "🌿", habitatId: "floresta", fact: "Da seringueira é extraído o látex." },
  { id: "boto", name: "Boto-cor-de-rosa", icon: "🐬", habitatId: "rios", fact: "O boto-cor-de-rosa é um golfinho de água doce." },
  { id: "peixe-boi", name: "Peixe-boi-da-amazônia", icon: "🐋", habitatId: "rios", fact: "O peixe-boi se alimenta de plantas aquáticas." },
  { id: "jacare", name: "Jacaré-açu", icon: "🐊", habitatId: "rios", fact: "O jacaré-açu vive em rios e lagos amazônicos." },
  { id: "pirarucu", name: "Pirarucu", icon: "🐟", habitatId: "rios", fact: "O pirarucu é um dos maiores peixes de água doce." },
  { id: "vitoria-regia", name: "Vitória-régia", icon: "🌸", habitatId: "rios", fact: "A vitória-régia é uma planta aquática amazônica." },
  { id: "ariranha", name: "Ariranha", icon: "🦦", habitatId: "rios", fact: "A ariranha vive em grupos próximos aos rios." },
  { id: "pinguim", name: "Pinguim", icon: "🐧", habitatId: null, fact: "Pinguins vivem em regiões frias e não são animais amazônicos." },
  { id: "leao", name: "Leão", icon: "🦁", habitatId: null, fact: "O leão é nativo da África e de uma pequena área da Ásia." },
  { id: "camelo", name: "Camelo", icon: "🐫", habitatId: null, fact: "O camelo é adaptado a ambientes secos." },
  { id: "urso-polar", name: "Urso-polar", icon: "🐻‍❄️", habitatId: null, fact: "O urso-polar vive no Ártico." },
];

export const NATIVE_ITEMS = ALL_ITEMS.filter((item) => item.habitatId !== null);
export const DISTRACTOR_ITEMS = ALL_ITEMS.filter((item) => item.habitatId === null);

const ITEM_MAP = new Map(ALL_ITEMS.map((item) => [item.id, item]));

export function getItemById(id: string): MissionItem {
  const item = ITEM_MAP.get(id);
  if (!item) throw new Error(`Item de missão não encontrado: ${id}`);
  return item;
}
