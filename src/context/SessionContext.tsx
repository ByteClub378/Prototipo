import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiPost, ApiError } from "../utils/api";

// Referência pública apenas para diagnóstico — NÃO autentica nada.
// A autenticação real é o cookie HttpOnly, que o JS nunca lê.
const PLAYER_ID_STORAGE_KEY = "aventura-regioes:playerId";

type SessionStatus = "idle" | "loading" | "ready" | "error";

interface BootstrapResponse {
  playerId: string;
  expiresAt: string;
  created: boolean;
}

interface SessionContextValue {
  status: SessionStatus;
  playerId: string | null;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("loading");
      try {
        const result = await apiPost<BootstrapResponse>("/session/bootstrap");
        if (cancelled) return;
        setPlayerId(result.playerId);
        localStorage.setItem(PLAYER_ID_STORAGE_KEY, result.playerId);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        // Por enquanto o app segue funcionando normalmente com o localStorage
        // mesmo se o backend estiver fora do ar — a integração é incremental.
        const message = error instanceof ApiError ? error.message : "Erro ao conectar com o servidor.";
        console.warn("[session] Falha ao iniciar sessão:", message);
        setStatus("error");
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SessionContext.Provider value={{ status, playerId }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession precisa ser usado dentro de SessionProvider");
  }
  return ctx;
}