import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScore } from "../../../context/ScoreContext";
import { POINTS_PER_CORRECT_ANSWER } from "../../../data/scoring";
import "./MemoryPhase.css";

type RegionStage = {
  name: string;
  icon: string;
  color: string;
  fact: string;
  firstSprite: number;
};

type MemoryCard = {
  id: string;
  pairId: number;
  spriteIndex: number;
  name: string;
};

type GameStatus = "intro" | "playing" | "stage-complete" | "complete";

const STAGES: RegionStage[] = [
  {
    name: "Norte",
    icon: "🌳",
    color: "#329451",
    fact: "A Amazônia abriga uma enorme variedade de animais e plantas.",
    firstSprite: 0,
  },
  {
    name: "Nordeste",
    icon: "☀️",
    color: "#e9a923",
    fact: "A cultura nordestina tem festas, ritmos, paisagens e tradições muito diversas.",
    firstSprite: 8,
  },
  {
    name: "Centro-Oeste",
    icon: "🐆",
    color: "#c77c43",
    fact: "O Pantanal é uma das maiores áreas úmidas continentais do planeta.",
    firstSprite: 16,
  },
  {
    name: "Sudeste",
    icon: "🏙️",
    color: "#e8796d",
    fact: "O Sudeste reúne grandes cidades, áreas naturais e patrimônios históricos.",
    firstSprite: 24,
  },
  {
    name: "Sul",
    icon: "🧉",
    color: "#6d9bd2",
    fact: "A araucária e o pinhão fazem parte da paisagem e da cultura da região Sul.",
    firstSprite: 32,
  },
];

const SPRITE_NAMES = [
  "Onça-pintada",
  "Boto-cor-de-rosa",
  "Vitória-régia",
  "Borboleta-amarela",
  "Arara",
  "Castanha-do-pará",
  "Bicho-preguiça",
  "Barco amazônico",
  "Mandacaru",
  "Jangada",
  "Acordeão",
  "Coco",
  "Coqueiro",
  "Vestido de festa",
  "Sol",
  "Tartaruga-marinha",
  "Lobo-guará",
  "Tuiuiú",
  "Pequi",
  "Jacaré",
  "Gado do Pantanal",
  "Pegada de onça",
  "Flor do Cerrado",
  "Chapéu",
  "Cristo Redentor",
  "Bondinho",
  "Café",
  "Pão de queijo",
  "Cidade",
  "Igreja histórica",
  "Moqueca",
  "Guarda-sol",
  "Araucária",
  "Pinhão",
  "Chimarrão",
  "Cavalo",
  "Baleia",
  "Uvas",
  "Gorro",
  "Gralha-azul",
];

const OPENMOJI_CODES = [
  "1F981",
  "1F42C",
  "1FAB7",
  "1F98B",
  "1F99C",
  "1F95C",
  "1F9A5",
  "1F6F6",
  "1F335",
  "26F5",
  "1FA97",
  "1F965",
  "1F334",
  "1F457",
  "2600",
  "1F422",
  "1F43A",
  "1F9A9",
  "1F951",
  "1F40A",
  "1F404",
  "1F43E",
  "1F33C",
  "1F3A9",
  "1F5FD",
  "1F6A0",
  "2615",
  "1F9C0",
  "1F3D9",
  "26EA",
  "1F372",
  "2602",
  "1F332",
  "1F330",
  "1F9C9",
  "1F40E",
  "1F40B",
  "1F347",
  "1F9E2",
  "1F426",
];

function openMojiUrl(code: string) {
  return `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@17.0.0/color/svg/${code}.svg`;
}

function MemoryAttribution() {
  return (
    <footer className="memory-attribution">
      Ícones por{" "}
      <a href="https://openmoji.org/" target="_blank" rel="noreferrer">
        OpenMoji
      </a>{" "}
      (
      <a
        href="https://creativecommons.org/licenses/by-sa/4.0/"
        target="_blank"
        rel="noreferrer"
      >
        CC BY-SA 4.0
      </a>
      )
    </footer>
  );
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

function createDeck(stageIndex: number): MemoryCard[] {
  const firstSprite = STAGES[stageIndex].firstSprite;
  const cards = Array.from({ length: 8 }, (_, pairId) => {
    const spriteIndex = firstSprite + pairId;
    const name = SPRITE_NAMES[spriteIndex];

    return [
      {
        id: `${stageIndex}-${pairId}-a`,
        pairId,
        spriteIndex,
        name,
      },
      {
        id: `${stageIndex}-${pairId}-b`,
        pairId,
        spriteIndex,
        name,
      },
    ];
  }).flat();

  return shuffle(cards);
}

export default function MemoryPhase() {
  const navigate = useNavigate();
  const { addPoints } = useScore();

  const [stageIndex, setStageIndex] = useState(0);
  const [status, setStatus] = useState<GameStatus>("intro");
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const resolvingMismatch = useRef(false);
  const mismatchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage = STAGES[stageIndex];

  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    return () => {
      if (mismatchTimeout.current) {
        clearTimeout(mismatchTimeout.current);
      }
    };
  }, []);

  function startStage(index: number) {
    resolvingMismatch.current = false;
    setStageIndex(index);
    setDeck(createDeck(index));
    setFlippedIds([]);
    setMatchedIds([]);
    setMoves(0);
    setSeconds(0);
    setStatus("playing");
  }

  function handleCardClick(card: MemoryCard) {
    if (
      status !== "playing" ||
      resolvingMismatch.current ||
      flippedIds.includes(card.id) ||
      matchedIds.includes(card.id)
    ) {
      return;
    }

    const nextFlipped = [...flippedIds, card.id];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length < 2) return;

    setMoves((current) => current + 1);

    const firstCard = deck.find((item) => item.id === nextFlipped[0]);
    const secondCard = deck.find((item) => item.id === nextFlipped[1]);

    if (!firstCard || !secondCard) return;

    if (firstCard.pairId === secondCard.pairId) {
      const nextMatched = [...matchedIds, ...nextFlipped];
      setMatchedIds(nextMatched);
      setFlippedIds([]);
      addPoints(POINTS_PER_CORRECT_ANSWER);

      if (nextMatched.length === deck.length) {
        setStatus("stage-complete");
      }

      return;
    }

    resolvingMismatch.current = true;
    mismatchTimeout.current = setTimeout(() => {
      setFlippedIds([]);
      resolvingMismatch.current = false;
    }, 850);
  }

  function continueGame() {
    if (stageIndex === STAGES.length - 1) {
      setStatus("complete");
      return;
    }

    startStage(stageIndex + 1);
  }

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const secondsRemainder = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secondsRemainder).padStart(2, "0")}`;
  }

  if (status === "intro") {
    return (
      <main className="memory-page">
        <section className="memory-panel memory-intro">
          <span className="memory-eyebrow">DESAFIO FINAL</span>
          <div className="memory-intro__icon" aria-hidden="true">🕹️</div>
          <h1>Memória do Brasil</h1>
          <p>
            Complete cinco etapas, uma para cada região. Encontre os oito pares
            em cada tabuleiro 4×4 para conquistar o desafio bônus.
          </p>

          <div className="memory-region-list">
            {STAGES.map((item, index) => (
              <span key={item.name} title={item.name}>
                {item.icon}
                <small>{index + 1}</small>
              </span>
            ))}
          </div>

          <button
            className="memory-button"
            type="button"
            onClick={() => startStage(0)}
          >
            Começar desafio
          </button>
          <button
            className="memory-link-button"
            type="button"
            onClick={() => navigate("/mapa")}
          >
            Voltar ao mapa
          </button>
        </section>
        <MemoryAttribution />
      </main>
    );
  }

  if (status === "complete") {
    return (
      <main className="memory-page">
        <section className="memory-panel memory-finish">
          <div className="memory-finish__trophy" aria-hidden="true">🏆</div>
          <span className="memory-eyebrow">DESAFIO CONCLUÍDO</span>
          <h1>Você explorou o Brasil inteiro!</h1>
          <p>
            Os cinco tabuleiros foram completados. Mandou muito bem,
            explorador!
          </p>
          <button
            className="memory-button"
            type="button"
            onClick={() => navigate("/mapa")}
          >
            Voltar ao mapa
          </button>
          <button
            className="memory-link-button"
            type="button"
            onClick={() => {
              setStageIndex(0);
              setStatus("intro");
            }}
          >
            Jogar novamente
          </button>
        </section>
        <MemoryAttribution />
      </main>
    );
  }

  return (
    <main
      className="memory-page"
      style={{ "--region-color": stage.color } as React.CSSProperties}
    >
      <section className="memory-panel memory-game">
        <header className="memory-header">
          <div>
            <span className="memory-eyebrow">FASE BÔNUS · ETAPA {stageIndex + 1}/5</span>
            <h1>
              <span aria-hidden="true">{stage.icon}</span> Região {stage.name}
            </h1>
            <p>{stage.fact}</p>
          </div>

          <button
            className="memory-link-button"
            type="button"
            onClick={() => navigate("/mapa")}
          >
            Sair
          </button>
        </header>

        <div className="memory-progress" aria-label={`Etapa ${stageIndex + 1} de 5`}>
          {STAGES.map((item, index) => (
            <span
              key={item.name}
              className={index <= stageIndex ? "is-active" : ""}
              title={item.name}
              aria-label={item.name}
            >
              {item.icon}
            </span>
          ))}
        </div>

        <div className="memory-stats">
          <div><small>PARES</small><strong>{matchedIds.length / 2}/8</strong></div>
          <div><small>TENTATIVAS</small><strong>{moves}</strong></div>
          <div><small>TEMPO</small><strong>{formatTime(seconds)}</strong></div>
        </div>

        <div className="memory-board" aria-label={`Tabuleiro da região ${stage.name}`}>
          {deck.map((card, index) => {
            const isRevealed =
              flippedIds.includes(card.id) || matchedIds.includes(card.id);

            return (
              <button
                key={card.id}
                type="button"
                className={[
                  "memory-card",
                  isRevealed ? "is-revealed" : "",
                  matchedIds.includes(card.id) ? "is-matched" : "",
                ].join(" ")}
                onClick={() => handleCardClick(card)}
                disabled={matchedIds.includes(card.id)}
                aria-label={
                  isRevealed
                    ? `Carta ${index + 1}: ${card.name}`
                    : `Carta ${index + 1}, virada para baixo`
                }
              >
                <span className="memory-card__inner">
                  <span className="memory-card__face memory-card__back" aria-hidden="true">
                    ✦
                  </span>

                  <span className="memory-card__face memory-card__front">
                    <img
                      className="memory-card__image"
                      src={openMojiUrl(OPENMOJI_CODES[card.spriteIndex])}
                      alt={card.name}
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {status === "stage-complete" && (
          <div className="memory-overlay" role="dialog" aria-modal="true">
            <section className="memory-result">
              <span className="memory-result__icon" aria-hidden="true">✨</span>
              <span className="memory-eyebrow">REGIÃO CONCLUÍDA</span>
              <h2>Boa, explorador!</h2>
              <p>
                Você encontrou os oito pares de {stage.name} em {moves} tentativas.
              </p>
              <button
                className="memory-button"
                type="button"
                onClick={continueGame}
              >
                {stageIndex === STAGES.length - 1
                  ? "Concluir desafio"
                  : `Ir para ${STAGES[stageIndex + 1].name}`}
              </button>
            </section>
          </div>
        )}
      </section>
      <MemoryAttribution />
    </main>
  );
}