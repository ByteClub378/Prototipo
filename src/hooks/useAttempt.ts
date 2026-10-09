import { useCallback, useRef, useState } from "react";
import { apiPatch, apiPost, ApiError } from "../utils/api";
import type { RegionId } from "../types";

interface CompleteAttemptPayload {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  missionCorrectAnswers?: number;
  missionIncorrectAnswers?: number;
}

interface StoredCompleteAttempt {
  attemptId: string;
  body: CompleteAttemptPayload & {
    regionId: RegionId;
    levelNumber: number;
    durationSeconds: number;
  };
}

export interface AttemptCompleteResponse {
  attemptId: string;
  status: "completed";
  score: number;
  passed: boolean;
  minScore: number;
  maxScore: number;
  revision: number;
  idempotent: boolean;
  awardedMedals: string[];
}

export function useAttempt(regionId: RegionId) {
  const attemptIdRef = useRef<string | null>(null);
  const levelNumberRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const completionRef = useRef<StoredCompleteAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startAttempt = useCallback(
    async (levelNumber: number): Promise<boolean> => {
      const attemptId = crypto.randomUUID();

      attemptIdRef.current = attemptId;
      levelNumberRef.current = levelNumber;
      startTimeRef.current = Date.now();
      completionRef.current = null;
      setError(null);

      try {
        await apiPost("/attempts", { attemptId, regionId, levelNumber });
        return true;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Erro ao iniciar tentativa.";
        attemptIdRef.current = null;
        levelNumberRef.current = null;
        startTimeRef.current = null;
        completionRef.current = null;
        setError(message);
        console.warn("[attempts] Falha ao validar início:", message);
        return false;
      }
    },
    [regionId]
  );

  const completeAttempt = useCallback(async (payload: CompleteAttemptPayload) => {
    const attemptId = attemptIdRef.current;
    const levelNumber = levelNumberRef.current;
    const startedAt = startTimeRef.current;

    if (!attemptId || !levelNumber) {
      setError("Nenhuma tentativa foi iniciada.");
      console.warn("[attempts] Nenhuma tentativa foi iniciada.");
      return null;
    }

    if (!completionRef.current) {
      const durationSeconds = startedAt
        ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
        : 1;
      completionRef.current = {
        attemptId,
        body: { regionId, levelNumber, ...payload, durationSeconds },
      };
    }

    const completion = completionRef.current;

    try {
      const result = await apiPatch<AttemptCompleteResponse>(
        `/attempts/${completion.attemptId}/complete`,
        completion.body,
      );

      attemptIdRef.current = null;
      levelNumberRef.current = null;
      startTimeRef.current = null;
      completionRef.current = null;
      setError(null);

      return result;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Erro ao concluir tentativa.";
      setError(message);
      console.warn("[attempts] Falha ao concluir tentativa:", message);
      return null;
    }
  }, [regionId]);

  return { startAttempt, completeAttempt, error };
}
