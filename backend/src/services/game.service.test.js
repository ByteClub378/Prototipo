import { describe, expect, it } from "vitest";
import { completeAttemptSchema, startAttemptSchema } from "./game.service.js";

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
    expect(() => completeAttemptSchema.parse({ score: -1, correctAnswers: 0, incorrectAnswers: 0, durationSeconds: 1 })).toThrow();
  });

  it("aceita métricas válidas", () => {
    expect(completeAttemptSchema.parse({ score: 80, correctAnswers: 8, incorrectAnswers: 2, durationSeconds: 45 }).score).toBe(80);
  });
});
