import "./MissionHeader.css";

interface MissionHeaderProps {
  title: string;
  instruction: string;
  characterIcon?: string;
}

function MissionHeader({ title, instruction, characterIcon = "🧑‍🚀" }: MissionHeaderProps) {
  return (
    <div className="mission-header">
      <div className="mission-header__text">
        <h2 className="mission-header__title">{title}</h2>
        <p className="mission-header__instruction">{instruction}</p>
      </div>
      <span className="mission-header__character">{characterIcon}</span>
    </div>
  );
}

export default MissionHeader;
