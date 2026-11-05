import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { apiDelete, apiGet, apiPost, ApiError } from "../utils/api";
import type { GameStateResponse } from "../types/api";
import { removeStorage } from "../utils/storage";

type SessionStatus = "loading" | "ready" | "error";
interface BootstrapResponse { playerId: string; expiresAt: string; created: boolean }
interface SessionContextValue {
  status: SessionStatus;
  playerId: string | null;
  gameState: GameStateResponse | null;
  syncPending: boolean;
  sessionNotice: string | null;
  refreshState: () => Promise<GameStateResponse | null>;
  retryBootstrap: () => Promise<boolean>;
  startNewJourney: () => Promise<GameStateResponse>;
}
const SessionContext = createContext<SessionContextValue | undefined>(undefined);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const bootstrapRef = useRef<Promise<boolean> | null>(null);
  const epochRef = useRef(0);
  const playerRef = useRef<string | null>(null);
  const acceptedStateRef = useRef<GameStateResponse | null>(null);

  const acceptState = useCallback((response: GameStateResponse) => {
    // APIs antigas podem omitir checkpoints; o contrato interno sempre é um mapa.
    const state = { ...response, checkpoints: response.checkpoints ?? {} };
    const previous = acceptedStateRef.current;
    if (previous?.playerId === state.playerId && previous.revision > state.revision) return previous;
    acceptedStateRef.current = state;
    playerRef.current = state.playerId;
    setGameState(state);
    setStatus("ready");
    setSyncPending(false);
    return state;
  }, []);
  const refreshState = useCallback(async () => {
    const epoch = epochRef.current;
    try {
      const state = await apiGet<GameStateResponse>("/me/state");
      if (epoch !== epochRef.current) return null;
      return acceptState(state);
    } catch (error) {
      if (epoch !== epochRef.current) return null;
      setSyncPending(true);
      if (error instanceof ApiError && error.code === "SESSION_INVALID") {
        // Nunca troca silenciosamente a identidade no meio da partida.
        setStatus("error");
        setSessionNotice("Sua sessão expirou. Reconecte para verificar a aventura disponível. Sem uma conta ou código de recuperação, uma sessão perdida não pode ser restaurada.");
      } else if (!playerRef.current) setStatus("error");
      return null;
    }
  }, [acceptState]);
  const retryBootstrap = useCallback((): Promise<boolean> => {
    if (bootstrapRef.current) return bootstrapRef.current;
    const epoch = ++epochRef.current;
    setStatus("loading");
    const request = (async () => {
      try {
        const session = await apiPost<BootstrapResponse>("/session/bootstrap");
        if (epoch !== epochRef.current) return false;
        if (session.created && playerRef.current) {
          acceptedStateRef.current = null;
          setGameState(null);
          setSessionNotice("Uma nova sessão foi criada. A aventura da sessão anterior não está vinculada a esta sessão.");
        }
        const state = await apiGet<GameStateResponse>("/me/state");
        if (epoch !== epochRef.current) return false;
        acceptState(state);
        return true;
      } catch {
        if (epoch === epochRef.current) setStatus("error");
        return false;
      } finally { bootstrapRef.current = null; }
    })();
    bootstrapRef.current = request;
    return request;
  }, [acceptState]);
  const startNewJourney = useCallback(async () => {
    const epoch = ++epochRef.current;
    const state = await apiDelete<GameStateResponse>("/me/progress", { "X-Confirm-Reset": "RESET" });
    if (epoch !== epochRef.current) throw new Error("A sessão foi alterada. Atualize a página.");
    // O reset retorna o estado inteiro; não depende de um segundo GET.
    acceptState(state);
    setSessionNotice(null);
    return state;
  }, [acceptState]);
  useEffect(() => {
    for (const key of ["aventura-regioes:score", "aventura-regioes:serverState", "aventura-regioes:progress", "aventura-regioes:playerId"]) removeStorage(key);
    void retryBootstrap();
  }, [retryBootstrap]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible" && playerRef.current) void refreshState(); };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [refreshState]);
  return <SessionContext.Provider value={{ status, playerId: gameState?.playerId ?? null, gameState, syncPending, sessionNotice, refreshState, retryBootstrap, startNewJourney }}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession precisa de SessionProvider");
  return context;
}
