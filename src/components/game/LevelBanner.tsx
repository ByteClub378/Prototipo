import GameCard from "../ui/GameCard";
import InstructionAudio from "./InstructionAudio";
import "./LevelBanner.css";

interface LevelBannerLevel {
  id: number;
  title: string;
  instruction: string;
  bannerIcon: string;
}

interface LevelBannerProps {
  level: LevelBannerLevel;
  totalLevels: number;
  onStart: () => void;
  buttonLabel?: string;
  disabled?: boolean;
  narration?: string;
  audioSrc?: string;
}

export default function LevelBanner({
  level,
  totalLevels,
  onStart,
  buttonLabel = "Começar",
  disabled = false,
  narration,
  audioSrc,
}: LevelBannerProps) {
  return (
    <GameCard className="level-banner">
      <span className="level-banner__icon">
        {level.bannerIcon}
      </span>

      <span className="level-banner__step">
        Nível {level.id} de {totalLevels}
      </span>

      <h2 className="level-banner__title">{level.title}</h2>

      <p className="level-banner__instruction">
        {level.instruction}
      </p>

      <InstructionAudio
        text={narration ?? level.instruction}
        audioSrc={audioSrc}
      />

      <button
        className="level-banner__button"
        onClick={onStart}
        disabled={disabled}
      >
        {buttonLabel}
      </button>
    </GameCard>
  );
}
