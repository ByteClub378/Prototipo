// @vitest-environment jsdom
import { StrictMode, act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "./SessionContext";
import { ScoreProvider, useScore } from "./ScoreContext";
import { useAttempt } from "../hooks/useAttempt";
import { RegionBoundary } from "../components/game/SessionBoundary";
import StartPage from "../pages/Start/StartPage";
import type { GameStateResponse } from "../types/api";
import ScoreDisplay from "../components/game/ScoreDisplay";
let root: Root;
let host: HTMLDivElement;
let session: ReturnType<typeof useSession>;
let score: ReturnType<typeof useScore>;
let attempt: ReturnType<typeof useAttempt>;
const state = (extra: Partial<GameStateResponse> = {}): GameStateResponse => ({
  playerId: "p1", journeyId: "j1", revision: 1, totalScore: 400, hasProgress: true, checkpoints: {}, medals: [],
  progress: { regions: [{ regionId: "norte", name: "Norte", status: "unlocked", unlockedAt: null, completedAt: null }], levels: [] }, ...extra,
});
function Probe() {
  const sessionValue = useSession(); const scoreValue = useScore(); const attemptValue = useAttempt("norte");
  useEffect(() => { session = sessionValue; score = scoreValue; attempt = attemptValue; });
  return <ScoreDisplay />;
}
function mount(path = "/") {
  root.render(<StrictMode><MemoryRouter initialEntries={[path]}><SessionProvider><ScoreProvider><Probe /><Routes>
    <Route path="/" element={<StartPage />} /><Route path="/mapa" element={<p>MAPA CARREGADO</p>} />
    <Route element={<RegionBoundary regionId="bonus" />}><Route path="/missao/bonus" element={<p>BONUS LIBERADO</p>} /></Route>
  </Routes></ScoreProvider></SessionProvider></MemoryRouter></StrictMode>);
}
function setupFetch(options: { failState?: boolean; failCompleteOnce?: boolean; failReset?: boolean; savedTotal?: number; savedScore?: number } = {}) {
  let current = state(); let completedCalls = 0;
  const mock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const path = String(url);
    if (path.endsWith("/session/bootstrap")) return Response.json({ data: { playerId: "p1", created: false, expiresAt: "2026-11-12" } });
    if (path.endsWith("/me/state")) {
      if (options.failState) throw new Error("offline");
      return Response.json({ data: current });
    }
    if (path.endsWith("/me/progress") && init?.method === "DELETE") {
      if (options.failReset) return Response.json({ error: { code: "UNAVAILABLE", message: "Tente novamente" } }, { status: 503 });
      current = state({ journeyId: "j2", totalScore: 0, hasProgress: false, revision: 2 });
      return Response.json({ data: current });
    }
    if (path.endsWith("/attempts")) return Response.json({ data: { runId: "run1" } });
    if (path.endsWith("/complete")) {
      completedCalls += 1;
      if (options.failCompleteOnce && completedCalls === 1) return Response.json({ error: { code: "TEMPORARY", message: "Tente novamente" } }, { status: 500 });
      current = state({ totalScore: options.savedTotal ?? 400, revision: 2 });
      return Response.json({ data: { attemptId: "a1", status: "completed", score: options.savedScore ?? 400, passed: true, minScore: 240, maxScore: 400, revision: 2, idempotent: false, awardedMedals: [] } });
    }
    throw new Error(`Unexpected URL: ${path}`);
  });
  vi.stubGlobal("fetch", mock); return { mock, options };
}
async function settle(action: () => void | Promise<unknown>) { await act(async () => { await action(); }); }
function button(label: string) { const found = [...host.querySelectorAll("button")].find(item => item.textContent?.includes(label)); if (!found) throw new Error(`Missing button ${label}`); return found; }
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await settle(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); localStorage.clear(); });
describe("fluxo da jornada no React", () => {
  it("mostra acertos e erros imediatamente, limita em zero e descarta só a rodada", async () => {
    setupFetch(); await settle(() => mount());
    await settle(() => attempt.startAttempt(1));
    await settle(() => score.addPoints(100));
    expect(host.querySelector('[data-testid="round-score"]')?.textContent).toBe("100");
    expect(host.querySelector('.score-display__delta')?.textContent).toBe("+100");
    await settle(() => score.addPoints(-50));
    expect(host.querySelector('[data-testid="round-score"]')?.textContent).toBe("50");
    expect(host.querySelector('.score-display__delta')?.textContent).toBe("−50");
    await settle(() => { score.addPoints(-50); score.addPoints(-50); });
    expect(score.roundScore).toBe(0);
    await settle(() => score.addPoints(100));
    await settle(() => score.discardRound());
    expect(score.roundScore).toBe(0); expect(score.score).toBe(400); expect(score.lastDelta).toBeNull();
    await settle(() => score.addPoints(100));
    await settle(() => attempt.startAttempt(1));
    expect(score.roundScore).toBe(0); expect(score.score).toBe(400);
  });
  it.each([400, 550])("salva substituindo o total pelo servidor (%s), sem somar a rodada", async (savedTotal) => {
    setupFetch({ savedTotal, savedScore: 150 }); await settle(() => mount());
    await settle(() => attempt.startAttempt(1));
    await settle(() => { score.addPoints(100); score.addPoints(100); });
    await settle(() => attempt.completeAttempt({ score: 200, correctAnswers: 2, incorrectAnswers: 0 }));
    expect(score.roundScore).toBe(150); expect(score.roundSaved).toBe(true);
    expect(host.querySelector('[data-testid="adventure-score"]')?.textContent).toBe(String(savedTotal));
    expect(score.lastDelta).toBeNull();
    await settle(() => attempt.startAttempt(1));
    expect(score.roundScore).toBe(0); expect(score.roundSaved).toBe(false); expect(score.score).toBe(savedTotal);
  });
  it("mantém o resultado provisório quando salvar falha e confirma uma única vez no retry", async () => {
    setupFetch({ failCompleteOnce: true, savedTotal: 700, savedScore: 300 }); await settle(() => mount());
    await settle(() => attempt.startAttempt(1));
    await settle(() => { score.addPoints(100); score.addPoints(100); score.addPoints(100); });
    const payload = { score: 300, correctAnswers: 3, incorrectAnswers: 0 };
    await settle(() => attempt.completeAttempt(payload));
    expect(score.roundScore).toBe(300); expect(score.roundSaved).toBe(false); expect(score.score).toBe(400);
    await settle(() => attempt.completeAttempt(payload));
    expect(score.roundScore).toBe(300); expect(score.roundSaved).toBe(true); expect(score.score).toBe(700);
  });
  it("se a consulta após salvar falhar, sincroniza depois sem reenviar a conclusão", async () => {
    const { mock, options } = setupFetch({ savedTotal: 700 }); await settle(() => mount());
    await settle(() => attempt.startAttempt(1)); options.failState = true;
    await settle(() => score.addPoints(100));
    await settle(() => attempt.completeAttempt({ score: 400, correctAnswers: 4, incorrectAnswers: 0 }));
    expect(score.roundSaved).toBe(true); expect(session.syncPending).toBe(true); expect(score.score).toBe(400);
    options.failState = false; await settle(() => session.refreshState());
    expect(score.score).toBe(700); expect(session.syncPending).toBe(false);
    expect(mock.mock.calls.filter(([url]) => String(url).endsWith("/complete"))).toHaveLength(1);
  });
  it("StrictMode não duplica bootstrap e continuar consulta estado antes do mapa", async () => {
    const { mock } = setupFetch(); await settle(() => mount());
    expect(mock.mock.calls.filter(([url]) => String(url).endsWith("/session/bootstrap"))).toHaveLength(1);
    expect(button("Continuar").disabled).toBe(false);
    await settle(() => button("Continuar").click());
    expect(host.textContent).toContain("MAPA CARREGADO");
    expect(mock.mock.calls.filter(([url]) => String(url).endsWith("/me/state"))).toHaveLength(2);
  });
  it("novo jogo só reinicia após confirmação e usa o estado devolvido no DELETE", async () => {
    const { mock } = setupFetch(); await settle(() => mount());
    await settle(() => button("Novo jogo").click());
    expect(mock.mock.calls.some(([,init]) => init?.method === "DELETE")).toBe(false);
    await settle(() => button("Confirmar nova aventura").click());
    expect(session.gameState?.journeyId).toBe("j2"); expect(score.score).toBe(0);
    expect(host.textContent).toContain("MAPA CARREGADO");
    expect(mock.mock.calls.filter(([url]) => String(url).endsWith("/me/state"))).toHaveLength(1);
  });
  it("falha no reset mantém a jornada e permite tentar novamente", async () => {
    setupFetch({ failReset: true }); await settle(() => mount());
    await settle(() => button("Novo jogo").click()); await settle(() => button("Confirmar nova aventura").click());
    expect(session.gameState?.journeyId).toBe("j1"); expect(score.score).toBe(400);
    expect(host.textContent).not.toContain("MAPA CARREGADO"); expect(host.textContent).toContain("Tente novamente");
  });
  it("continuar não navega quando a consulta falha", async () => {
    const { options } = setupFetch(); await settle(() => mount()); options.failState = true;
    await settle(() => button("Continuar").click());
    expect(host.textContent).not.toContain("MAPA CARREGADO"); expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(session.gameState?.totalScore).toBe(400);
  });
  it("bônus bloqueado redireciona para o mapa", async () => {
    setupFetch(); await settle(() => mount("/missao/bonus"));
    expect(host.textContent).toContain("MAPA CARREGADO"); expect(host.textContent).not.toContain("BONUS LIBERADO");
  });
  it("pontos antigos do navegador não contaminam o total do servidor", async () => {
    localStorage.setItem("aventura-regioes:score", "21000"); setupFetch(); await settle(() => mount());
    expect(score.score).toBe(400); expect(localStorage.getItem("aventura-regioes:score")).toBeNull();
    await settle(() => score.addPoints(100)); expect(score.score).toBe(400);
    await settle(() => score.clearScoreFeedback()); expect(score.score).toBe(400);
  });
  it("retry repete o UUID e o corpo exato e cliques simultâneos compartilham a conclusão", async () => {
    const { mock } = setupFetch({ failCompleteOnce: true }); await settle(() => mount());
    await settle(() => attempt.startAttempt(1));
    const payload = { score: 400, correctAnswers: 4, incorrectAnswers: 0 };
    await settle(() => attempt.completeAttempt(payload));
    await settle(() => Promise.all([attempt.completeAttempt(payload), attempt.completeAttempt(payload)]));
    const requests = mock.mock.calls.filter(([url]) => String(url).endsWith("/complete"));
    expect(requests).toHaveLength(2); expect(requests[1][0]).toBe(requests[0][0]); expect(requests[1][1]?.body).toBe(requests[0][1]?.body);
  });
});
