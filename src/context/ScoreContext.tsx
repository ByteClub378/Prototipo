import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useSession } from "./SessionContext";
interface ScoreContextValue {
  score: number;
  roundScore: number;
  roundSaved: boolean;
  lastDelta: number | null;
  feedbackId: number;
  addPoints: (amount: number) => void;
  clearScoreFeedback: () => void;
  beginRound: () => void;
  discardRound: () => void;
  confirmRound: (score: number) => void;
}
interface RoundScore { journeyId: string | undefined; points: number; saved: boolean }
interface ScoreFeedback { journeyId: string | undefined; amount: number; sequence: number }
const ScoreContext = createContext<ScoreContextValue | undefined>(undefined);
export function ScoreProvider({ children }: { children: ReactNode }) {
  const { gameState } = useSession();
  const journeyId = gameState?.journeyId;
  const [feedback, setFeedback] = useState<ScoreFeedback | null>(null);
  const [round, setRound] = useState<RoundScore | null>(null);
  const sequenceRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearScoreFeedback = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setFeedback(null);
  }, []);
  const discardRound = useCallback(() => {
    setRound(null);
    clearScoreFeedback();
  }, [clearScoreFeedback]);
  const beginRound = useCallback(() => {
    setRound({ journeyId, points: 0, saved: false });
    clearScoreFeedback();
  }, [journeyId, clearScoreFeedback]);
  const confirmRound = useCallback((points: number) => {
    setRound({ journeyId, points, saved: true });
    clearScoreFeedback();
  }, [journeyId, clearScoreFeedback]);
  const addPoints = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    setRound(current => ({ journeyId, points: Math.max(0,
      (current && current.journeyId === journeyId ? current.points : 0) + amount), saved: false }));
    sequenceRef.current += 1;
    setFeedback({ journeyId, amount, sequence: sequenceRef.current });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setFeedback(null), 900);
  }, [journeyId]);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  // Uma animação antiga não passa para uma jornada nova.
  const currentFeedback = feedback?.journeyId === journeyId ? feedback : null;
  return <ScoreContext.Provider value={{
    score: gameState?.totalScore ?? 0,
    roundScore: round && round.journeyId === journeyId ? round.points : 0,
    roundSaved: Boolean(round && round.journeyId === journeyId && round.saved),
    lastDelta: currentFeedback?.amount ?? null,
    feedbackId: currentFeedback?.sequence ?? 0,
    addPoints,
    clearScoreFeedback,
    beginRound,
    discardRound,
    confirmRound,
  }}>{children}</ScoreContext.Provider>;
}
export function useScore() {
  const context = useContext(ScoreContext);
  if (!context) throw new Error("useScore precisa de ScoreProvider");
  return context;
}
