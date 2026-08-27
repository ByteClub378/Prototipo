import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import MissionHeader from "../../../components/game/MissionHeader";
import LevelBanner from "../../../components/game/LevelBanner";
import GameCard from "../../../components/ui/GameCard";
import ProgressBar from "../../../components/ui/ProgressBar";
import FeedbackMessage from "../../../components/game/FeedbackMessage";
import MissionTimer from "../../../components/game/MissionTimer";
import { useProgress } from "../../../context/ProgressContext";
import { HABITATS, getItemById, type MissionItem } from "../../../data/missions/northMission";
import { NORTH_LEVELS } from "../../../data/missions/northLevels";
import { playSuccessSound, playErrorSound, playTimeoutSound } from "../../../utils/sound";
import { logEvent } from "../../../utils/telemetry";
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

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function NorthPhase() {
  const navigate = useNavigate();
  const { completeRegion } = useProgress();

  const [levelIndex, setLevelIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [levelComplete, setLevelComplete] = useState(false);
  const [missionComplete, setMissionComplete] = useState(false);

  // Modo tray (nível 1, não sequencial)
  const [placedIds, setPlacedIds] = useState<Set<string>>(new Set());

  // Modo sequencial (níveis 2 a 6)
  const [itemOrder, setItemOrder] = useState<string[]>([]);
  const [currentItemPos, setCurrentItemPos] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0); // rodadas da inversão de categoria

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [timerNonce, setTimerNonce] = useState(0);

  const level = NORTH_LEVELS[levelIndex];
  const isLastLevel = levelIndex === NORTH_LEVELS.length - 1;

  const levelItems = useMemo(() => level.itemIds.map(getItemById), [level]);

  function startLevel(idx: number) {
    const nextLevel = NORTH_LEVELS[idx];
    setShowBanner(true);
    setLevelComplete(false);
    setPlacedIds(new Set());
    setCurrentItemPos(0);
    setRoundIdx(0);
    setFeedback(null);
    setTimerNonce((n) => n + 1);
    setItemOrder(nextLevel.sequential ? shuffle(nextLevel.itemIds) : nextLevel.itemIds);
  }

  useEffect(() => {
    startLevel(levelIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  function finishLevel() {
    logEvent({ type: "level_complete", phase: "north", level: level.id });
    if (isLastLevel) {
      completeRegion("norte");
      setMissionComplete(true);
    } else {
      setLevelComplete(true);
    }
  }

  function goToNextLevel() {
    setLevelIndex((idx) => idx + 1);
  }

  // ---------- Nível 1: tray (todos os itens visíveis ao mesmo tempo) ----------

  function handleTrayDrop(habitatId: string) {
    if (!draggingId) return;
    const item = getItemById(draggingId);

    if (item.habitatId === habitatId) {
      playSuccessSound();
      setFeedback({ type: "success", title: "Muito bem!", message: item.fact });
      setPlacedIds((prev) => {
        const next = new Set(prev).add(item.id);
        if (next.size === level.itemIds.length) {
          setTimeout(finishLevel, 400);
        }
        return next;
      });
    } else {
      playErrorSound();
      setFeedback({
        type: "error",
        title: "Quase!",
        message: "Esse elemento não pertence a esse ambiente. Observe novamente e tente outra vez.",
      });
    }
    setDraggingId(null);
  }

  // ---------- Níveis 2 a 6: um item por vez ----------

  const currentItemId = itemOrder[currentItemPos];
  const currentItem: MissionItem | undefined = currentItemId ? getItemById(currentItemId) : undefined;
  const targetHabitat = level.mechanic === "inverted" ? HABITATS[roundIdx] : undefined;

  const zones: Zone[] =
    level.mechanic === "inverted"
      ? [
          { id: "sim", name: "Pertence", icon: "✅" },
          { id: "nao", name: "Não pertence", icon: "❌" },
        ]
      : [
          ...HABITATS.map((h) => ({ id: h.id, name: h.name, icon: h.icon })),
          ...(level.includeDistractors
            ? [{ id: "nenhum", name: "Não pertence a nenhum", icon: "🚫" }]
            : []),
        ];

  function getCorrectZoneId(item: MissionItem): string {
    if (level.mechanic === "inverted" && targetHabitat) {
      return item.habitatId === targetHabitat.id ? "sim" : "nao";
    }
    if (item.habitatId === null) return "nenhum";
    return item.habitatId;
  }

  function advanceSequentialItem() {
    const nextPos = currentItemPos + 1;
    if (nextPos < itemOrder.length) {
      setCurrentItemPos(nextPos);
      setTimerNonce((n) => n + 1);
      setFeedback(null);
      return;
    }

    // Fim da lista de itens desta rodada
    if (level.mechanic === "inverted" && roundIdx < HABITATS.length - 1) {
      setRoundIdx((r) => r + 1);
      setItemOrder(shuffle(level.itemIds));
      setCurrentItemPos(0);
      setTimerNonce((n) => n + 1);
      setFeedback(null);
      return;
    }

    finishLevel();
  }

  function handleSequentialDrop(zoneId: string) {
    if (!currentItem) return;
    const correctZoneId = getCorrectZoneId(currentItem);

    if (zoneId === correctZoneId) {
      playSuccessSound();
      logEvent({ type: "item_correct", phase: "north", level: level.id, item: currentItem.id });
      setFeedback({ type: "success", title: "Muito bem!", message: currentItem.fact });
      setTimeout(advanceSequentialItem, 1100);
    } else {
      playErrorSound();
      logEvent({ type: "item_incorrect", phase: "north", level: level.id, item: currentItem.id });
      setFeedback({
        type: "error",
        title: "Quase!",
        message: "Esse elemento não pertence a esse ambiente. Observe novamente e tente outra vez.",
      });
    }
    setDraggingId(null);
  }

  function handleItemTimeout() {
    if (!currentItem || !level.perItemTimers) return;
    playTimeoutSound();
    const duration = level.perItemTimers[Math.min(currentItemPos, level.perItemTimers.length - 1)];
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
      message: `Observe a dica e tente novamente: ${currentItem.fact}`,
    });
    setTimerNonce((n) => n + 1);
  }

  function handleDragStart(itemId: string) {
    setDraggingId(itemId);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  const timerDuration = level.perItemTimers
    ? level.perItemTimers[Math.min(currentItemPos, level.perItemTimers.length - 1)]
    : null;
  const isTimerActive = timerDuration !== null && !showBanner && !levelComplete && !missionComplete;

  const progressCurrent = level.sequential ? currentItemPos : placedIds.size;
  const progressTotal = level.sequential ? itemOrder.length : level.itemIds.length;

  const missionInstruction =
    level.mechanic === "inverted" && targetHabitat
      ? `${targetHabitat.icon} ${targetHabitat.name}: esse elemento pertence aqui?`
      : level.instruction;

  return (
    <div className="north-phase">
      <MissionHeader
        title={`Nível ${level.id} de ${NORTH_LEVELS.length} — ${level.title}`}
        instruction={missionInstruction}
      />

      {missionComplete ? (
        <GameCard className="north-phase__complete">
          <h2>🏅 Medalha do Norte conquistada!</h2>
          <p>Você completou todos os desafios e aprendeu sobre a fauna e a flora da região Norte.</p>
          <button className="north-phase__back-button" onClick={() => navigate("/mapa")}>
            Voltar ao mapa
          </button>
        </GameCard>
      ) : showBanner ? (
        <LevelBanner
          level={level}
          totalLevels={NORTH_LEVELS.length}
          onStart={() => setShowBanner(false)}
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
          {isTimerActive && timerDuration !== null && (
            <MissionTimer
              key={`${levelIndex}-${roundIdx}-${currentItemPos}-${timerNonce}`}
              durationSeconds={timerDuration}
              isActive={isTimerActive}
              onExpire={handleItemTimeout}
            />
          )}

          {!level.sequential ? (
            <div className="north-phase__board">
              <div className="north-phase__zones">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="north-phase__zone"
                    onDragOver={handleDragOver}
                    onDrop={() => handleTrayDrop(zone.id)}
                  >
                    <span className="north-phase__zone-icon">{zone.icon}</span>
                    <span className="north-phase__zone-name">{zone.name}</span>
                    <div className="north-phase__zone-items">
                      {levelItems
                        .filter((item) => placedIds.has(item.id) && item.habitatId === zone.id)
                        .map((item) => (
                          <span key={item.id} className="north-phase__zone-item">
                            {item.icon}
                          </span>
                        ))}
                    </div>
                    <span className="north-phase__zone-hint">Solte aqui</span>
                  </div>
                ))}
              </div>

              <div className="north-phase__tray">
                {levelItems
                  .filter((item) => !placedIds.has(item.id))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="north-phase__draggable"
                      draggable
                      onDragStart={() => handleDragStart(item.id)}
                    >
                      <span>{item.icon}</span>
                      <span className="north-phase__draggable-name">{item.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            currentItem && (
              <div className="north-phase__board north-phase__board--single">
                <div
                  className="north-phase__current-item"
                  draggable
                  onDragStart={() => handleDragStart(currentItem.id)}
                >
                  <span className="north-phase__current-icon">{currentItem.icon}</span>
                  <span>{currentItem.name}</span>
                </div>

                <div className="north-phase__zones north-phase__zones--row">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="north-phase__zone"
                      onDragOver={handleDragOver}
                      onDrop={() => handleSequentialDrop(zone.id)}
                    >
                      <span className="north-phase__zone-icon">{zone.icon}</span>
                      <span className="north-phase__zone-name">{zone.name}</span>
                      <span className="north-phase__zone-hint">Solte aqui</span>
                    </div>
                  ))}
                </div>
              </div>
            )
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
