import { useNavigate } from "react-router-dom";
import "./NewMissionButton.css";

function NewMissionButton() {
  const navigate = useNavigate();

  return (
    <button
      className="new-mission-button"
      type="button"
      onClick={() => navigate("/mapa")}
      aria-label="Nova missão"
      title="Nova missão"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span className="new-mission-button__label">Nova Missão</span>
    </button>
  );
}

export default NewMissionButton;
