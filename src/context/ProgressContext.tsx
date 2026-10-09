import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { RegionId, RegionStatus } from "../types";
import { REGIONS } from "../data/regions/regions";
import { apiDelete } from "../utils/api";
import { useSession } from "./SessionContext";

type ProgressMap = Record<RegionId, RegionStatus>;

function buildInitialProgress(): ProgressMap {
  const sorted = [...REGIONS].sort((a, b) => a.order - b.order);
  const map = {} as ProgressMap;
  sorted.forEach((region, index) => {
    map[region.id] = index === 0 ? "unlocked" : "locked";
  });
  return map;
}

interface ProgressContextValue {
  progress: ProgressMap;
  bonusUnlocked: boolean;
  getStatus: (id: RegionId) => RegionStatus;
  resetProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined
);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { gameState, refreshState } = useSession();
  const sortedRegions = useMemo(() => [...REGIONS].sort((a, b) => a.order - b.order), []);
  const progress = useMemo(() => {
    const next = buildInitialProgress();
    gameState?.progress.regions.forEach((region) => {
      next[region.regionId] = region.status;
    });
    return next;
  }, [gameState]);

  function getStatus(id: RegionId): RegionStatus {
    return progress[id] ?? "locked";
  }

  async function resetProgress() {
    await apiDelete("/me/progress", { "X-Confirm-Reset": "RESET" });
    localStorage.removeItem("aventura-regioes:progress");
    const state = await refreshState();
    if (!state) {
      throw new Error("Não foi possível sincronizar o progresso reiniciado.");
    }
  }

  const bonusUnlocked = sortedRegions.every(
    (region) => progress[region.id] === "completed"
  );

  return (
    <ProgressContext.Provider
      value={{ progress, bonusUnlocked, getStatus, resetProgress }}
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
