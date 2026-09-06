import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MissionHeader from "../../../components/game/MissionHeader";
import LevelBanner from "../../../components/game/LevelBanner";
import GameCard from "../../../components/ui/GameCard";
import ProgressBar from "../../../components/ui/ProgressBar";
import FeedbackMessage from "../../../components/game/FeedbackMessage";
import MissionTimer from "../../../components/game/MissionTimer";
import ScoreDisplay from "../../../components/game/ScoreDisplay";
import { useProgress } from "../../../context/ProgressContext";
import { useScore } from "../../../context/ScoreContext";
import { NORDESTE_QUESTIONS, type QuizOption } from "../../../data/missions/nordesteQuestions";
import { NORDESTE_LEVELS } from "../../../data/missions/nordesteLevels";
import { playSuccessSound, playErrorSound, playTimeoutSound } from "../../../utils/sound";
import { logEvent } from "../../../utils/telemetry";
import { useAttempt } from "../../../hooks/useAttempt";
import { POINTS_PER_CORRECT_ANSWER, POINTS_PER_INCORRECT_ANSWER } from "../../../data/scoring";
import "./NordestePhase.css";

const QUESTION_MAP = new Map(NORDESTE_QUESTIONS.map((q) => [q.id, q]));

const OPTION_IMAGES: Record<string, string> = {
  acaraje: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=640&q=80",
  coxinha: "https://images.unsplash.com/photo-1627054240989-42f7bb0f9d5f?auto=format&fit=crop&w=640&q=80",
  tapioca: "https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&w=640&q=80",
  "pao-de-queijo": "https://images.unsplash.com/photo-1619623837652-3e7c7d9f6d67?auto=format&fit=crop&w=640&q=80",
  caatinga: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=640&q=80",
  amazonia: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=640&q=80",
  cerrado: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=640&q=80",
  "mata-atlantica": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=640&q=80",
  mandacaru: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=640&q=80",
  "vitoria-regia": "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=640&q=80",
  "pau-brasil": "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=640&q=80",
  ipe: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=640&q=80",
  frevo: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=640&q=80",
  samba: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=640&q=80",
  axe: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=640&q=80",
  sertanejo: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=640&q=80",
  "sao-joao": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=640&q=80",
  carnaval: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=640&q=80",
  reveillon: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=640&q=80",
  "festa-do-peao": "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=640&q=80",
  pelourinho: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=640&q=80",
  "ouro-preto": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=640&q=80",
  ipanema: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=640&q=80",
  "asa-norte": "https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=640&q=80",
  forro: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=640&q=80",
  funk: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=640&q=80",
  pamonha: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=640&q=80",
  farofa: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=640&q=80",
  polenta: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=640&q=80",
  cordel: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=640&q=80",
  romance: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=640&q=80",
  quadrinhos: "https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?auto=format&fit=crop&w=640&q=80",
  fabula: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=640&q=80",
  "renda-de-bilro": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=640&q=80",
  "bumba-meu-boi": "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=640&q=80",
  "serra-da-capivara": "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=640&q=80",
  ceramica: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=640&q=80",
  vidro: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=640&q=80",
  "tricô europeu": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=640&q=80",
};

const QUESTION_CATEGORIES: Record<string, string> = {
  caatinga: "Vegetação",
  mandacaru: "Vegetação",
  frevo: "Patrimônio cultural",
  forro: "Patrimônio cultural",
  cordel: "Patrimônio cultural",
  "renda-de-bilro": "Patrimônio cultural",
  acaraje: "Gastronomia",
  tapioca: "Gastronomia",
  "sao-joao": "Patrimônio cultural",
  pelourinho: "Patrimônio cultural",
  "bumba-meu-boi": "Patrimônio cultural",
  "serra-da-capivara": "Patrimônio cultural",
};

const QUESTION_STATES: Record<string, string> = {
  tapioca: "Alagoas",
  acaraje: "Bahia",
  "renda-de-bilro": "Ceará",
  "bumba-meu-boi": "Maranhão",
  "sao-joao": "Paraíba",
  frevo: "Pernambuco",
  "serra-da-capivara": "Piauí",
  mandacaru: "Rio Grande do Norte",
  cordel: "Sergipe",
};

interface Feedback {
  type: "success" | "error";
  title: string;
  message: string;
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function NordestePhase() {
  const navigate = useNavigate();
  const { completeRegion } = useProgress();
  const { score, addPoints } = useScore();
  const { startAttempt, completeAttempt } = useAttempt("nordeste");
  const levelScoreRef = useRef(0);
  const levelCorrectRef = useRef(0);
  const levelIncorrectRef = useRef(0);

  const [levelIndex, setLevelIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [levelComplete, setLevelComplete] = useState(false);
  const [missionComplete, setMissionComplete] = useState(false);

  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [currentPos, setCurrentPos] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [timerNonce, setTimerNonce] = useState(0);

  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleAdvance(callback: () => void, delay: number) {
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = setTimeout(callback, delay);
  }

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  const level = NORDESTE_LEVELS[levelIndex];
  const isLastLevel = levelIndex === NORDESTE_LEVELS.length - 1;

  function startLevel(idx: number) {
    const nextLevel = NORDESTE_LEVELS[idx];
    setShowBanner(true);
    setLevelComplete(false);
    setCurrentPos(0);
    setFeedback(null);
    setSelectedOptionId(null);
    setIsResolving(false);
    setTimerNonce((n) => n + 1);
    setQuestionOrder(nextLevel.shuffleQuestions ? shuffle(nextLevel.questionIds) : nextLevel.questionIds);
    levelScoreRef.current = 0;
    levelCorrectRef.current = 0;
    levelIncorrectRef.current = 0;
  }

  useEffect(() => {
    startLevel(levelIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

    function finishLevel() {
    logEvent({ type: "level_complete", phase: "nordeste", level: level.id });
    completeAttempt({
      score: levelScoreRef.current,
      correctAnswers: levelCorrectRef.current,
      incorrectAnswers: levelIncorrectRef.current,
    });
    if (isLastLevel) {
      completeRegion("nordeste");
      setMissionComplete(true);
    } else {
      setLevelComplete(true);
    }
  }

  function handleStartLevel() {
    setShowBanner(false);
    startAttempt(level.id);
  }

  function advanceQuestion() {
    setIsResolving(false);
    setSelectedOptionId(null);

    const nextPos = currentPos + 1;
    if (nextPos < questionOrder.length) {
      setCurrentPos(nextPos);
      setTimerNonce((n) => n + 1);
      setFeedback(null);
      return;
    }

    finishLevel();
  }

  const currentQuestionId = questionOrder[currentPos];
  const currentQuestion = currentQuestionId ? QUESTION_MAP.get(currentQuestionId) : undefined;

  const currentOptions: QuizOption[] = useMemo(() => {
    if (!currentQuestion) return [];
    if (!level.simpleOptions) return shuffle(currentQuestion.options);

    const correct = currentQuestion.options.find((o) => o.correct);
    const simpleWrong = currentQuestion.options.find((o) => o.simple);
    return shuffle([correct, simpleWrong].filter(Boolean) as QuizOption[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionId, levelIndex]);

  function handleSelectOption(option: QuizOption) {
    if (!currentQuestion || isResolving) return;

    setSelectedOptionId(option.id);

    if (option.correct) {
      playSuccessSound();
      addPoints(POINTS_PER_CORRECT_ANSWER);
      levelScoreRef.current += POINTS_PER_CORRECT_ANSWER;
      levelCorrectRef.current += 1;
      logEvent({ type: "item_correct", phase: "nordeste", level: level.id, item: currentQuestion.id });
      setFeedback({ type: "success", title: "Muito bem!", message: currentQuestion.fact });
      setIsResolving(true);
      scheduleAdvance(advanceQuestion, 1100);
    } else {
      playErrorSound();
      addPoints(POINTS_PER_INCORRECT_ANSWER);
      levelIncorrectRef.current += 1;
      levelScoreRef.current = Math.max(0, levelScoreRef.current + POINTS_PER_INCORRECT_ANSWER);
      logEvent({ type: "item_incorrect", phase: "nordeste", level: level.id, item: currentQuestion.id });
      const correctOption = currentQuestion.options.find((o) => o.correct);
      setFeedback({
        type: "error",
        title: "Quase!",
        message: `A resposta certa era "${correctOption?.text ?? ""}". ${currentQuestion.fact}`,
      });
      setIsResolving(true);
      scheduleAdvance(advanceQuestion, 1100);
    }
  }

  function handleTimeout() {
    if (!currentQuestion || !level.perQuestionTimers || isResolving) return;

    playTimeoutSound();
    levelIncorrectRef.current += 1;
    const duration = level.perQuestionTimers[Math.min(currentPos, level.perQuestionTimers.length - 1)];
    logEvent({
      type: "time_expired",
      phase: "nordeste",
      level: level.id,
      item: currentQuestion.id,
      responseTime: duration,
    });
    setFeedback({
      type: "error",
      title: "⏰ Tempo esgotado!",
      message: `Vamos aprender e seguir em frente: ${currentQuestion.fact}`,
    });
    setIsResolving(true);
    scheduleAdvance(advanceQuestion, 1400);
  }

  function goToNextLevel() {
    setLevelIndex((idx) => idx + 1);
  }

  const timerDuration = level.perQuestionTimers
    ? level.perQuestionTimers[Math.min(currentPos, level.perQuestionTimers.length - 1)]
    : null;
  const isTimerActive = timerDuration !== null && !showBanner && !levelComplete && !missionComplete && !isResolving;

  return (
    <div className="nordeste-phase">
      <MissionHeader
        title={`Nível ${level.id} de ${NORDESTE_LEVELS.length} — ${level.title}`}
        instruction={level.instruction}
      />

      <ScoreDisplay />

      {missionComplete ? (
        <GameCard className="nordeste-phase__complete">
          <h2>🏅 Medalha do Nordeste conquistada!</h2>
          <p>Você aprendeu sobre a cultura, a gastronomia e a natureza do Nordeste brasileiro.</p>
          <p className="nordeste-phase__final-score">⭐ Pontuação: {score}</p>
          <button className="nordeste-phase__back-button" onClick={() => navigate("/mapa")}>
            Voltar ao mapa
          </button>
        </GameCard>
      ) : showBanner ? (
        <LevelBanner 
          level={level} 
          totalLevels={NORDESTE_LEVELS.length} 
          onStart={handleStartLevel} 
        />
      ) : levelComplete ? (
        <GameCard className="nordeste-phase__complete">
          <h2>✅ Nível concluído!</h2>
          <p>Muito bem! Vamos para o próximo desafio.</p>
          <button className="nordeste-phase__back-button" onClick={goToNextLevel}>
            Próximo nível
          </button>
        </GameCard>
      ) : (
        currentQuestion && (
          <>
            {isTimerActive && timerDuration !== null && (
              <MissionTimer
                key={`${levelIndex}-${currentPos}-${timerNonce}`}
                durationSeconds={timerDuration}
                isActive={isTimerActive}
                onExpire={handleTimeout}
              />
            )}

            <GameCard className="nordeste-phase__question">
              <div className="nordeste-phase__question-topline">
                <span className="nordeste-phase__icon">{currentQuestion.icon}</span>
                <span className="nordeste-phase__category">
                  {QUESTION_STATES[currentQuestion.id]} · {QUESTION_CATEGORIES[currentQuestion.id] ?? "Cultura nordestina"}
                </span>
              </div>
              <p className="nordeste-phase__prompt">{currentQuestion.prompt}</p>

              <div className="nordeste-phase__options">
                {currentOptions.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const stateClass = isSelected
                    ? option.correct
                      ? "nordeste-phase__option--correct"
                      : "nordeste-phase__option--incorrect"
                    : "";

                  return (
                    <button
                      key={option.id}
                      className={`nordeste-phase__option ${stateClass}`}
                      onClick={() => handleSelectOption(option)}
                      disabled={isResolving}
                    >
                      <span className="nordeste-phase__option-image-wrap">
                        <img
                          className="nordeste-phase__option-image"
                          src={OPTION_IMAGES[option.id]}
                          alt=""
                          loading="lazy"
                        />
                        <span className="nordeste-phase__option-emoji">{currentQuestion.icon}</span>
                      </span>
                      <span className="nordeste-phase__option-text">{option.text}</span>
                    </button>
                  );
                })}
              </div>
            </GameCard>

            {feedback && (
              <FeedbackMessage type={feedback.type} title={feedback.title} message={feedback.message} />
            )}
          </>
        )
      )}

      {!missionComplete && !showBanner && (
        <ProgressBar current={currentPos} total={questionOrder.length} />
      )}
    </div>
  );
}

export default NordestePhase;