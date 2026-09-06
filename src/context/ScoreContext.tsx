import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "aventura-regioes:score";

interface ScoreContextValue {
  score: number;
  lastDelta: number | null;
  addPoints: (amount: number) => void;
  resetScore: () => void;
}

function loadScore(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

const ScoreContext = createContext<ScoreContextValue | undefined>(undefined);

export function ScoreProvider({ children }: { children: ReactNode }) {
  const [score, setScore] = useState<number>(loadScore);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const deltaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(score));
  }, [score]);

  useEffect(() => {
    return () => {
      if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
    };
  }, []);

  function addPoints(amount: number) {
    if (amount === 0) return;
    setScore((prev) => Math.max(0, prev + amount));

    setLastDelta(amount);
    if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
    deltaTimeoutRef.current = setTimeout(() => setLastDelta(null), 900);
  }

  function resetScore() {
    setScore(0);
    setLastDelta(null);
  }

  return (
    <ScoreContext.Provider value={{ score, lastDelta, addPoints, resetScore }}>
      {children}
    </ScoreContext.Provider>
  );
}

export function useScore() {
  const ctx = useContext(ScoreContext);
  if (!ctx) {
    throw new Error("useScore precisa ser usado dentro de ScoreProvider");
  }
  return ctx;
}