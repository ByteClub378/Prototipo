import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import InstructionAudio from "../../../components/game/InstructionAudio";
import { useScore } from "../../../context/ScoreContext";
import { useSession } from "../../../context/SessionContext";
import { POINTS_PER_CORRECT_ANSWER, POINTS_PER_INCORRECT_ANSWER } from "../../../data/scoring";
import { useAttempt } from "../../../hooks/useAttempt";
import { useGameFeedback } from "../../../hooks/useGameFeedback";
import {
  createQuestionSelection,
  SOUTHEAST_STATES,
  type SoutheastState,
  type SoutheastStateId,
} from "../../../data/missions/questions";
import "../southeast/southeastPhase.css";

const STATE_COLORS: Record<SoutheastStateId, string> = {
  "sao-paulo": "#4f9a67",
  "minas-gerais": "#efb93b",
  "rio-de-janeiro": "#ee835f",
  "espirito-santo": "#5c9ed1",
};

function SudestePhase() {
  const { feedbackRef, showSuccess, showError } = useGameFeedback<HTMLElement>();
  const answerLockedRef = useRef(false);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionInFlightRef = useRef(false);
  const levelScoreRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const incorrectAnswersRef = useRef(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const navigate = useNavigate();
  const { addPoints } = useScore();
  const { status: sessionStatus, refreshState, retryBootstrap } = useSession();
  const { startAttempt, completeAttempt } = useAttempt("sudeste");
  const [questionSets] = useState(createQuestionSelection);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<
    "idle" | "saving" | "failed" | "sync-failed" | "passed" | "not-passed"
  >("idle");
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<SoutheastStateId[]>([]);
  const [placedIds, setPlacedIds] = useState<SoutheastStateId[]>([]);
  const [selectedId, setSelectedId] = useState<SoutheastStateId | null>(null);
  const [activeStateId, setActiveStateId] = useState<SoutheastStateId | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => () => {
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
  }, []);

  function scheduleAnswer(callback: () => void, delay: number) {
    answerTimeoutRef.current = setTimeout(() => {
      callback();
      answerLockedRef.current = false;
      setIsAnswering(false);
    }, delay);
  }

  function closeChallenge() {
    if (answerLockedRef.current) return;
    setActiveStateId(null);
  }

  const activeState = SOUTHEAST_STATES.find((state) => state.id === activeStateId) ?? null;
  const activeQuestion = activeStateId ? questionSets[activeStateId][questionIndex] : null;
  const isComplete = placedIds.length === SOUTHEAST_STATES.length;

  async function startMission() {
    if (isStarting) return;
    setIsStarting(true);
    setFeedback(null);

    if (sessionStatus === "loading") {
      setFeedback("Aguarde enquanto conectamos sua sessão.");
      setIsStarting(false);
      return;
    }
    if (sessionStatus === "error" && !(await retryBootstrap())) {
      setFeedback("Não foi possível conectar. Verifique sua internet e tente novamente.");
      setIsStarting(false);
      return;
    }

    const started = await startAttempt(1);
    if (!started) {
      setFeedback("Não foi possível iniciar a fase. Verifique sua conexão e tente novamente.");
      setIsStarting(false);
      return;
    }

    levelScoreRef.current = 0;
    correctAnswersRef.current = 0;
    incorrectAnswersRef.current = 0;
    setUnlockedIds([]);
    setPlacedIds([]);
    setSelectedId(null);
    setActiveStateId(null);
    setQuestionIndex(0);
    setCompletionError(null);
    setCompletionStatus("idle");
    setAttemptStarted(true);
    setIsStarting(false);
  }

  useEffect(() => {
    if (!attemptStarted || !isComplete || completionStatus !== "idle" || completionInFlightRef.current) return;
    completionInFlightRef.current = true;
    setCompletionStatus("saving");
    void (async () => {
      const result = await completeAttempt({
        score: levelScoreRef.current + 200,
        correctAnswers: correctAnswersRef.current,
        incorrectAnswers: incorrectAnswersRef.current,
      });
      if (!result) {
        setCompletionError("A conexão falhou. Seus encaixes foram mantidos; tente salvar novamente.");
        setCompletionStatus("failed");
        return;
      }

      if (result.passed) {
        addPoints(200);
      }
      const refreshedState = await refreshState();
      if (result.passed && !refreshedState) {
        setCompletionError("Sua conclusão foi confirmada, mas não foi possível atualizar o mapa. Tente sincronizar novamente.");
        setCompletionStatus("sync-failed");
      } else {
        setCompletionStatus(result.passed ? "passed" : "not-passed");
      }
    })().finally(() => {
      completionInFlightRef.current = false;
    });
  }, [addPoints, attemptStarted, completeAttempt, completionStatus, isComplete, refreshState]);

  const questionProgress = useMemo(() => `${placedIds.length} de 4 estados`, [placedIds.length]);

  function openChallenge(state: SoutheastState) {
    if (!attemptStarted || completionStatus !== "idle" || answerLockedRef.current) return;
    if (unlockedIds.includes(state.id) || placedIds.includes(state.id)) return;
    setActiveStateId(state.id);
    setQuestionIndex(0);
    setFeedback(null);
  }

  function placeState(stateId: SoutheastStateId, targetId: SoutheastStateId) {
    if (!attemptStarted || completionStatus !== "idle") return;
    if (placedIds.includes(stateId)) return;
    if (!unlockedIds.includes(stateId)) {
      const state = SOUTHEAST_STATES.find((item) => item.id === stateId);
      if (state) openChallenge(state);
      return;
    }
    if (stateId !== targetId) {
      incorrectAnswersRef.current += 1;
      levelScoreRef.current = Math.max(0, levelScoreRef.current + POINTS_PER_INCORRECT_ANSWER);
      addPoints(POINTS_PER_INCORRECT_ANSWER);
      showError("Essa peça pertence a outro espaço. Confira a sigla e tente novamente!", { title: "Vamos encontrar o lugar certo!" });
      setFeedback("Essa peça pertence a outro espaço. Confira a sigla e tente novamente!");
      return;
    }

    setPlacedIds((current) => current.includes(stateId) ? current : [...current, stateId]);
    setSelectedId(null);
    showSuccess(`${SOUTHEAST_STATES.find((state) => state.id === stateId)?.name} está no lugar certo!`, { title: "Peça encaixada!" });
    setFeedback(`${SOUTHEAST_STATES.find((state) => state.id === stateId)?.name} encaixado!`);
  }

  function selectPiece(state: SoutheastState) {
    if (!attemptStarted || completionStatus !== "idle") return;
    if (placedIds.includes(state.id)) return;
    if (!unlockedIds.includes(state.id)) {
      openChallenge(state);
      return;
    }
    setSelectedId((current) => current === state.id ? null : state.id);
    setFeedback(selectedId === state.id
      ? "Peça desmarcada."
      : `Peça ${state.abbreviation} selecionada. Toque na área correspondente do mapa para encaixar.`);
  }

  function handleMapStateClick(state: SoutheastState) {
    if (!attemptStarted || completionStatus !== "idle") return;
    if (placedIds.includes(state.id)) return;
    if (selectedId) {
      placeState(selectedId, state.id);
      return;
    }
    if (!unlockedIds.includes(state.id)) {
      openChallenge(state);
      return;
    }
    setFeedback(`Selecione a peça ${state.abbreviation} ao lado e depois toque neste estado.`);
  }

  function answerQuestion(optionIndex: number) {
    if (!attemptStarted || completionStatus !== "idle" || !activeStateId || !activeQuestion || answerLockedRef.current) return;
    answerLockedRef.current = true;
    setIsAnswering(true);
    if (optionIndex !== activeQuestion.answerIndex) {
      incorrectAnswersRef.current += 1;
      levelScoreRef.current = Math.max(0, levelScoreRef.current + POINTS_PER_INCORRECT_ANSWER);
      addPoints(POINTS_PER_INCORRECT_ANSWER);
      showError(activeQuestion.explanation, { title: "Quase! Leia a dica e tente de novo" });
      setFeedback(activeQuestion.explanation);
      scheduleAnswer(() => {}, 700);
      return;
    }

    showSuccess(activeQuestion.explanation, { title: "Resposta certa!" });
    correctAnswersRef.current += 1;
    levelScoreRef.current += POINTS_PER_CORRECT_ANSWER;
    addPoints(POINTS_PER_CORRECT_ANSWER);
    if (questionIndex === 0) {
      setFeedback("Resposta certa! Agora responda à segunda pergunta para liberar a peça.");
      scheduleAnswer(() => {
        setQuestionIndex(1);
        setFeedback(null);
      }, 1500);
      return;
    }

    const unlockedStateId = activeStateId;
    const state = SOUTHEAST_STATES.find((item) => item.id === unlockedStateId);
    setFeedback(`Duas respostas corretas! A peça ${state?.abbreviation} foi liberada para encaixe.`);
    scheduleAnswer(() => {
      setUnlockedIds((current) => current.includes(unlockedStateId) ? current : [...current, unlockedStateId]);
      setSelectedId(unlockedStateId);
      setActiveStateId(null);
      setQuestionIndex(0);
    }, 1500);
  }

  function retryCompletion() {
    setCompletionError(null);
    setCompletionStatus("idle");
  }

  async function retryStateSync() {
    setCompletionError(null);
    const refreshedState = await refreshState();
    if (refreshedState) {
      setCompletionStatus("passed");
    } else {
      setCompletionError("Ainda não foi possível atualizar o mapa. Verifique sua conexão e tente novamente.");
    }
  }

  return (
    <main ref={feedbackRef} className="sudeste-phase">
      <header className="sudeste-phase__header">
        <div>
          <span className="sudeste-phase__eyebrow">MISSÃO DE GEOGRAFIA · REGIÃO SUDESTE</span>
          <h1>Monte o mapa do Sudeste!</h1>
          <p>Responda a duas perguntas para liberar cada estado e encaixá-lo no mapa.</p>
          <InstructionAudio
            text="Olá, explorador do Sudeste! Responda as duas perguntas de cada estado para liberá-lo no mapa. Depois, encaixe a peça no lugar correto e continue para o próximo."
            audioSrc="/audio/sudeste.mp3"
          />
        </div>
        <div className="sudeste-phase__progress" aria-label={questionProgress}>
          <span>{questionProgress}</span>
          <div className="sudeste-phase__progress-track">
            <span style={{ width: `${(placedIds.length / 4) * 100}%` }} />
          </div>
        </div>
      </header>

      {completionStatus === "passed" ? (
        <section className="sudeste-phase__victory" aria-live="polite">
          <span className="sudeste-phase__medal" aria-hidden="true">🏅</span>
          <p className="sudeste-phase__eyebrow">MISSÃO CONCLUÍDA</p>
          <h2>Medalha do Sudeste conquistada!</h2>
          <p>Você respondeu aos desafios e encaixou os quatro estados da região.</p>
          <button className="sudeste-phase__back-to-map" type="button" onClick={() => navigate("/mapa")}>
            Voltar ao mapa
          </button>
        </section>
      ) : completionStatus === "saving" || (isComplete && completionStatus === "idle") ? (
        <section className="sudeste-phase__victory" role="status" aria-live="polite">
          <span className="sudeste-phase__medal" aria-hidden="true">⏳</span>
          <h2>Salvando sua conquista...</h2>
          <p>Aguarde a confirmação do servidor para registrar seu progresso.</p>
        </section>
      ) : completionStatus === "failed" ? (
        <section className="sudeste-phase__victory" role="alert">
          <h2>Não foi possível salvar a conclusão</h2>
          <p>{completionError}</p>
          <button className="sudeste-phase__back-to-map" type="button" onClick={retryCompletion}>
            Tentar salvar novamente
          </button>
        </section>
      ) : completionStatus === "sync-failed" ? (
        <section className="sudeste-phase__victory" role="alert">
          <span className="sudeste-phase__medal" aria-hidden="true">🏅</span>
          <h2>Conquista confirmada; mapa ainda não sincronizado</h2>
          <p>{completionError}</p>
          <button className="sudeste-phase__back-to-map" type="button" onClick={() => void retryStateSync()}>
            Sincronizar progresso
          </button>
        </section>
      ) : completionStatus === "not-passed" ? (
        <section className="sudeste-phase__victory" role="status">
          <span className="sudeste-phase__medal" aria-hidden="true">🌱</span>
          <h2>Quase lá!</h2>
          <p>Esta tentativa não atingiu a pontuação necessária. Comece uma nova partida para tentar novamente.</p>
          <button
            className="sudeste-phase__back-to-map"
            type="button"
            onClick={() => void startMission()}
            disabled={isStarting}
          >
            {isStarting ? "Iniciando..." : "Tentar novamente"}
          </button>
        </section>
      ) : !attemptStarted ? (
        <section className="sudeste-phase__victory">
          <span className="sudeste-phase__medal" aria-hidden="true">🧭</span>
          <h2>Pronto para explorar o Sudeste?</h2>
          <p>Responda aos oito desafios, encaixe os quatro estados e conquiste até 1000 pontos.</p>
          {feedback && <p role="alert">{feedback}</p>}
          <button
            className="sudeste-phase__back-to-map"
            type="button"
            onClick={() => void startMission()}
            disabled={sessionStatus === "loading" || isStarting}
          >
            {sessionStatus === "loading" ? "Conectando..." : isStarting ? "Iniciando..." : "Começar missão"}
          </button>
        </section>
      ) : (
        <div className="sudeste-phase__board">
          <section className="sudeste-phase__pieces" aria-labelledby="sudeste-pieces-title">
            <div className="sudeste-phase__section-heading">
              <div>
                <span className="sudeste-phase__eyebrow">PEÇAS DOS ESTADOS</span>
                <h2 id="sudeste-pieces-title">Responda para liberar</h2>
              </div>
              <span className="sudeste-phase__piece-count">{unlockedIds.length}/4 liberadas</span>
            </div>
            <div className="sudeste-phase__tile-list">
              {SOUTHEAST_STATES.map((state) => {
                const unlocked = unlockedIds.includes(state.id);
                const placed = placedIds.includes(state.id);
                const selected = selectedId === state.id;
                return (
                  <button
                    className={`sudeste-phase__tile${unlocked ? " is-unlocked" : ""}${placed ? " is-placed" : ""}${selected ? " is-selected" : ""}`}
                    key={state.id}
                    type="button"
                    draggable={unlocked && !placed}
                    aria-pressed={selected}
                    aria-label={placed ? `${state.name}, encaixado` : unlocked ? `Arrastar ou selecionar ${state.name}` : `Abrir perguntas de ${state.name}`}
                    onClick={() => selectPiece(state)}
                    onDragStart={(event) => {
                      if (!unlocked || placed) { event.preventDefault(); return; }
                      event.dataTransfer.setData("text/plain", state.id);
                      event.dataTransfer.effectAllowed = "move";
                      setSelectedId(state.id);
                    }}
                  >
                    <span className="sudeste-phase__tile-icon" aria-hidden="true">
                      {placed ? "✓" : unlocked ? state.icon : "🔒"}
                    </span>
                    <span className="sudeste-phase__tile-copy">
                      <strong>{state.name}</strong>
                      <small>{placed ? "No mapa" : unlocked ? "Peça liberada · pronta" : "Toque para responder 2 perguntas"}</small>
                    </span>
                    <span className="sudeste-phase__tile-code">{state.abbreviation}</span>
                  </button>
                );
              })}
            </div>
            <p className="sudeste-phase__helper">No computador, arraste a peça. No celular, selecione-a e toque no estado correspondente do mapa.</p>
          </section>

          <section className="sudeste-phase__map-panel" aria-labelledby="sudeste-map-title">
            <div className="sudeste-phase__section-heading sudeste-phase__map-heading">
              <div>
                <span className="sudeste-phase__eyebrow"></span>
                <h2 id="sudeste-map-title">Mapa do Sudeste</h2>
              </div>
              <span aria-hidden="true">🧭</span>
            </div>
            <svg className="sudeste-phase__map" viewBox="0 0 420 390" role="group" aria-labelledby="sudeste-svg-title sudeste-svg-description">
              <title id="sudeste-svg-title">Quebra-cabeça dos estados do Sudeste</title>
              <desc id="sudeste-svg-description">Mapa esquemático dividido em São Paulo, Minas Gerais, Rio de Janeiro e Espírito Santo. Clique em um estado para abrir as perguntas ou encaixe uma peça liberada.</desc>
              {SOUTHEAST_STATES.map((state) => {
                const placed = placedIds.includes(state.id);
                const unlocked = unlockedIds.includes(state.id);
                return (
                  <g key={state.id} className="sudeste-phase__svg-state">
                    <path
                      d={state.path}
                      className={`sudeste-phase__state-shape${unlocked ? " is-unlocked" : ""}${placed ? " is-placed" : ""}${selectedId === state.id ? " is-targeted" : ""}`}
                      fill={placed ? STATE_COLORS[state.id] : unlocked ? "#dceecf" : "#d6d9d3"}
                      role="button"
                      tabIndex={0}
                      aria-label={`${state.name}${placed ? ", encaixado" : unlocked ? ", liberado para encaixar" : ", toque para abrir duas perguntas"}`}
                      onClick={() => handleMapStateClick(state)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleMapStateClick(state);
                        }
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const draggedId = event.dataTransfer.getData("text/plain") as SoutheastStateId;
                        if (draggedId) placeState(draggedId, state.id);
                      }}
                    />
                    <text x={state.label.x} y={state.label.y} className={`sudeste-phase__state-label${placed ? " is-placed" : ""}`} aria-hidden="true">
                      {placed ? `✓ ${state.abbreviation}` : state.abbreviation}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="sudeste-phase__legend">
              <span><i className="is-locked" />Bloqueado</span>
              <span><i className="is-unlocked" />Liberado</span>
              <span><i className="is-placed" />Encaixado</span>
            </div>
          </section>
        </div>
      )}

      {attemptStarted && completionStatus === "idle" && !isComplete && (
        <p className="sudeste-phase__feedback" aria-live="polite">{feedback ?? "Toque em qualquer estado para abrir o desafio."}</p>
      )}

      {completionStatus === "idle" && activeState && activeQuestion && (
        <div className="sudeste-phase__modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeChallenge();
        }}>
          <section className="sudeste-phase__modal" role="dialog" aria-modal="true" aria-labelledby="sudeste-question-title">
            <button className="sudeste-phase__modal-close" type="button" aria-label="Fechar desafio" onClick={closeChallenge} disabled={isAnswering}>×</button>
            <span className="sudeste-phase__modal-icon" aria-hidden="true">{activeState.icon}</span>
            <span className="sudeste-phase__eyebrow">DESAFIO DO ESTADO · {activeState.name.toUpperCase()}</span>
            <div className="sudeste-phase__question-meta">
              <span>Pergunta {questionIndex + 1} de 2</span>
              <span>Bloom: {activeQuestion.bloom}</span>
            </div>
            <h2 id="sudeste-question-title">{activeQuestion.prompt}</h2>
            <div className="sudeste-phase__answers">
              {activeQuestion.options.map((option, index) => (
                <button key={`${activeQuestion.id}-${option}`} type="button" onClick={() => answerQuestion(index)} disabled={isAnswering}>
                  <span>{String.fromCharCode(65 + index)}</span>{option}
                </button>
              ))}
            </div>
            {feedback && <p className="sudeste-phase__hint" aria-live="polite">{feedback}</p>}
            <p className="sudeste-phase__question-count">Acertando as duas, a peça fica disponível para o mapa.</p>
          </section>
        </div>
      )}
    </main>
  );
}

export default SudestePhase;
