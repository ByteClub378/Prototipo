export type RegionId =
  | "norte"
  | "nordeste"
  | "centro-oeste"
  | "sudeste"
  | "sul";

export type RegionStatus = "locked" | "unlocked" | "completed";

export interface Region {
  id: RegionId;
  name: string;
  icon: string;
  color: string;
  order: number;
}

export interface Medal {
  regionId: RegionId;
  name: string;
  icon: string;
  description: string;
}

export interface PlayerProfile {
  name: string;
  level: string;
  avatar: string;
}
