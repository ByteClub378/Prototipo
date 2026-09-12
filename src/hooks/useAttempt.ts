import { useCallback, useRef } from "react";
import { apiPost, apiPatch, ApiError } from "../utils/api";
import type { RegionId } from "../types";

interface CompleteAttemptPayload {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

interface AttemptCompleteResponse {
  awardedMedals?: unknown[];
}

/**
 * Ciclo de vida de uma tentativa de nível no backend:
 *   startAttempt(levelNumber)  -> POST /attempts (antes do nível começar)
 *   completeAttempt({...})    -> PATCH /attempts/{id}/complete (ao terminar o nível)
 *
 * Se a API falhar (backend fora do ar, rede etc.), o jogo continua funcionando
 * normalmente — só loga um aviso. A integração é incremental: o localStorage
 * ainda é o que mantém a experiência do jogador funcionando de ponta a ponta.
 */
export function useAttempt(regionId: RegionId) {
  const attemptIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startAttempt = useCallback(
    async (levelNumber: number) => {
      const attemptId = crypto.randomUUID();
      attemptIdRef.current = attemptId;
      startTimeRef.current = Date.now();

      try {
        await apiPost("/attempts", { attemptId, regionId, levelNumber });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Erro ao iniciar tentativa.";
        console.warn("[attempts] Falha ao iniciar tentativa:", message);
      }
    },
    [regionId]
  );

  const completeAttempt = useCallback(async (payload: CompleteAttemptPayload) => {
    const attemptId = attemptIdRef.current;
    if (!attemptId) return null;

    const durationSeconds = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : 1;

    try {
      const result = await apiPatch<AttemptCompleteResponse>(`/attempts/${attemptId}/complete`, {
        ...payload,
        durationSeconds,
      });
      return result;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Erro ao concluir tentativa.";
      console.warn("[attempts] Falha ao concluir tentativa:", message);
      return null;
    } finally {
      attemptIdRef.current = null;
      startTimeRef.current = null;
    }
  }, []);

  return { startAttempt, completeAttempt };
}