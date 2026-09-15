import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiGet, apiPost, ApiError } from "../utils/api";
import type { GameStateResponse } from "../types/api";

// Referência pública apenas para diagnóstico — NÃO autentica nada.
// A autenticação real é o cookie HttpOnly, que o JS nunca lê.
const PLAYER_ID_STORAGE_KEY = "aventura-regioes:playerId";
const GAME_STATE_STORAGE_KEY = "aventura-regioes:serverState";

type SessionStatus = "idle" | "loading" | "ready" | "error";

interface BootstrapResponse {
  playerId: string;
  expiresAt: string;
  created: boolean;
}

interface SessionContextValue {
  status: SessionStatus;
  playerId: string | null;
  gameState: GameStateResponse | null;
  refreshState: () => Promise<GameStateResponse | null>;
  retryBootstrap: () => Promise<boolean>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [playerId, setPlayerId] = useState<string | null>(() => localStorage.getItem(PLAYER_ID_STORAGE_KEY));
  const [gameState, setGameState] = useState<GameStateResponse | null>(() => {
    try {
      const cached = localStorage.getItem(GAME_STATE_STORAGE_KEY);
      return cached ? JSON.parse(cached) as GameStateResponse : null;
    } catch {
      return null;
    }
  });

  const saveGameState = useCallback((state: GameStateResponse) => {
    setGameState(state);
    setPlayerId(state.playerId);
    localStorage.setItem(PLAYER_ID_STORAGE_KEY, state.playerId);
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(state));
    return state;
  }, []);

  const fetchState = useCallback(async () => {
    try {
      return await apiGet<GameStateResponse>("/me/state");
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      await apiPost("/session/refresh");
      return apiGet<GameStateResponse>("/me/state");
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const state = await fetchState();
      saveGameState(state);
      setStatus("ready");
      return state;
    } catch (error) {
      console.warn("[session] Erro ao sincronizar progresso:", error);
      setStatus("error");
      return null;
    }
  }, [fetchState, saveGameState]);

  const bootstrapSession = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await apiPost<BootstrapResponse>("/session/bootstrap");
      setPlayerId(result.playerId);
      localStorage.setItem(PLAYER_ID_STORAGE_KEY, result.playerId);
      const state = await fetchState();
      saveGameState(state);
      setStatus("ready");
      return true;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Erro ao conectar com o servidor.";
      console.warn("[session] Falha ao iniciar sessão:", message);
      setStatus("error");
      return false;
    }
  }, [fetchState, saveGameState]);

  useEffect(() => {
    let cancelled = false;

    void bootstrapSession().then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [bootstrapSession]);

  return (
    <SessionContext.Provider value={{ status, playerId, gameState, refreshState, retryBootstrap: bootstrapSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession precisa ser usado dentro de SessionProvider");
  }
  return ctx;
}