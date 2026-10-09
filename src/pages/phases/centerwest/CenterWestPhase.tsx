
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "../../../components/ui/GameCard";
import InstructionAudio from "../../../components/game/InstructionAudio";
import MissionTimer from "../../../components/game/MissionTimer";
import ScoreDisplay from "../../../components/game/ScoreDisplay";
import { useScore } from "../../../context/ScoreContext";
import { useSession } from "../../../context/SessionContext";
import { useAttempt } from "../../../hooks/useAttempt";
import { useGameFeedback } from "../../../hooks/useGameFeedback";
import {
  POINTS_PER_CORRECT_ANSWER,
  POINTS_PER_INCORRECT_ANSWER,
} from "../../../data/scoring";
import {
  createCentroOesteMissionOrder,
  type CentroOesteMission,
} from "../../../data/missions/centerWestMission";
import {
  playErrorSound,
  playSuccessSound,
  playTimeoutSound,
} from "../../../utils/sound";
import { logEvent } from "../../../utils/telemetry";
import centroOesteMap from "../../../assets/centro-oeste/mapa-centro-oeste.jpg";
import "./CenterWestPhase.css";

const TOTAL_MISSIONS = 8;
const MAX_LIVES = 3;
const MISSION_TIME_SECONDS = 30;

type GameStatus =
  | "intro"
  | "starting"
  | "playing"
  | "discovery"
  | "saving"
  | "game-over"
  | "complete";

interface WrongMarker {
  id: number;
  x: number;
  y: number;
}

function CenterWestPhase() {
  const { feedbackRef, showSuccess, showError, notifyError, clearFeedback } = useGameFeedback<HTMLElement>();
  const actionLockedRef = useRef(false);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { addPoints, resetScore } = useScore();
  const { startAttempt, completeAttempt } = useAttempt("centro-oeste");
  const { status: sessionStatus, refreshState, retryBootstrap } = useSession();

  const [missions, setMissions] = useState(createCentroOesteMissionOrder);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [selectedDiscovery, setSelectedDiscovery] =
    useState<CentroOesteMission | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("intro");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wrongMarker, setWrongMarker] = useState<WrongMarker | null>(null);
  const [timerNonce, setTimerNonce] = useState(0);

  const livesRef = useRef(MAX_LIVES);
  const levelScoreRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const incorrectAnswersRef = useRef(0);
  const markerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMission = missions[currentIndex];
  const progressPercent = Math.round(
    (discoveredIds.length / TOTAL_MISSIONS) * 100,
  );

  useEffect(() => {
    return () => {
      if (markerTimeoutRef.current) clearTimeout(markerTimeoutRef.current);
      if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
    };
  }, []);

  function resetLocalGame() {
    clearFeedback();
    actionLockedRef.current = false;
    if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
    const nextMissions = createCentroOesteMissionOrder();
    setMissions(nextMissions);
    setCurrentIndex(0);
    setLives(MAX_LIVES);
    livesRef.current = MAX_LIVES;
    setDiscoveredIds([]);
    setSelectedDiscovery(null);
    setFeedback(null);
    setWrongMarker(null);
    setTimerNonce((value) => value + 1);
    levelScoreRef.current = 0;
    correctAnswersRef.current = 0;
    incorrectAnswersRef.current = 0;
  }

  async function startGame() {
    if (gameStatus === "starting") return;
    setGameStatus("starting");
    setFeedback(null);

    if (sessionStatus === "loading") {
      setFeedback("Aguarde enquanto conectamos sua sessão.");
      setGameStatus("intro");
      return;
    }

    if (sessionStatus === "error") {
      const recovered = await retryBootstrap();
      if (!recovered) {
        notifyError("Verifique sua internet e tente novamente.", { title: "Não foi possível conectar" });
        setFeedback("Não foi possível conectar. Verifique sua internet e tente novamente.");
        setGameStatus("intro");
        return;
      }
    }

    const started = await startAttempt(1);
    if (!started) {
      notifyError("Tente novamente.", { title: "Não foi possível iniciar a fase" });
      setFeedback("Não foi possível iniciar a fase. Tente novamente.");
      setGameStatus("intro");
      return;
    }

    resetLocalGame();
    setGameStatus("playing");
  }

  function showWrongMarker(x: number, y: number) {
    const marker = { id: Date.now(), x, y };
    setWrongMarker(marker);
    if (markerTimeoutRef.current) clearTimeout(markerTimeoutRef.current);
    markerTimeoutRef.current = setTimeout(() => {
      setWrongMarker((current) => (current?.id === marker.id ? null : current));
    }, 700);
  }

  function loseLife(message: string, x?: number, y?: number, playSound = true) {
    if (gameStatus !== "playing" || actionLockedRef.current || livesRef.current <= 0) return;
    actionLockedRef.current = true;

    const nextLives = livesRef.current - 1;
    livesRef.current = nextLives;
    setLives(nextLives);
    incorrectAnswersRef.current += 1;
    levelScoreRef.current = Math.max(
      0,
      levelScoreRef.current + POINTS_PER_INCORRECT_ANSWER,
    );
    addPoints(POINTS_PER_INCORRECT_ANSWER);
    setFeedback(message);
    showError(nextLives > 0 ? message : "Seus corações acabaram. Recomece a expedição para tentar novamente!", {
      title: nextLives > 0 ? "Observe a dica e tente novamente" : "Fim da expedição",
    });

    logEvent({
      type: "item_incorrect",
      phase: "centro-oeste",
      level: 1,
      item: currentMission.id,
    });

    if (x !== undefined && y !== undefined) showWrongMarker(x, y);

    if (nextLives <= 0) {
      if (playSound) playErrorSound();
      setGameStatus("game-over");
      return;
    }

    if (playSound) playErrorSound();
    setTimerNonce((value) => value + 1);
    unlockTimeoutRef.current = setTimeout(() => { actionLockedRef.current = false; }, 400);
  }

  function handleMapClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (gameStatus !== "playing") return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    loseLife("Ainda não é esse ponto. Observe a dica e tente novamente!", x, y);
  }

  function handleHotspotClick(
    event: ReactMouseEvent<HTMLButtonElement>,
    mission: CentroOesteMission,
  ) {
    event.stopPropagation();
    if (gameStatus !== "playing" || actionLockedRef.current || discoveredIds.includes(mission.id)) return;

    if (mission.id !== currentMission.id) {
      loseLife(
        "Você encontrou outro elemento, mas ele não é o alvo desta missão.",
        mission.x,
        mission.y,
      );
      return;
    }

    actionLockedRef.current = true;
    showSuccess(mission.fact, { title: `${mission.name} encontrado!` });
    playSuccessSound();
    addPoints(POINTS_PER_CORRECT_ANSWER);
    levelScoreRef.current += POINTS_PER_CORRECT_ANSWER;
    correctAnswersRef.current += 1;
    setDiscoveredIds((current) => [...current, mission.id]);
    setSelectedDiscovery(mission);
    setFeedback(null);
    setWrongMarker(null);
    setGameStatus("discovery");

    logEvent({
      type: "item_correct",
      phase: "centro-oeste",
      level: 1,
      item: mission.id,
    });
  }

  function handleTimeout() {
    if (gameStatus !== "playing" || actionLockedRef.current) return;
    playTimeoutSound();
    loseLife(
      "O tempo acabou! Você perdeu um coração e ganhou mais 30 segundos.",
      undefined,
      undefined,
      false,
    );
  }

  async function finishPhase() {
    setGameStatus("saving");
    setFeedback(null);

    const result = await completeAttempt({
      score: levelScoreRef.current,
      correctAnswers: correctAnswersRef.current,
      incorrectAnswers: incorrectAnswersRef.current,
    });

    if (!result) {
      notifyError("Tente concluir novamente.", { title: "Não foi possível salvar sua conquista" });
      setFeedback("Não foi possível salvar sua conquista. Tente concluir novamente.");
      setGameStatus("discovery");
      return;
    }

    await refreshState();
    logEvent({ type: "level_complete", phase: "centro-oeste", level: 1 });
    setSelectedDiscovery(null);
    setGameStatus(result.passed ? "complete" : "game-over");
  }

  function continueAfterDiscovery() {
    clearFeedback();
    if (discoveredIds.length === TOTAL_MISSIONS) {
      void finishPhase();
      return;
    }

    setCurrentIndex((value) => value + 1);
    actionLockedRef.current = false;
    setLives(MAX_LIVES);
    livesRef.current = MAX_LIVES;
    setSelectedDiscovery(null);
    setFeedback(null);
    setTimerNonce((value) => value + 1);
    setGameStatus("playing");
  }

  function restartPhase() {
    resetScore();
    resetLocalGame();
    setGameStatus("intro");
  }

  const showBoard = ["playing", "discovery", "saving"].includes(gameStatus);

  return (
    <section ref={feedbackRef} className="centro-oeste-phase">
      <header className="centro-oeste-phase__header">
        <div>
          <h1>🗺️ Guardiões do Centro-Oeste</h1>
          <p>
            Encontre os oito alvos no mapa para conquistar a Medalha do Centro-Oeste.
          </p>
        </div>

        <div className="centro-oeste-phase__progress" aria-label={`${discoveredIds.length} de 8 descobertas`}>
          <div className="centro-oeste-phase__progress-label">
            <span>{discoveredIds.length}/8 descobertos</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="centro-oeste-phase__progress-track">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      {(gameStatus === "intro" || gameStatus === "starting") && (
        <GameCard className="centro-oeste-phase__state-card">
          <span className="centro-oeste-phase__state-icon">🔎</span>
          <h2>Caça às descobertas</h2>
          <p>
            Cada missão tem três corações e 30 segundos por tentativa. Os alvos
            aparecem em ordem diferente a cada partida.
          </p>
          <InstructionAudio
            text="Olá, explorador do Centro-Oeste! Observe o mapa e encontre cada alvo indicado. Você tem três corações e 30 segundos para cada missão. Quando tiver certeza, toque no ponto correto e siga a dica para descobrir mais."
            audioSrc="/audio/centro-oeste.mp3"
          />
          {feedback && <p className="centro-oeste-phase__error">{feedback}</p>}
          <button
            type="button"
            onClick={() => void startGame()}
            disabled={sessionStatus === "loading" || gameStatus === "starting"}
          >
            {sessionStatus === "loading" || gameStatus === "starting"
              ? "Conectando..."
              : "Começar expedição"}
          </button>
        </GameCard>
      )}

      {showBoard && currentMission && (
        <>
          <div className="centro-oeste-phase__topline">
            <GameCard className="centro-oeste-phase__mission-card">
              <div>
                <span className="centro-oeste-phase__eyebrow">
                  MISSÃO {currentIndex + 1} DE {TOTAL_MISSIONS} — {currentMission.biome.toUpperCase()}
                </span>
                <h2>🎯 Encontre: {currentMission.name}</h2>
                <p>{currentMission.clue}</p>
                {feedback && <p className="centro-oeste-phase__feedback">{feedback}</p>}
              </div>

              <div className="centro-oeste-phase__lives" aria-label={`${lives} corações restantes`}>
                {Array.from({ length: MAX_LIVES }, (_, index) => (
                  <span key={index} className={index < lives ? "" : "centro-oeste-phase__heart--lost"}>
                    {index < lives ? "❤️" : "🖤"}
                  </span>
                ))}
              </div>
            </GameCard>
            <ScoreDisplay />
          </div>

          <MissionTimer
            key={`${currentMission.id}-${timerNonce}`}
            durationSeconds={MISSION_TIME_SECONDS}
            isActive={gameStatus === "playing"}
            onExpire={handleTimeout}
            label="Tempo para encontrar"
          />

          <div
            className="centro-oeste-phase__map"
            onClick={handleMapClick}
            aria-label="Mapa ilustrado do Cerrado e do Pantanal"
          >
            <img
              src={centroOesteMap}
              alt="Paisagem ilustrada do Pantanal à esquerda e do Cerrado à direita"
              draggable={false}
            />

            {missions.map((mission) => {
              const discovered = discoveredIds.includes(mission.id);
              return (
                <button
                  key={mission.id}
                  type="button"
                  className={`centro-oeste-phase__hotspot ${
                    discovered ? "centro-oeste-phase__hotspot--discovered" : ""
                  }`}
                  style={{
                    left: `${mission.x}%`,
                    top: `${mission.y}%`,
                    width: `${mission.size}%`,
                    aspectRatio: "1",
                  }}
                  onClick={(event) => handleHotspotClick(event, mission)}
                  aria-label={discovered ? `${mission.name} descoberto` : `Verificar este ponto do mapa`}
                >
                  {discovered ? "✓" : ""}
                </button>
              );
            })}

            {wrongMarker && (
              <span
                key={wrongMarker.id}
                className="centro-oeste-phase__wrong-marker"
                style={{ left: `${wrongMarker.x}%`, top: `${wrongMarker.y}%` }}
                aria-hidden="true"
              >
                ✕
              </span>
            )}
          </div>

          <section className="centro-oeste-phase__album" aria-labelledby="album-title">
            <h2 id="album-title">Álbum de descobertas</h2>
            <div className="centro-oeste-phase__album-grid">
              {missions.map((mission) => {
                const discovered = discoveredIds.includes(mission.id);
                return (
                  <article
                    key={mission.id}
                    className={`centro-oeste-phase__album-card ${
                      discovered ? "centro-oeste-phase__album-card--discovered" : ""
                    }`}
                  >
                    <span>{discovered ? mission.icon : "?"}</span>
                    <strong>{discovered ? mission.name : "???"}</strong>
                    <small>{discovered ? mission.biome : "A descobrir"}</small>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

      {gameStatus === "game-over" && (
        <GameCard className="centro-oeste-phase__state-card centro-oeste-phase__state-card--danger">
          <span className="centro-oeste-phase__state-icon">💔</span>
          <h2>Fim da expedição</h2>
          <p>Os três corações acabaram. Recomece para receber uma nova ordem de missões.</p>
          <button type="button" onClick={restartPhase}>Recomeçar fase</button>
          <button type="button" className="centro-oeste-phase__secondary" onClick={() => navigate("/mapa")}>
            Voltar ao mapa
          </button>
        </GameCard>
      )}

      {gameStatus === "complete" && (
        <GameCard className="centro-oeste-phase__state-card centro-oeste-phase__state-card--success">
          <span className="centro-oeste-phase__state-icon">🏅</span>
          <h2>Medalha do Centro-Oeste conquistada!</h2>
          <p>Você encontrou as oito descobertas e ajudou a proteger o Cerrado e o Pantanal.</p>
          <button type="button" onClick={() => navigate("/mapa")}>Voltar ao mapa</button>
        </GameCard>
      )}

      {(gameStatus === "discovery" || gameStatus === "saving") && selectedDiscovery && (
        <div className="centro-oeste-phase__dialog-backdrop" role="presentation">
          <article className="centro-oeste-phase__dialog" role="dialog" aria-modal="true" aria-labelledby="discovery-title">
            <span className="centro-oeste-phase__dialog-icon">{selectedDiscovery.icon}</span>
            <p className="centro-oeste-phase__dialog-kicker">✅ Descoberta registrada</p>
            <h2 id="discovery-title">{selectedDiscovery.name}</h2>
            <p><strong>Você sabia?</strong> {selectedDiscovery.fact}</p>
            <p className="centro-oeste-phase__preservation">
              🌱 <strong>Dica de preservação:</strong> {selectedDiscovery.preservationTip}
            </p>
            {feedback && <p className="centro-oeste-phase__error">{feedback}</p>}
            <button type="button" onClick={continueAfterDiscovery} disabled={gameStatus === "saving"}>
              {gameStatus === "saving"
                ? "Salvando conquista..."
                : discoveredIds.length === TOTAL_MISSIONS
                  ? "Conquistar medalha"
                  : "Próxima missão"}
            </button>
          </article>
        </div>
      )}
    </section>
  );
}

export default CenterWestPhase;
