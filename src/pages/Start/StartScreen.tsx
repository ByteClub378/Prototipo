import { useNavigate } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import "./StartScreen.css";

function StartScreen() {
  const navigate = useNavigate();
  const { progress, resetProgress } = useProgress();

  const hasSavedProgress = Object.values(progress).some((status) => status === "completed");

  function handleNewGame() {
    resetProgress();
    navigate("/mapa");
  }

  function handleContinue() {
    navigate("/mapa");
  }

  return (
    <div className="start-screen">
      <div className="start-screen__sun" />
      <div className="start-screen__cloud start-screen__cloud--1" />
      <div className="start-screen__cloud start-screen__cloud--2" />
      <div className="start-screen__mountains" />
      <div className="start-screen__ground" />

      <div className="start-screen__content">
        <div className="start-screen__flag-row">
          <span>🇧🇷</span>
          <h1 className="start-screen__title">
            Aventura das <span>Regiões</span>
          </h1>
          <span>🇧🇷</span>
        </div>

        <p className="start-screen__subtitle">Explore as 5 regiões do Brasil!</p>

        <div className="start-screen__explorer">🧑‍🚀</div>

        <div className="start-screen__menu">
          <button
            className="start-screen__menu-item start-screen__menu-item--primary"
            onClick={handleNewGame}
          >
            🎮 Novo Jogo
          </button>

          {hasSavedProgress && (
            <button className="start-screen__menu-item" onClick={handleContinue}>
              📂 Continuar Aventura
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StartScreen;