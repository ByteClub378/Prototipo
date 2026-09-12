import { useScore } from "../../context/ScoreContext";
import "./ScoreDisplay.css";

function ScoreDisplay() {
  const { score, lastDelta } = useScore();

  const pulseClass =
    lastDelta == null ? "" : lastDelta > 0 ? "score-display--gain" : "score-display--loss";

  return (
    <div className={`score-display ${pulseClass}`}>
      <span className="score-display__icon">⭐</span>
      <span className="score-display__value">{score} pontos</span>

      {lastDelta != null && (
        <span
          key={Date.now()}
          className={`score-display__delta ${
            lastDelta > 0 ? "score-display__delta--gain" : "score-display__delta--loss"
          }`}
        >
          {lastDelta > 0 ? `+${lastDelta}` : lastDelta}
        </span>
      )}
    </div>
  );
}

export default ScoreDisplay;