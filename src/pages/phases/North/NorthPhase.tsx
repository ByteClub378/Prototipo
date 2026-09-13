import { useEffect, useMemo, useState, useRef, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import MissionHeader from "../../../components/game/MissionHeader";
import LevelBanner from "../../../components/game/LevelBanner";
import GameCard from "../../../components/ui/GameCard";
import ProgressBar from "../../../components/ui/ProgressBar";
import FeedbackMessage from "../../../components/game/FeedbackMessage";
import MissionTimer from "../../../components/game/MissionTimer";
import { useProgress } from "../../../context/ProgressContext";
import { HABITATS, getItemById, type MissionItem } from "../../../data/missions/northMission";
import { createNorthLevels } from "../../../data/missions/northLevels";
import { playSuccessSound, playErrorSound, playTimeoutSound } from "../../../utils/sound";
import { logEvent } from "../../../utils/telemetry";
import { POINTS_PER_CORRECT_ANSWER, POINTS_PER_INCORRECT_ANSWER } from "../../../data/scoring";
import { useScore } from "../../../context/ScoreContext";
import { useAttempt } from "../../../hooks/useAttempt";
import { shuffle } from "../../../utils/random";
import ScoreDisplay from "../../../components/game/ScoreDisplay";
import "./NorthPhase.css";


interface Feedback {
  type: "success" | "error";
  title: string;
  message: string;
}

interface Zone {
  id: string;
  name: string;
  icon: string;
}

const MINIMUM_ACCURACY = 0.6;

function NorthPhase() {
  const navigate = useNavigate();
  const { completeRegion } = useProgress();
  const { addPoints, resetScore } = useScore();
  const { startAttempt, completeAttempt } = useAttempt("norte");

  // Contadores da tentativa ATUAL (resetam a cada nível) — usados só pro
  // PATCH /attempts/{id}/complete, não se confundem com o placar global.
  const levelScoreRef = useRef(0);
  const levelCorrectRef = useRef(0);
  const levelIncorrectRef = useRef(0);
  const missionCorrectRef = useRef(0);
  const missionAnsweredRef = useRef(0);

  const [levels, setLevels] = useState(createNorthLevels);
  const [levelIndex, setLevelIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [levelComplete, setLevelComplete] = useState(false);
  const [missionComplete, setMissionComplete] = useState(false);
  const [missionFailed, setMissionFailed] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(0);

  // Modo sequencial das três rodadas.
  const [itemOrder, setItemOrder] = useState<string[]>([]);
  const [currentItemPos, setCurrentItemPos] = useState(0);

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isItemSelected, setIsItemSelected] = useState(false);
  const [timerNonce, setTimerNonce] = useState(0);
  const [isResolving, setIsResolving] = useState(false);

  const level = levels[levelIndex];
  const isLastLevel = levelIndex === levels.length - 1;

  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleAdvance(callback: () => void, delay: number) {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }
    advanceTimeoutRef.current = setTimeout(callback, delay);
  }

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  function startLevel(idx: number, showLevelBanner = idx === 0) {
    const nextLevel = levels[idx];
    setShowBanner(showLevelBanner);
    setLevelComplete(false);
    setCurrentItemPos(0);
    setFeedback(null);
    setIsResolving(false);
    setIsItemSelected(false);
    setTimerNonce((n) => n + 1);
    setItemOrder(nextLevel.itemIds);
    levelScoreRef.current = 0;
    levelCorrectRef.current = 0;
    levelIncorrectRef.current = 0;
  }

  useEffect(() => {
    startLevel(levelIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

    function finishLevel() {
    logEvent({ type: "level_complete", phase: "north", level: level.id });
    completeAttempt({
      score: levelScoreRef.current,
      correctAnswers: levelCorrectRef.current,
      incorrectAnswers: levelIncorrectRef.current,
    });
    if (isLastLevel) {
      const answered = missionAnsweredRef.current;
      const correct = missionCorrectRef.current;
      const accuracy = answered > 0 ? correct / answered : 0;

      setFinalAccuracy(accuracy);
      if (accuracy >= MINIMUM_ACCURACY) {
        completeRegion("norte");
        setMissionComplete(true);
      } else {
        setMissionFailed(true);
      }
    } else {
      setLevelIndex((idx) => idx + 1);
    }
  }

  function handleStartLevel() {
    setShowBanner(false);
    if (levelIndex === 0) {
      missionCorrectRef.current = 0;
      missionAnsweredRef.current = 0;
      setMissionFailed(false);
      setFinalAccuracy(0);
    }
    startAttempt(level.id);
  }

  function restartMission() {
    const nextLevels = createNorthLevels();
    resetScore();
    setLevels(nextLevels);
    missionCorrectRef.current = 0;
    missionAnsweredRef.current = 0;
    levelScoreRef.current = 0;
    levelCorrectRef.current = 0;
    levelIncorrectRef.current = 0;
    setLevelIndex(0);
    setItemOrder(nextLevels[0].itemIds);
    setCurrentItemPos(0);
    setMissionFailed(false);
    setMissionComplete(false);
    setFinalAccuracy(0);
    setFeedback(null);
    setIsResolving(false);
    setIsItemSelected(false);
    setShowBanner(true);
    setTimerNonce((nonce) => nonce + 1);
  }

  function goToNextLevel() {
    setLevelIndex((idx) => idx + 1);
  }

  // ---------- Rodadas sequenciais ----------

  const currentItemId = itemOrder[currentItemPos];
  const currentItem: MissionItem | undefined = currentItemId ? getItemById(currentItemId) : undefined;
  const targetHabitat = level.mechanic === "inverted"
    ? HABITATS[currentItemPos % HABITATS.length]
    : undefined;

  const zones = useMemo<Zone[]>(
    () => level.mechanic === "inverted"
      ? [
          { id: "sim", name: "Pertence", icon: "✅" },
          { id: "nao", name: "Não pertence", icon: "❌" },
        ]
      : [
          ...HABITATS.map((h) => ({ id: h.id, name: h.name, icon: h.icon })),
          ...(level.includeDistractors
            ? [{ id: "nenhum", name: "Não pertence a nenhum", icon: "🚫" }]
            : []),
        ],
    [level.includeDistractors, level.mechanic],
  );

  function getCorrectZoneId(item: MissionItem): string {
    if (level.mechanic === "inverted" && targetHabitat) {
      return item.habitatId === targetHabitat.id ? "sim" : "nao";
    }
    if (item.habitatId === null) return "nenhum";
    return item.habitatId;
  }

  function advanceSequentialItem() {
    setIsResolving(false);
    const nextPos = currentItemPos + 1;
    if (nextPos < itemOrder.length) {
      setCurrentItemPos(nextPos);
      setIsItemSelected(false);
      setTimerNonce((n) => n + 1);
      setFeedback(null);
      return;
    }

    // Fim da lista de itens desta rodada
    finishLevel();
  }

  function handleSequentialDrop(zoneId: string) {
    if (!currentItem || isResolving) return;
    const correctZoneId = getCorrectZoneId(currentItem);
    missionAnsweredRef.current += 1;

    if (zoneId === correctZoneId) {
      missionCorrectRef.current += 1;
      playSuccessSound();
      addPoints(POINTS_PER_CORRECT_ANSWER);
      levelScoreRef.current += POINTS_PER_CORRECT_ANSWER;
      levelCorrectRef.current += 1;
      logEvent({ type: "item_correct", phase: "north", level: level.id, item: currentItem.id });
      setFeedback({ type: "success", title: "Muito bem!", message: currentItem.fact });
      setIsResolving(true);
      scheduleAdvance(advanceSequentialItem, 1100);
    } else {
      playErrorSound();
      addPoints(POINTS_PER_INCORRECT_ANSWER);
      levelIncorrectRef.current += 1;
      levelScoreRef.current = Math.max(0, levelScoreRef.current + POINTS_PER_INCORRECT_ANSWER);
      logEvent({ type: "item_incorrect", phase: "north", level: level.id, item: currentItem.id });
      const correctZone = zones.find((z) => z.id === correctZoneId);
      setFeedback({
        type: "error",
        title: "Quase!",
        message: `O lugar certo era "${correctZone?.name ?? ""}". ${currentItem.fact}`,
      });
      setIsResolving(true);
      scheduleAdvance(advanceSequentialItem, 1000);
    }
  }

  function handleItemTimeout() {
    if (!currentItem || isResolving) return;

    missionAnsweredRef.current += 1;

    playTimeoutSound();
    levelIncorrectRef.current += 1;
    const duration = level.durationSeconds;
    logEvent({
      type: "time_expired",
      phase: "north",
      level: level.id,
      item: currentItem.id,
      responseTime: duration,
    });
    setFeedback({
      type: "error",
      title: "⏰ Tempo esgotado!",
      message: `Vamos aprender e seguir em frente: ${currentItem.fact}`,
    });

    setIsResolving(true);
    scheduleAdvance(advanceSequentialItem, 1400);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
  }

  function handleItemDragStart() {
    setIsItemSelected(true);
  }

  function handleItemDragEnd() {
    setIsItemSelected(false);
  }

  const timerDuration = level.durationSeconds;
  const isTimerActive = !showBanner && !levelComplete && !missionComplete && !isResolving;

  const progressCurrent = currentItemPos + 1;
  const progressTotal = itemOrder.length;

  const shuffledZones = useMemo(
    () => currentItemId ? shuffle(zones) : zones,
    [zones, currentItemId],
  );

  const missionInstruction =
    level.mechanic === "inverted" && targetHabitat
      ? `${targetHabitat.icon} ${targetHabitat.name}: esse elemento pertence aqui?`
      : level.instruction;

  return (
    <div className="north-phase">
      <MissionHeader
        title={`Rodada ${level.id} de ${levels.length} — ${level.title}`}
        instruction={missionInstruction}
      />
      <ScoreDisplay />

      {missionComplete ? (
        <GameCard className="north-phase__complete">
          <span className="north-phase__medal">🏅</span>
          <h2>Medalha do Norte conquistada!</h2>
          <p>Aproveitamento: {Math.round(finalAccuracy * 100)}%</p>
          <button className="north-phase__back-button" onClick={() => navigate("/mapa")}>
            Voltar ao mapa
          </button>
        </GameCard>
      ) : missionFailed ? (
        <GameCard className="north-phase__failed">
          <span className="north-phase__failed-icon">🌱</span>
          <h2>Vamos tentar novamente?</h2>
          <p>
            Você conseguiu {Math.round(finalAccuracy * 100)}%. Para liberar o Nordeste,
            é necessário alcançar pelo menos 60%.
          </p>
          <button className="north-phase__retry-button" onClick={restartMission}>
            Tentar nova partida
          </button>
          <button className="north-phase__map-button" onClick={() => navigate("/mapa")}>
            Voltar ao mapa
          </button>
        </GameCard>
      ) : showBanner ? (
        <LevelBanner
          level={level}
          totalLevels={levels.length}
          onStart={handleStartLevel}
        />
      ) : levelComplete ? (
        <GameCard className="north-phase__complete">
          <h2>✅ Nível concluído!</h2>
          <p>Muito bem! Vamos para o próximo desafio.</p>
          <button className="north-phase__back-button" onClick={goToNextLevel}>
            Próximo nível
          </button>
        </GameCard>
      ) : (
        <>
          {
            <MissionTimer
              key={`${levelIndex}-${currentItemId}-${currentItemPos}-${timerNonce}`}
              durationSeconds={timerDuration}
              isActive={isTimerActive}
              onExpire={handleItemTimeout}
            />
          }

          {currentItem && (
              <div className="north-phase__board north-phase__board--single">
                <div
                  className={`north-phase__current-item ${isItemSelected ? "north-phase__current-item--selected" : ""}`}
                  draggable={!isResolving}
                  onClick={() => setIsItemSelected((selected) => !selected)}
                  onDragStart={handleItemDragStart}
                  onDragEnd={handleItemDragEnd}
                  aria-pressed={isItemSelected}
                >
                  <span className="north-phase__current-icon">{currentItem.icon}</span>
                  <span>{currentItem.name}</span>
                </div>

                <div className="north-phase__zones north-phase__zones--row">
                  {shuffledZones.map((zone) => (
                    <button
                      key={zone.id}
                      className="north-phase__zone"
                      onDragOver={handleDragOver}
                      onDrop={() => handleSequentialDrop(zone.id)}
                      onClick={() => handleSequentialDrop(zone.id)}
                      aria-label={`Enviar item para ${zone.name}`}
                    >
                      <span className="north-phase__zone-icon">{zone.icon}</span>
                      <span className="north-phase__zone-name">{zone.name}</span>
                      <span className="north-phase__zone-hint">Solte aqui</span>
                    </button>
                  ))}
                </div>
              </div>
          )}

          {feedback && (
            <FeedbackMessage type={feedback.type} title={feedback.title} message={feedback.message} />
          )}
        </>
      )}

      {!missionComplete && !showBanner && (
        <ProgressBar current={progressCurrent} total={progressTotal} />
      )}
    </div>
  );
}

export default NorthPhase;