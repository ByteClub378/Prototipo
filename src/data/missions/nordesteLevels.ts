export interface NordesteLevelConfig {
  id: number;
  title: string;
  instruction: string;
  bannerIcon: string;
  questionIds: string[];
  /** true = alternativas simples (correta + 1 errada). false = todas as 4. */
  simpleOptions: boolean;
  /** false = ordem fixa das perguntas. true = ordem sorteada a cada tentativa. */
  shuffleQuestions: boolean;
  /** Tempo em segundos por pergunta, na ordem de apresentação. Ausente = sem cronômetro. */
  perQuestionTimers?: number[];
}

const INTRO_IDS = ["tapioca", "acaraje", "renda-de-bilro", "bumba-meu-boi"];
const VISUAL_IDS = ["sao-joao", "frevo", "serra-da-capivara", "mandacaru"];
const FULL_IDS = [
  "tapioca",
  "acaraje",
  "renda-de-bilro",
  "bumba-meu-boi",
  "sao-joao",
  "frevo",
  "serra-da-capivara",
  "mandacaru",
  "cordel",
];

export const NORDESTE_LEVELS: NordesteLevelConfig[] = [
  {
    id: 1,
    title: "Introdução",
    instruction: "Vamos conhecer um pouco do Nordeste com perguntas bem simples!",
    bannerIcon: "🌱",
    questionIds: INTRO_IDS,
    simpleOptions: true,
    shuffleQuestions: false,
  },
  {
    id: 2,
    title: "Quiz visual",
    instruction: "Observe o ícone de cada pergunta e responda em ordem surpresa!",
    bannerIcon: "🖼️",
    questionIds: VISUAL_IDS,
    simpleOptions: true,
    shuffleQuestions: true,
  },
  {
    id: 3,
    title: "Mais alternativas",
    instruction: "Agora com 4 opções para escolher em cada pergunta!",
    bannerIcon: "🔤",
    questionIds: FULL_IDS.slice(0, 6),
    simpleOptions: false,
    shuffleQuestions: true,
  },
  {
    id: 4,
    title: "Pegadinhas",
    instruction: "Cuidado! Algumas alternativas parecem certas, mas são de outras regiões.",
    bannerIcon: "🕵️",
    questionIds: FULL_IDS.slice(0, 8),
    simpleOptions: false,
    shuffleQuestions: true,
  },
  {
    id: 5,
    title: "Contra o tempo",
    instruction: "Responda antes que o tempo acabe!",
    bannerIcon: "⏱️",
    questionIds: FULL_IDS.slice(0, 6),
    simpleOptions: false,
    shuffleQuestions: true,
    perQuestionTimers: [15, 13, 12, 11, 10, 10],
  },
  {
    id: 6,
    title: "Desafio final",
    instruction: "Combine tudo o que você aprendeu sobre o Nordeste!",
    bannerIcon: "🏆",
    questionIds: FULL_IDS,
    simpleOptions: false,
    shuffleQuestions: true,
    perQuestionTimers: [12, 11, 11, 10, 10, 9, 9, 9, 8, 8],
  },
];