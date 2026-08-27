import type { NorthLevelConfig } from "../../data/missions/northLevels";
import GameCard from "../ui/GameCard";
import "./LevelBanner.css";

interface LevelBannerProps {
  level: NorthLevelConfig;
  totalLevels: number;
  onStart: () => void;
}

function LevelBanner({ level, totalLevels, onStart }: LevelBannerProps) {
  return (
    <GameCard className="level-banner">
      <span className="level-banner__icon">{level.bannerIcon}</span>
      <span className="level-banner__step">
        Nível {level.id} de {totalLevels}
      </span>
      <h2 className="level-banner__title">{level.title}</h2>
      <p className="level-banner__instruction">{level.instruction}</p>
      <button className="level-banner__button" onClick={onStart}>
        Começar
      </button>
    </GameCard>
  );
}

export default LevelBanner;
