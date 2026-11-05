import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import StartScreen from "./StartScreen";
export default function StartPage() {
  const navigate = useNavigate();
  const { status, gameState, refreshState, startNewJourney, retryBootstrap, sessionNotice } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const lock = useRef(false);
  async function continueGame() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      const state = await refreshState();
      if (!state) throw new Error("Não foi possível carregar a aventura. Tente novamente.");
      if (!state.hasProgress) throw new Error("Esta sessão ainda não tem progresso. Escolha Começar aventura.");
      navigate("/mapa");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível continuar."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function newGame() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try { await startNewJourney(); setConfirmReset(false); navigate("/mapa"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a nova aventura."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <StartScreen
    onPlay={() => { setError(null); if (gameState?.hasProgress) setConfirmReset(true); else navigate("/mapa"); }}
    onContinue={() => void continueGame()}
    onCredits={() => navigate("/creditos")}
    onRetry={() => void retryBootstrap()}
    hasProgress={status === "ready" && Boolean(gameState?.hasProgress)}
    isLoading={status === "loading" || busy}
    connectionFailed={status === "error"}
    error={error}
    notice={sessionNotice}
    resetConfirmation={confirmReset ? <section className="adventure-start__confirmation" aria-labelledby="reset-title">
      <h2 id="reset-title">Começar uma nova aventura?</h2>
      <p>A nova jornada começa sem pontos e medalhas. Suas tentativas anteriores continuam no histórico do projeto.</p>
      <button type="button" disabled={busy} onClick={() => void newGame()}>Confirmar nova aventura</button>
      <button type="button" disabled={busy} onClick={() => { setConfirmReset(false); setError(null); }}>Manter aventura atual</button>
    </section> : null}
  />;
}
