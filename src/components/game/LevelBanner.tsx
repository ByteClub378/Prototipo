import GameCard from "../ui/GameCard";
import "./LevelBanner.css";
// import type { NorthLevelConfig } from "../../data/missions/northLevels";

interface LevelBannerLevel {
  id: number;
  title: string;
  instruction: string;
  bannerIcon: string;
}

interface LevelBannerProps {
  level: LevelBannerLevel; // Se preferir, substitua 'LevelBannerLevel' por 'NorthLevelConfig'
  totalLevels: number;
  onStart: () => void;
  buttonLabel?: string;
  disabled?: boolean;
}

function LevelBanner({ level, totalLevels, onStart, buttonLabel = "Começar", disabled = false }: LevelBannerProps) {
  return (
    <GameCard className="level-banner">
      <span className="level-banner__icon">{level.bannerIcon}</span>
      <span className="level-banner__step">
        Nível {level.id} de {totalLevels}
      </span>
      <h2 className="level-banner__title">{level.title}</h2>
      <p className="level-banner__instruction">{level.instruction}</p>
      <button className="level-banner__button" onClick={onStart} disabled={disabled}>
        {buttonLabel}
      </button>
    </GameCard>
  );
}

export default LevelBanner;