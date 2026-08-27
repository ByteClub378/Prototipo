import { useNavigate } from "react-router-dom";
import { REGIONS } from "../../data/regions/regions";
import { REGION_PATHS, REGION_LABEL_POS, MAP_VIEWBOX } from "../../data/regions/mapPaths";
import { useProgress } from "../../context/ProgressContext";
import type { RegionStatus } from "../../types";
import "./RegionMap.css";

const STATUS_BADGE: Record<RegionStatus, string> = {
  locked: "🔒",
  unlocked: "⭐",
  completed: "🏅",
};

const LOCKED_COLOR = "#B0BEC5";

function RegionMap() {
  const navigate = useNavigate();
  const { getStatus, bonusUnlocked } = useProgress();

  function handleRegionClick(regionId: string, status: RegionStatus) {
    if (status === "locked") return;
    if (regionId === "norte") {
      navigate("/missao/norte");
    }
  }

  return (
    <div className="region-map">
      <svg
        viewBox={MAP_VIEWBOX}
        className="region-map__svg"
        role="img"
        aria-label="Mapa do Brasil com as cinco regiões"
      >
        {REGIONS.map((region) => {
          const status = getStatus(region.id);
          const isClickable = status !== "locked";
          const fill = status === "locked" ? LOCKED_COLOR : region.color;
          const labelPos = REGION_LABEL_POS[region.id];

          return (
            <g
              key={region.id}
              className={`region-map__region region-map__region--${status} ${
                isClickable ? "region-map__region--clickable" : ""
              }`}
              onClick={() => handleRegionClick(region.id, status)}
              tabIndex={isClickable ? 0 : -1}
              role={isClickable ? "button" : undefined}
              aria-label={`${region.name}: ${status === "locked" ? "bloqueada" : status === "completed" ? "concluída" : "disponível"}`}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && isClickable) {
                  handleRegionClick(region.id, status);
                }
              }}
            >
              <path d={REGION_PATHS[region.id]} fill={fill} stroke="#ffffff" strokeWidth={3} />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                className="region-map__label"
              >
                {region.name}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y + 16}
                textAnchor="middle"
                className="region-map__badge"
              >
                {STATUS_BADGE[status]}
              </text>
            </g>
          );
        })}
      </svg>

      <div
        className={`region-map__bonus ${
          bonusUnlocked ? "region-map__bonus--unlocked" : "region-map__bonus--locked"
        }`}
      >
        <span>{bonusUnlocked ? "🏆" : "🔒"}</span>
        <span>Fase Bônus</span>
      </div>
    </div>
  );
}

export default RegionMap;
