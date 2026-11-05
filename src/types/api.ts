import type { RegionId, RegionStatus } from "./index";

export interface ServerRegionProgress {
  regionId: RegionId;
  name: string;
  status: RegionStatus;
  unlockedAt: string | null;
  completedAt: string | null;
}

export interface ServerLevelProgress {
  regionId: RegionId | "bonus";
  levelNumber: number;
  name: string;
  questionCount: number;
  maxScore: number;
  status: RegionStatus;
  bestScore: number;
  attemptCount: number;
  unlockedAt: string | null;
  completedAt: string | null;
}

export interface ServerMedal {
  id: string;
  name: string;
  description: string;
  regionId: RegionId;
  awardedAt: string;
}

export interface MissionCheckpoint {
  runId: string;
  nextLevelNumber: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface GameStateResponse {
  journeyId: string;
  totalScore: number;
  hasProgress: boolean;
  checkpoints: Partial<Record<RegionId | "bonus", MissionCheckpoint>>;
  playerId: string;
  revision: number;
  progress: {
    regions: ServerRegionProgress[];
    levels: ServerLevelProgress[];
  };
  medals: ServerMedal[];
}
