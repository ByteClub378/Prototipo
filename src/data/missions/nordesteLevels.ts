import { NORDESTE_QUESTIONS } from "./nordesteQuestions";
import { shuffle } from "../../utils/random";

export interface NordesteLevelConfig {
  id: number;
  title: string;
  instruction: string;
  bannerIcon: string;
  questionIds: string[];
  optionCount: number;
  durationSeconds: number;
}

export function createNordesteLevels(): NordesteLevelConfig[] {
  const questionIds = shuffle(
    NORDESTE_QUESTIONS.map((question) => question.id),
  );

  return [
    {
      id: 1,
      title: "Descoberta",
      instruction: "Comece com duas alternativas e descubra curiosidades do Nordeste.",
      bannerIcon: "🌞",
      questionIds: questionIds.slice(0, 4),
      optionCount: 4,
      durationSeconds: 15,
    },
    {
      id: 2,
      title: "Explorador",
      instruction: "Agora são três alternativas e menos tempo para responder.",
      bannerIcon: "🧭",
      questionIds: questionIds.slice(4, 8),
      optionCount: 4,
      durationSeconds: 10,
    },
    {
      id: 3,
      title: "Desafio relâmpago",
      instruction: "Quatro alternativas, sete segundos e muita atenção!",
      bannerIcon: "⚡",
      questionIds: questionIds.slice(8, 12),
      optionCount: 4,
      durationSeconds: 7,
    },
  ];
}
