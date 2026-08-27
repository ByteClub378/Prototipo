import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { RegionId, RegionStatus } from "../types";
import { REGIONS } from "../data/regions/regions";

const STORAGE_KEY = "aventura-regioes:progress";

type ProgressMap = Record<RegionId, RegionStatus>;

function buildInitialProgress(): ProgressMap {
  const sorted = [...REGIONS].sort((a, b) => a.order - b.order);
  const map = {} as ProgressMap;
  sorted.forEach((region, index) => {
    map[region.id] = index === 0 ? "unlocked" : "locked";
  });
  return map;
}

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialProgress();
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return buildInitialProgress();
  }
}

interface ProgressContextValue {
  progress: ProgressMap;
  bonusUnlocked: boolean;
  completeRegion: (id: RegionId) => void;
  getStatus: (id: RegionId) => RegionStatus;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined
);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const sortedRegions = [...REGIONS].sort((a, b) => a.order - b.order);

  function completeRegion(id: RegionId) {
    setProgress((prev) => {
      const next: ProgressMap = { ...prev, [id]: "completed" };

      const currentIndex = sortedRegions.findIndex((r) => r.id === id);
      const nextRegion = sortedRegions[currentIndex + 1];
      if (nextRegion && next[nextRegion.id] === "locked") {
        next[nextRegion.id] = "unlocked";
      }

      return next;
    });
  }

  function getStatus(id: RegionId): RegionStatus {
    return progress[id] ?? "locked";
  }

  function resetProgress() {
    const fresh = buildInitialProgress();
    setProgress(fresh);
  }

  const bonusUnlocked = sortedRegions.every(
    (region) => progress[region.id] === "completed"
  );

  return (
    <ProgressContext.Provider
      value={{ progress, bonusUnlocked, completeRegion, getStatus, resetProgress }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress precisa ser usado dentro de ProgressProvider");
  }
  return ctx;
}
