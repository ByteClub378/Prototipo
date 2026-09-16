import { describe, expect, it } from "vitest";
import { normalizeNordesteQuestions } from "./nordesteQuestions";

describe("normalizeNordesteQuestions", () => {
  it("should always produce exactly 4 options per question", () => {
    const sampleQuestions: Parameters<typeof normalizeNordesteQuestions>[0] = [
      {
        id: "q1",
        category: "Geografia",
        state: "Nordeste",
        icon: "🌵",
        prompt: "Pergunta de teste",
        fact: "Fato de teste",
        options: [
          { id: "a", text: "Correta", correct: true },
          { id: "b", text: "Errada 1", correct: false },
        ],
      },
      {
        id: "q2",
        category: "Culinária",
        state: "Bahia",
        icon: "🥘",
        prompt: "Outra pergunta",
        fact: "Outro fato",
        options: [
          { id: "c", text: "Correta", correct: true },
          { id: "d", text: "Errada 1", correct: false },
          { id: "e", text: "Errada 2", correct: false },
          { id: "f", text: "Errada 3", correct: false },
          { id: "g", text: "Errada 4", correct: false },
        ],
      },
    ];

    const normalized = normalizeNordesteQuestions(sampleQuestions);

    normalized.forEach((question) => {
      expect(question.options).toHaveLength(4);
      expect(question.options.filter((option) => option.correct)).toHaveLength(1);
    });
  });
});
