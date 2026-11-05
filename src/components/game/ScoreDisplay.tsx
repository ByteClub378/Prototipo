import { useScore } from "../../context/ScoreContext";
import { useSession } from "../../context/SessionContext";
import "./ScoreDisplay.css";

function ScoreDisplay() {
  const { score, roundScore, roundSaved, lastDelta, feedbackId } = useScore();
  const { syncPending } = useSession();

  return (
    <section className="score-display" aria-label="Pontuação">
      <div className="score-display__round">
        <span className="score-display__icon" aria-hidden="true">⭐</span>
        <div className="score-display__counter" role="status" aria-atomic="true">
          <span>Pontos da rodada</span>
          <strong className="score-display__value" data-testid="round-score">{roundScore}</strong>
          <small>{roundSaved ? "Rodada salva" : "Provisórios até salvar"}</small>
        </div>
        <span className="score-display__feedback" aria-hidden="true">
          {lastDelta != null && (
            <span key={feedbackId} className={`score-display__delta score-display__delta--${lastDelta > 0 ? "gain" : "loss"}`}>
              {lastDelta > 0 ? `+${lastDelta}` : `−${Math.abs(lastDelta)}`}
            </span>
          )}
        </span>
      </div>
      <div className="score-display__total" role="status" aria-atomic="true">
        <span>Total da aventura</span>
        <strong data-testid="adventure-score">{score}</strong>
        <small>{syncPending ? "Último total confirmado · sincronização pendente" : "Melhor pontuação de cada nível"}</small>
      </div>
    </section>
  );
}

export default ScoreDisplay;
