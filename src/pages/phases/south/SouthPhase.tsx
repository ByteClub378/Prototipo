import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NarrationButton } from "../../../components/NarrationButton";
import ScoreDisplay from "../../../components/game/ScoreDisplay";
import { useScore } from "../../../context/ScoreContext";
import { useSession } from "../../../context/SessionContext";
import { useAttempt } from "../../../hooks/useAttempt";
import { POINTS_PER_CORRECT_ANSWER } from "../../../data/scoring";
import { createTopicTracker, type TopicId } from "../../../utils/topicResults";
import { narrations } from "../../../data/narrations";
import paranaA from "../../../assets/sul/parana-a.png";
import paranaB from "../../../assets/sul/parana-b.png";
import santaCatarinaA from "../../../assets/sul/santa-catarina-a.png";
import santaCatarinaB from "../../../assets/sul/santa-catarina-b.png";
import rioGrandeDoSulA from "../../../assets/sul/rio-grande-do-sul-a.png";
import rioGrandeDoSulB from "../../../assets/sul/rio-grande-do-sul-b.png";
import logoCruzeiroDoSul from "../../../assets/logo-cruzeiro-do-sul.png";
import "./SouthPhase.css";

type Spot = {
  id: number;
  positions: {
    left: { x: number; y: number };
    right: { x: number; y: number };
  };
  clue: string;
  topicId: TopicId;
};

type Stage = {
  state: string;
  title: string;
  icon: string;
  fact: string;
  images: {
    left: string;
    right: string;
  };
  spots: Spot[];
};

const STAGES: Stage[] = [
  {
    state: "Paraná",
    title: "Mistérios da Mata de Araucárias",
    icon: "🌲",
    fact: "A araucária é uma árvore nativa do Sul. Seu pinhão é um alimento tradicional da região.",
    images: { left: paranaA, right: paranaB },
    spots: [
      { id: 1, positions: { left: { x: 105, y: 125 }, right: { x: 245, y: 100 } }, clue: "O pássaro mudou de galho.", topicId: "fauna" },
      { id: 2, positions: { left: { x: 82, y: 548 }, right: { x: 82, y: 548 } }, clue: "A flor mudou de cor.", topicId: "flora" },
      { id: 3, positions: { left: { x: 365, y: 565 }, right: { x: 365, y: 565 } }, clue: "O barco está com um remo a menos.", topicId: "turismo" },
      { id: 4, positions: { left: { x: 582, y: 67 }, right: { x: 582, y: 67 } }, clue: "Uma nuvem mudou de formato.", topicId: "clima" },
      { id: 5, positions: { left: { x: 900, y: 430 }, right: { x: 900, y: 430 } }, clue: "Uma borboleta apareceu perto da margem.", topicId: "fauna" },
      { id: 6, positions: { left: { x: 800, y: 650 }, right: { x: 800, y: 650 } }, clue: "Um peixinho apareceu no rio.", topicId: "fauna" },
      { id: 7, positions: { left: { x: 250, y: 680 }, right: { x: 250, y: 680 } }, clue: "Uma flor pequena apareceu perto da margem.", topicId: "flora" },
    ],
  },
  {
    state: "Santa Catarina",
    title: "Segredos do Litoral Catarinense",
    icon: "🏖️",
    fact: "O litoral de Santa Catarina tem praias, dunas e lagoas. A baleia-franca também visita a região.",
    images: { left: santaCatarinaA, right: santaCatarinaB },
    spots: [
      { id: 1, positions: { left: { x: 180, y: 55 }, right: { x: 155, y: 20 } }, clue: "A gaivota mudou de posição.", topicId: "fauna" },
      { id: 2, positions: { left: { x: 150, y: 320 }, right: { x: 150, y: 320 } }, clue: "O guarda-sol mudou de cor.", topicId: "turismo" },
      { id: 3, positions: { left: { x: 740, y: 205 }, right: { x: 740, y: 205 } }, clue: "O veleiro está com a vela diferente.", topicId: "turismo" },
      { id: 4, positions: { left: { x: 490, y: 656 }, right: { x: 490, y: 656 } }, clue: "A concha mudou de cor.", topicId: "biomas" },
      { id: 5, positions: { left: { x: 838, y: 668 }, right: { x: 727, y: 668 } }, clue: "A estrela-do-mar mudou de lugar.", topicId: "fauna" },
      { id: 6, positions: { left: { x: 350, y: 580 }, right: { x: 350, y: 580 } }, clue: "Um caranguejo apareceu na areia.", topicId: "fauna" },
      { id: 7, positions: { left: { x: 900, y: 665 }, right: { x: 900, y: 665 } }, clue: "Uma concha apareceu perto da água.", topicId: "biomas" },
    ],
  },
  {
    state: "Rio Grande do Sul",
    title: "Pistas dos Campos do Pampa",
    icon: "🐎",
    fact: "O Pampa é uma paisagem de campos naturais. O chimarrão, feito com erva-mate, é uma tradição gaúcha.",
    images: { left: rioGrandeDoSulA, right: rioGrandeDoSulB },
    spots: [
      { id: 1, positions: { left: { x: 160, y: 400 }, right: { x: 160, y: 400 } }, clue: "A cauda do cavalo mudou de posição.", topicId: "fauna" },
      { id: 2, positions: { left: { x: 125, y: 565 }, right: { x: 590, y: 410 } }, clue: "O pássaro mudou de lugar.", topicId: "fauna" },
      { id: 3, positions: { left: { x: 980, y: 295 }, right: { x: 980, y: 295 } }, clue: "Uma janela da casa mudou de cor.", topicId: "historia" },
      { id: 4, positions: { left: { x: 150, y: 75 }, right: { x: 150, y: 75 } }, clue: "Uma nuvem mudou de formato.", topicId: "clima" },
      { id: 5, positions: { left: { x: 300, y: 680 }, right: { x: 300, y: 680 } }, clue: "Uma flor apareceu no campo.", topicId: "flora" },
      { id: 6, positions: { left: { x: 740, y: 560 }, right: { x: 740, y: 560 } }, clue: "Uma borboleta apareceu perto da casa.", topicId: "fauna" },
      { id: 7, positions: { left: { x: 450, y: 65 }, right: { x: 450, y: 65 } }, clue: "Uma nuvem pequena apareceu no céu.", topicId: "clima" },
    ],
  },
];

type GameStatus = "intro" | "playing" | "saving" | "stage-complete" | "complete" | "save-error";

function Scene({
  stage,
  side,
  foundIds,
  onFind,
}: {
  stage: Stage;
  side: "left" | "right";
  foundIds: number[];
  onFind: (id: number) => void;
}) {
  return (
    <div className="south-game__scene">
      <img
        src={stage.images[side]}
        alt={`Cena ${side === "left" ? "A" : "B"} de ${stage.state}`}
      />

      {stage.spots.map((spot) => {
        const found = foundIds.includes(spot.id);
        const position = spot.positions[side];

        return (
          <button
            key={spot.id}
            type="button"
            className={`south-game__hotspot ${found ? "is-found" : ""}`}
            style={{
              left: `${(position.x / 1024) * 100}%`,
              top: `${(position.y / 768) * 100}%`,
            }}
            onClick={() => onFind(spot.id)}
            disabled={found}
            aria-label={`Diferença ${spot.id}: ${spot.clue}`}
          >
            {found && <span aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function SouthPhase() {
  const navigate = useNavigate();
  const { addPoints } = useScore();
  const { status: sessionStatus, retryBootstrap, refreshState } = useSession();
  const { startAttempt, completeAttempt } = useAttempt("sul");

  const [stageIndex, setStageIndex] = useState(0);
  const [foundIds, setFoundIds] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("intro");
  const [message, setMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const saveLock = useRef(false);
  const topicTrackerRef = useRef(createTopicTracker());
  const stage = STAGES[stageIndex];

  async function startStage(nextStageIndex = stageIndex) {
    if (isStarting) return;
    setIsStarting(true);
    setMessage("");

    if (sessionStatus === "loading") {
      setMessage("Aguarde um instante enquanto conectamos sua sessão.");
      setIsStarting(false);
      return;
    }

    if (sessionStatus === "error" && !(await retryBootstrap())) {
      setMessage("Não foi possível conectar. Verifique sua internet e tente novamente.");
      setIsStarting(false);
      return;
    }

    const started = await startAttempt(nextStageIndex + 1);
    if (!started) {
      setMessage("Não foi possível iniciar a fase. Tente novamente.");
      setIsStarting(false);
      return;
    }

    saveLock.current = false;
    topicTrackerRef.current.reset();
    setFoundIds([]);
    setStageIndex(nextStageIndex);
    setGameStatus("playing");
    setIsStarting(false);
  }

  async function finishStage(ids: number[]) {
    if (saveLock.current) return;
    saveLock.current = true;
    setGameStatus("saving");

    const result = await completeAttempt({
      score: ids.length * POINTS_PER_CORRECT_ANSWER,
      correctAnswers: ids.length,
      incorrectAnswers: 7 - ids.length,
      topicResults: topicTrackerRef.current.toPayload(),
    });

    if (!result) {
      saveLock.current = false;
      setMessage("Não foi possível salvar o resultado. Tente novamente.");
      setGameStatus("save-error");
      return;
    }

    await refreshState();
    setGameStatus("stage-complete");
  }

  function findDifference(id: number) {
    if (gameStatus !== "playing" || foundIds.includes(id)) return;

    const nextIds = [...foundIds, id];
    const foundSpot = stage.spots.find((spot) => spot.id === id);
    if (foundSpot) topicTrackerRef.current.record(foundSpot.topicId, true);
    setFoundIds(nextIds);
    setMessage(nextIds.length === 7 ? "Você encontrou as sete diferenças!" : "Boa! Diferença encontrada.");
    addPoints(POINTS_PER_CORRECT_ANSWER);

    if (nextIds.length === 7) {
      void finishStage(nextIds);
    }
  }

  function continueJourney() {
    if (stageIndex === STAGES.length - 1) {
      setGameStatus("complete");
      return;
    }
    void startStage(stageIndex + 1);
  }

  function retrySave() {
    void finishStage(foundIds);
  }

  return (
    <main className="south-game">
      <header className="south-game__header">
        <div>
          <span className="south-game__eyebrow">MISSÃO ESPECIAL · REGIÃO SUL</span>
          <h1>Sete erros pelo Sul</h1>
          <p>Compare as cenas e toque nas sete diferenças que encontrar.</p>
          <NarrationButton audios={narrations.sul} />
        </div>
        <img
          className="south-game__logo"
          src={logoCruzeiroDoSul}
          alt="Universidade Cruzeiro do Sul"
        />
        <ScoreDisplay />
      </header>

      {gameStatus === "intro" && (
        <section className="south-game__card south-game__intro">
          <span className="south-game__big-icon" aria-hidden="true">🔎</span>
          <h2>Olhos atentos, explorador!</h2>
          <p>
            A viagem passa pelo Paraná, por Santa Catarina e pelo Rio Grande do Sul.
            Em cada parada, encontre sete diferenças entre as cenas.
          </p>
          <div className="south-game__stops">
            {STAGES.map((item) => <span key={item.state}>{item.icon} {item.state}</span>)}
          </div>
          <button className="south-game__button" onClick={() => void startStage()}>
            {isStarting ? "Preparando a viagem..." : "Começar a missão"}
          </button>
          {message && <p className="south-game__message" role="status">{message}</p>}
        </section>
      )}

      {gameStatus === "playing" && (
        <section className="south-game__card">
          <div className="south-game__stage-heading">
            <div>
              <span className="south-game__eyebrow">PARADA {stageIndex + 1} DE 3</span>
              <h2>{stage.icon} {stage.state}: {stage.title}</h2>
            </div>
            <strong className="south-game__counter">{foundIds.length} / 7</strong>
          </div>

          <div className="south-game__progress" aria-label={`${foundIds.length} de 7 diferenças encontradas`}>
            <span style={{ width: `${(foundIds.length / 7) * 100}%` }} />
          </div>

          <div className="south-game__scenes">
            <div>
              <span className="south-game__scene-label">CENA A</span>
              <Scene stage={stage} side="left" foundIds={foundIds} onFind={findDifference} />
            </div>
            <div>
              <span className="south-game__scene-label">CENA B</span>
              <Scene stage={stage} side="right" foundIds={foundIds} onFind={findDifference} />
            </div>
          </div>

          <p className="south-game__hint" role="status">
            {message || "Dica: compare o céu, os animais e os objetos da paisagem."}
          </p>
        </section>
      )}

      {gameStatus === "saving" && (
        <section className="south-game__card south-game__result" role="status">
          <span className="south-game__big-icon" aria-hidden="true">🚂</span>
          <h2>Registrando sua descoberta...</h2>
        </section>
      )}

      {gameStatus === "save-error" && (
        <section className="south-game__card south-game__result" role="alert">
          <span className="south-game__big-icon" aria-hidden="true">📡</span>
          <h2>O sinal falhou na estação</h2>
          <p>{message}</p>
          <button className="south-game__button" onClick={retrySave}>
            Tentar salvar novamente
          </button>
        </section>
      )}

      {gameStatus === "stage-complete" && (
        <section className="south-game__card south-game__result" aria-live="polite">
          <span className="south-game__big-icon" aria-hidden="true">✨</span>
          <p className="south-game__eyebrow">SETE DIFERENÇAS ENCONTRADAS</p>
          <h2>Parada concluída: {stage.state}!</h2>
          <p>{stage.fact}</p>
          <button className="south-game__button" onClick={continueJourney}>
            {stageIndex === STAGES.length - 1 ? "Concluir expedição" : "Seguir para a próxima parada"}
          </button>
        </section>
      )}

      {gameStatus === "complete" && (
        <section className="south-game__card south-game__result" aria-live="polite">
          <span className="south-game__big-icon" aria-hidden="true">🏅</span>
          <p className="south-game__eyebrow">MISSÃO CONCLUÍDA</p>
          <h2>Você explorou todo o Sul!</h2>
          <p>Encontrou 21 diferenças e descobriu curiosidades dos três estados.</p>
          <button className="south-game__button" onClick={() => navigate("/mapa")}>
            Voltar ao mapa
          </button>
        </section>
      )}
    </main>
  );
}