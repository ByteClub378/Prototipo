import "./PlayerProfile.css";

interface PlayerProfileProps {
  name: string;
  level: string;
  avatar: string;
}

function PlayerProfile({ name, level, avatar }: PlayerProfileProps) {
  return (
    <div className="player-profile">
      <div className="player-profile__avatar">{avatar}</div>
      <div className="player-profile__info">
        <span className="player-profile__name">{name}</span>
        <span className="player-profile__level">Nível: {level}</span>
      </div>
    </div>
  );
}

export default PlayerProfile;
