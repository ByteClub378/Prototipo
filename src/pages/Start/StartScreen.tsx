import { useNavigate } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { useState } from "react";
import "./StartScreen.css";

function StartScreen() {
  const navigate = useNavigate();
  const { progress, resetProgress } = useProgress();
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(false);

  const hasSavedProgress = Object.values(progress).some((status) => status === "completed");

  async function handleNewGame() {
    if (isResetting) return;
    setIsResetting(true);
    setResetError(false);
    try {
      await resetProgress();
      navigate("/mapa");
    } catch {
      setResetError(true);
    } finally {
      setIsResetting(false);
    }
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

        <div className="start-screen__explorer">🐒</div>

        <div className="start-screen__menu">
          <button
            className="start-screen__menu-item start-screen__menu-item--primary"
            onClick={handleNewGame}
            disabled={isResetting}
          >
            {isResetting ? "Conectando..." : "🎮 Novo Jogo"}
          </button>

          {resetError && <p>Não foi possível reiniciar. Tente novamente.</p>}

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