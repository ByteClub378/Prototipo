import { beforeEach, describe, expect, it, vi } from "vitest";
const memory = vi.hoisted(() => ({ docs: new Map(), writes: [] }));
vi.mock("../database/firebase.js", () => {
  const snapshot = ref => ({ exists: memory.docs.has(ref.path), data: () => structuredClone(memory.docs.get(ref.path)) });
  return { db: {
    collection: name => ({ doc: id => ({ path: `${name}/${id}`, get: async () => snapshot({ path: `${name}/${id}` }) }) }),
    runTransaction: async operation => {
      const pending = [];
      const result = await operation({
        get: async ref => snapshot(ref),
        create: (ref, value) => pending.push([ref.path, value, false]),
        update: (ref, value) => pending.push([ref.path, value, true]),
      });
      for (const [path, value, merge] of pending) {
        memory.docs.set(path, { ...(merge ? memory.docs.get(path) : {}), ...structuredClone(value) });
        memory.writes.push(path);
      }
      return result;
    },
  } };
});
import { GameRepository } from "./game.repository.js";
import { initialProgress } from "../database/catalog.js";
const repository = new GameRepository();
const body = (regionId = "norte", levelNumber = 1, extra = {}) => ({ regionId, levelNumber, score: 400, correctAnswers: 4, incorrectAnswers: 0, durationSeconds: 10, ...extra });
async function start(id, level = 1, runId, region = "norte") {
  return repository.startAttempt("p1", id, region, level, "j1", runId);
}
beforeEach(() => {
  memory.docs.clear(); memory.writes = [];
  memory.docs.set("players/p1", { publicId: "public1", journeyId: "j1", revision: 1, ...initialProgress(), checkpoints: {} });
});
describe("jornada persistida", () => {
  it.each([undefined, null])("sempre devolve checkpoints para jogadores legados (%s)", async (checkpoints) => {
    const player = memory.docs.get("players/p1");
    if (checkpoints === undefined) delete player.checkpoints;
    else player.checkpoints = checkpoints;
    const state = await repository.getState("p1");
    expect(JSON.parse(JSON.stringify(state)).checkpoints).toEqual({});
    expect(state.totalScore).toBe(0);
    expect(state.progress.regions[0].status).toBe("unlocked");
  });
  it("recupera progresso e total após concluir uma rodada", async () => {
    await start("a1"); await repository.completeAttempt("p1", "a1", body());
    const state = await repository.getState("p1");
    expect(state.totalScore).toBe(400); expect(state.hasProgress).toBe(true);
    expect(state.checkpoints.norte).toMatchObject({ nextLevelNumber: 2, correctAnswers: 4, incorrectAnswers: 0 });
  });
  it("reenvio idêntico não duplica resultado ou contagem", async () => {
    await start("a1"); await repository.completeAttempt("p1", "a1", body());
    const repeat = await repository.completeAttempt("p1", "a1", body());
    expect(repeat.idempotent).toBe(true);
    expect(memory.docs.get("players/p1").completedAttemptCount).toBe(1);
    expect((await repository.getState("p1")).totalScore).toBe(400);
  });
  it("rejeita reenvio com dados diferentes", async () => {
    await start("a1"); await repository.completeAttempt("p1", "a1", body());
    await expect(repository.completeAttempt("p1", "a1", body("norte", 1, { score: 300 }))).rejects.toMatchObject({ code: "ATTEMPT_ALREADY_COMPLETED" });
  });
  it("novo jogo zera a jornada e preserva as tentativas históricas", async () => {
    await start("a1"); await repository.completeAttempt("p1", "a1", body());
    const reset = await repository.resetProgress("p1");
    expect(reset.journeyId).not.toBe("j1"); expect(reset.totalScore).toBe(0); expect(reset.hasProgress).toBe(false);
    expect(reset.medals).toEqual([]); expect(reset.checkpoints).toEqual({});
    expect(memory.docs.get("attempts/a1").status).toBe("completed");
    expect(reset.progress.regions.filter(region => region.status !== "locked").map(region => region.regionId)).toEqual(["norte"]);
  });
  it("tentativa antiga não altera a jornada nova", async () => {
    await start("a1"); await repository.resetProgress("p1");
    await expect(repository.completeAttempt("p1", "a1", body())).rejects.toMatchObject({ code: "JOURNEY_CHANGED" });
    expect((await repository.getState("p1")).totalScore).toBe(0);
  });
  it("valida bloqueio no início e no bônus", async () => {
    await expect(start("a1", 1, undefined, "sul")).rejects.toMatchObject({ code: "LEVEL_LOCKED" });
    await expect(start("a2", 1, undefined, "bonus")).rejects.toMatchObject({ code: "LEVEL_LOCKED" });
  });
  it("não permite concluir sem iniciar", async () => {
    await expect(repository.completeAttempt("p1", "missing", body())).rejects.toMatchObject({ code: "ATTEMPT_NOT_STARTED" });
  });
  it("reconstitui os totais da missão a partir das rodadas salvas", async () => {
    const first = await start("a1"); await repository.completeAttempt("p1", "a1", body());
    await start("a2", 2, first.runId); await repository.completeAttempt("p1", "a2", body("norte", 2));
    await start("a3", 3, first.runId);
    await expect(repository.completeAttempt("p1", "a3", body("norte", 3, { score: 500, correctAnswers: 5, missionCorrectAnswers: 5, missionIncorrectAnswers: 0 }))).rejects.toMatchObject({ code: "MISSION_TOTALS_INVALID" });
    const result = await repository.completeAttempt("p1", "a3", body("norte", 3, { score: 500, correctAnswers: 5, missionCorrectAnswers: 13, missionIncorrectAnswers: 0 }));
    expect(result.passed).toBe(true); expect(result.awardedMedals).toEqual(["norte-completo"]);
  });
  it("repetir Norte mantém Nordeste e seu nível inicial concluídos", async () => {
    const player = memory.docs.get("players/p1");
    player.regions.nordeste.status = "completed"; player.levels.nordeste_1.status = "completed";
    const first = await start("a1"); await repository.completeAttempt("p1", "a1", body());
    await start("a2", 2, first.runId); await repository.completeAttempt("p1", "a2", body("norte", 2));
    await start("a3", 3, first.runId); await repository.completeAttempt("p1", "a3", body("norte", 3, { score: 500, correctAnswers: 5, missionCorrectAnswers: 13, missionIncorrectAnswers: 0 }));
    const state = await repository.getState("p1");
    expect(state.progress.regions.find(region => region.regionId === "nordeste").status).toBe("completed");
    expect(state.progress.levels.find(level => level.regionId === "nordeste" && level.levelNumber === 1).status).toBe("completed");
  });
  it("replay pior não diminui a melhor pontuação consolidada", async () => {
    await start("a1"); await repository.completeAttempt("p1", "a1", body());
    await start("a2"); await repository.completeAttempt("p1", "a2", body("norte", 1, { score: 250, correctAnswers: 3, incorrectAnswers: 1 }));
    expect((await repository.getState("p1")).totalScore).toBe(400);
  });
  it("outro jogador não pode concluir a tentativa", async () => {
    await start("a1"); memory.docs.set("players/p2", { publicId: "public2", journeyId: "j1", revision: 1, ...initialProgress(), checkpoints: {} });
    await expect(repository.completeAttempt("p2", "a1", body())).rejects.toMatchObject({ code: "ATTEMPT_ID_CONFLICT" });
  });
  it("rejeita tentativa supersedida por outra aba", async () => {
    await start("a1"); await start("a2");
    await expect(repository.completeAttempt("p1", "a1", body())).rejects.toMatchObject({ code: "RUN_CHANGED" });
  });
  it("persiste bônus e retoma o próximo tabuleiro", async () => {
    const player = memory.docs.get("players/p1");
    for (const region of Object.values(player.regions)) region.status = "completed";
    await start("b1", 1, undefined, "bonus");
    const result = await repository.completeAttempt("p1", "b1", body("bonus", 1, { score: 800, correctAnswers: 8, incorrectAnswers: 3 }));
    expect(result.passed).toBe(true);
    const state = await repository.getState("p1");
    expect(state.totalScore).toBe(800); expect(state.checkpoints.bonus.nextLevelNumber).toBe(2);
    await expect(start("b2", 2, state.checkpoints.bonus.runId, "bonus")).resolves.toMatchObject({ status: "accepted" });
  });
  it("mantém jogadores antigos sem migração destrutiva", async () => {
    const player = memory.docs.get("players/p1"); delete player.journeyId; delete player.checkpoints;
    expect((await repository.getState("p1")).journeyId).toBe("legacy");
    await expect(repository.startAttempt("p1", "a1", "norte", 1, "legacy")).resolves.toMatchObject({ persisted: true });
  });
});
