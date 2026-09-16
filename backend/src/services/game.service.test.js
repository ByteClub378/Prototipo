import { describe, expect, it } from "vitest";
import { completeAttemptSchema, startAttemptSchema } from "./game.service.js";
import { LEVELS, minimumScore } from "../database/catalog.js";

describe("validação de tentativas", () => {
  it("aceita o início de uma tentativa válida", () => {
    expect(startAttemptSchema.parse({
      attemptId: "0f5f49b4-0742-4c3a-8f8b-1a9adf2b5ab1", regionId: "norte", levelNumber: 1,
    }).regionId).toBe("norte");
  });

  it("rejeita região inexistente", () => {
    expect(() => startAttemptSchema.parse({
      attemptId: "0f5f49b4-0742-4c3a-8f8b-1a9adf2b5ab1", regionId: "inexistente", levelNumber: 1,
    })).toThrow();
  });

  it("rejeita pontuação negativa e tentativa sem respostas", () => {
        expect(() => completeAttemptSchema.parse({ regionId: "norte", levelNumber: 1, score: -1, correctAnswers: 0, incorrectAnswers: 0, durationSeconds: 1 })).toThrow();
  });

  it("aceita métricas válidas", () => {
        expect(completeAttemptSchema.parse({ regionId: "norte", levelNumber: 1, score: 80, correctAnswers: 8, incorrectAnswers: 2, durationSeconds: 45 }).score).toBe(80);
  });

  it("aceita os totais completos da fase Nordeste", () => {
    const result = completeAttemptSchema.parse({
      regionId: "nordeste",
      levelNumber: 3,
      score: 250,
      correctAnswers: 3,
      incorrectAnswers: 1,
      missionCorrectAnswers: 8,
      missionIncorrectAnswers: 4,
      durationSeconds: 45,
    });

    expect(result.missionCorrectAnswers).toBe(8);
  });

  it("aceita os totais completos da fase Norte", () => {
    const result = completeAttemptSchema.parse({
      regionId: "norte",
      levelNumber: 3,
      score: 300,
      correctAnswers: 3,
      incorrectAnswers: 2,
      missionCorrectAnswers: 8,
      missionIncorrectAnswers: 5,
      durationSeconds: 45,
    });

    expect(result.missionIncorrectAnswers).toBe(5);
  });

  it("rejeita totais incompletos da missão", () => {
    expect(() => completeAttemptSchema.parse({
      regionId: "nordeste",
      levelNumber: 3,
      score: 250,
      correctAnswers: 3,
      incorrectAnswers: 1,
      missionCorrectAnswers: 8,
      durationSeconds: 45,
    })).toThrow();
  });

  it("calcula aprovação em 60% da pontuação máxima", () => {
    const level = LEVELS.find((item) => item.regionId === "norte" && item.levelNumber === 1);
    expect(minimumScore(level)).toBe(240);
  });
});
