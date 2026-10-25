import { z } from "zod";
export const startAttemptSchema = z.object({
    attemptId: z.string().uuid(),
    regionId: z.enum(["norte", "nordeste", "centro-oeste", "sudeste", "sul"]),
    levelNumber: z.number().int().positive().max(100),
}).strict();
export const completeAttemptSchema = z.object({
    regionId: z.enum(["norte", "nordeste", "centro-oeste", "sudeste", "sul"]),
    levelNumber: z.number().int().positive().max(100),
    score: z.number().int().min(0).max(1_000_000),
    correctAnswers: z.number().int().min(0).max(10_000),
    incorrectAnswers: z.number().int().min(0).max(10_000),
    missionCorrectAnswers: z.number().int().min(0).max(10_000).optional(),
    missionIncorrectAnswers: z.number().int().min(0).max(10_000).optional(),
    topicResults: z.array(z.object({
        topicId: z.enum(["fauna", "flora", "biomas", "clima", "estados-capitais", "cultura", "culinaria", "festas-populares", "historia", "turismo"]),
        correctAnswers: z.number().int().min(0).max(10_000),
        incorrectAnswers: z.number().int().min(0).max(10_000),
    }).strict()).optional(),
    durationSeconds: z.number().int().min(1).max(86_400),
}).strict().refine((data) => data.correctAnswers + data.incorrectAnswers > 0, {
    message: "A tentativa deve conter ao menos uma resposta.",
}).refine((data) =>
    (data.missionCorrectAnswers === undefined) ===
    (data.missionIncorrectAnswers === undefined), {
    message: "Os totais da missão devem ser enviados juntos.",
}).refine((data) => {
    if (data.topicResults === undefined) return true;
    const correctAnswers = data.topicResults.reduce((total, result) => total + result.correctAnswers, 0);
    const incorrectAnswers = data.topicResults.reduce((total, result) => total + result.incorrectAnswers, 0);
    return correctAnswers === data.correctAnswers && incorrectAnswers === data.incorrectAnswers;
}, {
    message: "Os totais por assunto devem corresponder aos totais da tentativa.",
});
export class GameService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    getProgress = (playerId) => this.repository.getProgress(playerId);
    getMedals = (playerId) => this.repository.getMedals(playerId);
    getState = (playerId) => this.repository.getState(playerId);
    startAttempt = (playerId, input) => this.repository.startAttempt(playerId, input.attemptId, input.regionId, input.levelNumber);
    completeAttempt = (playerId, attemptId, input) => this.repository.completeAttempt(playerId, attemptId, input);
    resetProgress = (playerId) => this.repository.resetProgress(playerId);
}
