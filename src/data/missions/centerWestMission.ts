import { shuffle } from "../../utils/random";

export interface CentroOesteMission {
  id: string;
  name: string;
  icon: string;
  biome: "Cerrado" | "Pantanal";
  clue: string;
  fact: string;
  preservationTip: string;
  x: number;
  y: number;
  size: number;
}

export const CENTRO_OESTE_MISSIONS: CentroOesteMission[] = [
  {
    id: "ipe-amarelo",
    name: "Ipê-amarelo florido",
    icon: "🌼",
    biome: "Cerrado",
    clue: "A grande árvore de flores amarelas no meio da savana dourada.",
    fact: "O ipê-amarelo floresce na estação seca e colore o Cerrado quando muitas árvores estão sem folhas.",
    preservationTip: "Não retire flores nem galhos. Ajude a conservar árvores nativas e áreas de Cerrado.",
    x: 50,
    y: 31,
    size: 8,
  },
  {
    id: "lobo-guara",
    name: "Lobo-guará",
    icon: "🐺",
    biome: "Cerrado",
    clue: "Canídeo ruivo de pernas longas, à direita no Cerrado.",
    fact: "O lobo-guará ajuda a espalhar sementes, especialmente as da fruta-do-lobo.",
    preservationTip: "Proteja o Cerrado e nunca ofereça alimentos a animais silvestres.",
    x: 81,
    y: 43,
    size: 7,
  },
  {
    id: "tamandua-bandeira",
    name: "Tamanduá-bandeira",
    icon: "🐾",
    biome: "Cerrado",
    clue: "Animal de focinho comprido e grande cauda escura, perto do centro-direita.",
    fact: "Ele pode consumir milhares de formigas e cupins por dia, ajudando no equilíbrio do ambiente.",
    preservationTip: "Respeite os limites de velocidade em estradas próximas a unidades de conservação.",
    x: 65,
    y: 25,
    size: 8,
  },
  {
    id: "cupinzeiro",
    name: "Cupinzeiro",
    icon: "🪨",
    biome: "Cerrado",
    clue: "Uma torre de terra avermelhada na parte seca do mapa.",
    fact: "Os cupinzeiros reciclam matéria orgânica e ajudam a deixar o solo mais fértil.",
    preservationTip: "Evite pisotear ou destruir cupinzeiros: eles abrigam várias espécies.",
    x: 70,
    y: 55,
    size: 6,
  },
  {
    id: "arara-azul",
    name: "Arara-azul",
    icon: "🦜",
    biome: "Pantanal",
    clue: "Grande ave azul voando sobre o rio, no alto à esquerda.",
    fact: "A arara-azul usa cavidades de árvores para fazer ninhos e se alimenta de frutos de palmeiras.",
    preservationTip: "Combata o tráfico de animais e preserve árvores usadas para alimentação e ninhos.",
    x: 18,
    y: 18,
    size: 8,
  },
  {
    id: "tuiuiu",
    name: "Tuiuiú",
    icon: "🕊️",
    biome: "Pantanal",
    clue: "Ave alta de pescoço preto e vermelho, na margem esquerda do rio.",
    fact: "O tuiuiú é uma das aves-símbolo do Pantanal e pode ultrapassar dois metros de envergadura.",
    preservationTip: "Ajude a manter rios e áreas alagadas livres de lixo e poluição.",
    x: 7,
    y: 62,
    size: 7,
  },
  {
    id: "jacare-do-pantanal",
    name: "Jacaré-do-pantanal",
    icon: "🐊",
    biome: "Pantanal",
    clue: "Réptil escuro quase escondido na água, à esquerda do centro.",
    fact: "O jacaré-do-pantanal controla populações de outros animais e participa do equilíbrio das áreas alagadas.",
    preservationTip: "Observe animais silvestres à distância e nunca tente alimentá-los ou tocá-los.",
    x: 22,
    y: 57,
    size: 8,
  },
  {
    id: "capivara",
    name: "Capivara",
    icon: "🐹",
    biome: "Pantanal",
    clue: "O grupo de grandes roedores marrons na parte inferior esquerda.",
    fact: "A capivara é o maior roedor do mundo e vive sempre perto da água.",
    preservationTip: "Não alimente capivaras e mantenha distância dos grupos e de seus filhotes.",
    x: 14,
    y: 84,
    size: 10,
  },
];

export function createCentroOesteMissionOrder() {
  return shuffle(CENTRO_OESTE_MISSIONS);
}
