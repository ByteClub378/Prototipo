import { useNavigate } from "react-router-dom";
import "./NewMissionButton.css";

function NewMissionButton() {
  const navigate = useNavigate();

  return (
    <button className="new-mission-button" onClick={() => navigate("/mapa")}>
      <span>🚀</span>
      Nova Missão
    </button>
  );
}

export default NewMissionButton;
