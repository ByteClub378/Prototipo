import { useCallback, useRef } from "react";
import { apiPatch, apiPost, ApiError } from "../utils/api";
import type { RegionId } from "../types";

interface CompleteAttemptPayload {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

interface AttemptCompleteResponse {
  attemptId: string;
  status: "completed";
  score: number;
  revision?: number;
  idempotent: boolean;
  awardedMedals?: string[];
}

export function useAttempt(regionId: RegionId) {
  const attemptIdRef = useRef<string | null>(null);
  const levelNumberRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startAttempt = useCallback(
    async (levelNumber: number) => {
      const attemptId = crypto.randomUUID();

      attemptIdRef.current = attemptId;
      levelNumberRef.current = levelNumber;
      startTimeRef.current = Date.now();

      try {
        await apiPost("/attempts", { attemptId, regionId, levelNumber });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Erro ao iniciar tentativa.";
        console.warn("[attempts] Falha ao validar início:", message);
      }
    },
    [regionId]
  );

  const completeAttempt = useCallback(async (payload: CompleteAttemptPayload) => {
    const attemptId = attemptIdRef.current;
    const levelNumber = levelNumberRef.current;
    const startedAt = startTimeRef.current;

    if (!attemptId || !levelNumber) {
      console.warn("[attempts] Nenhuma tentativa foi iniciada.");
      return null;
    }

    const durationSeconds = startedAt
      ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      : 1;

    try {
      const result = await apiPatch<AttemptCompleteResponse>(`/attempts/${attemptId}/complete`, {
        regionId,
        levelNumber,
        ...payload,
        durationSeconds,
      });

      attemptIdRef.current = null;
      levelNumberRef.current = null;
      startTimeRef.current = null;

      return result;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Erro ao concluir tentativa.";
      console.warn("[attempts] Falha ao concluir tentativa:", message);
      return null;
    }
  }, [regionId]);

  return { startAttempt, completeAttempt };
}