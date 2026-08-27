import type { Region } from "../../types";

export const REGIONS: Region[] = [
  { id: "norte", name: "Norte", icon: "🌳", color: "#2E7D32", order: 1 },
  { id: "nordeste", name: "Nordeste", icon: "☀️", color: "#F9A825", order: 2 },
  {
    id: "centro-oeste",
    name: "Centro-Oeste",
    icon: "🐆",
    color: "#6D4C41",
    order: 3,
  },
  { id: "sudeste", name: "Sudeste", icon: "🏙️", color: "#1565C0", order: 4 },
  { id: "sul", name: "Sul", icon: "🧉", color: "#388E3C", order: 5 },
];
