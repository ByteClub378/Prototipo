import { z } from "zod";
export const startAttemptSchema = z.object({
    attemptId: z.string().uuid(),
    regionId: z.enum(["norte", "nordeste", "centro-oeste", "sudeste", "sul"]),
    levelNumber: z.number().int().positive().max(100),
}).strict();
export const completeAttemptSchema = z.object({
    score: z.number().int().min(0).max(1_000_000),
    correctAnswers: z.number().int().min(0).max(10_000),
    incorrectAnswers: z.number().int().min(0).max(10_000),
    durationSeconds: z.number().int().min(1).max(86_400),
}).strict().refine((data) => data.correctAnswers + data.incorrectAnswers > 0, {
    message: "A tentativa deve conter ao menos uma resposta.",
});
export class GameService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    getProgress = (playerId) => this.repository.getProgress(playerId);
    getMedals = (playerId) => this.repository.getMedals(playerId);
    startAttempt = (playerId, input) => this.repository.startAttempt(playerId, input.attemptId, input.regionId, input.levelNumber);
    completeAttempt = (playerId, attemptId, input) => this.repository.completeAttempt(playerId, attemptId, input);
    resetProgress = (playerId) => this.repository.resetProgress(playerId);
}
