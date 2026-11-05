import { useCallback, useEffect, useRef, useState } from "react";
import { apiPatch, apiPost, ApiError } from "../utils/api";
import { useSession } from "../context/SessionContext";
import { useScore } from "../context/ScoreContext";
import type { TopicResult } from "../utils/topicResults";
import type { RegionId } from "../types";
type AttemptRegion = RegionId | "bonus";
interface CompleteAttemptPayload {
  score: number; correctAnswers: number; incorrectAnswers: number;
  missionCorrectAnswers?: number; missionIncorrectAnswers?: number; topicResults?: TopicResult[];
}
interface StoredCompleteAttempt {
  attemptId: string;
  body: CompleteAttemptPayload & { regionId: AttemptRegion; levelNumber: number; durationSeconds: number };
}
export interface AttemptCompleteResponse {
  attemptId: string; status: "completed"; score: number; passed: boolean;
  minScore: number; maxScore: number; revision: number; idempotent: boolean; awardedMedals: string[];
}
export function useAttempt(regionId: AttemptRegion) {
  const { gameState, refreshState } = useSession();
  const { beginRound, discardRound, confirmRound } = useScore();
  const journeyId = gameState?.journeyId;
  const checkpoint = gameState?.checkpoints?.[regionId];
  const attemptRef = useRef<{ id: string; level: number; startedAt: number } | null>(null);
  const runRef = useRef<string | undefined>(undefined);
  const completionRef = useRef<StoredCompleteAttempt | null>(null);
  const startingRef = useRef(false);
  const completingRef = useRef<Promise<AttemptCompleteResponse | null> | null>(null);
  const currentJourneyRef = useRef(journeyId);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(false);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      discardRound();
    };
  }, [discardRound]);
  useEffect(() => {
    currentJourneyRef.current = journeyId;
    attemptRef.current = null; runRef.current = undefined; completionRef.current = null;
  }, [journeyId]);
  const startAttempt = useCallback(async (levelNumber: number): Promise<boolean> => {
    if (startingRef.current || completingRef.current || !journeyId) return false;
    startingRef.current = true;
    const id = crypto.randomUUID();
    setError(null);
    try {
      const runId = runRef.current ?? (checkpoint?.nextLevelNumber === levelNumber ? checkpoint.runId : undefined);
      const result = await apiPost<{ runId: string }>("/attempts", { attemptId: id, regionId, levelNumber, journeyId, ...(runId ? { runId } : {}) });
      if (!activeRef.current || currentJourneyRef.current !== journeyId) return false;
      runRef.current = result.runId;
      attemptRef.current = { id, level: levelNumber, startedAt: Date.now() };
      completionRef.current = null;
      beginRound();
      await refreshState();
      return true;
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível iniciar. Verifique a conexão.");
      await refreshState();
      return false;
    } finally { startingRef.current = false; }
  }, [beginRound, checkpoint, journeyId, refreshState, regionId]);
  const completeAttempt = useCallback((payload: CompleteAttemptPayload): Promise<AttemptCompleteResponse | null> => {
    if (completingRef.current) return completingRef.current;
    const attempt = attemptRef.current;
    if (!attempt) { setError("Nenhuma tentativa foi iniciada."); return Promise.resolve(null); }
    if (!completionRef.current) completionRef.current = {
      attemptId: attempt.id,
      body: { ...payload, regionId, levelNumber: attempt.level, durationSeconds: Math.max(1, Math.round((Date.now() - attempt.startedAt) / 1000)) },
    };
    const completion = completionRef.current;
    const request = (async () => {
      try {
        const result = await apiPatch<AttemptCompleteResponse>(`/attempts/${completion.attemptId}/complete`, completion.body);
        if (!activeRef.current || currentJourneyRef.current !== journeyId) return null;
        attemptRef.current = null; completionRef.current = null; setError(null);
        // O resultado da rodada substitui o provisório. Só o estado do servidor
        // define o total, que agrega os melhores resultados de cada nível.
        confirmRound(result.score);
        // Se o GET falhar, o resultado já está salvo. O aviso global permite
        // repetir apenas a sincronização, sem reenviar o resultado.
        await refreshState();
        return result;
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Não foi possível salvar. Tente novamente.");
        return null;
      } finally { completingRef.current = null; }
    })();
    completingRef.current = request;
    return request;
  }, [confirmRound, journeyId, refreshState, regionId]);
  return { startAttempt, completeAttempt, error };
}
