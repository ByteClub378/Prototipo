import { useRef, useState } from "react";
import betoExplorer from "../../assets/beto-explorer.webp";
import "./ManualPage.css";

const topics = [
  {
    id: "comecar",
    label: "Começar",
    title: "Sua aventura começa no mapa",
    description: "Escolha uma região e prepare-se para a missão.",
    steps: [
      ["01", "Abra o mapa", "Veja as regiões do Brasil e encontre uma fase liberada."],
      ["02", "Escolha um destino", "Toque na região que você quer explorar."],
      ["03", "Ouça o Beto", "Confira as instruções e toque em Começar."],
    ],
    tip: "As regiões são desbloqueadas conforme você avança na aventura.",
  },
  {
    id: "fases",
    label: "As fases",
    title: "Cada região tem um desafio",
    description: "As atividades mudam para você aprender explorando.",
    steps: [
      ["01", "Norte", "Relacione os elementos da natureza aos biomas."],
      ["02", "Nordeste", "Responda ao quiz sobre a região."],
      ["03", "Centro-Oeste", "Explore a cena e encontre os elementos pedidos."],
      ["04", "Sudeste", "Monte o mapa e descubra os estados."],
      ["05", "Sul", "Observe as imagens e encontre as diferenças."],
      ["06", "Bônus", "Desafie sua memória em uma etapa especial de revisão."],
    ],
    tip: "Leia ou ouça as instruções antes de iniciar cada missão.",
  },
  {
    id: "pontos",
    label: "Pontos e medalhas",
    title: "Aprenda, pontue e conquiste",
    description: "Suas respostas ajudam a completar a missão.",
    steps: [
      ["+", "Resposta certa", "Você ganha pontos ao acertar."],
      ["−", "Resposta errada", "A pontuação pode diminuir, mas você continua aprendendo."],
      ["★", "Medalha", "Conclua uma região para conquistar sua medalha."],
    ],
    tip: "Seu progresso é salvo ao longo do jogo.",
  },
  {
    id: "recursos",
    label: "Recursos do jogo",
    title: "Jogue do seu jeito",
    description: "Há recursos para acompanhar as instruções e aprender mais.",
    steps: [
      ["♫", "Narração", "Use o botão de áudio para ouvir as instruções da fase."],
      ["♪", "Sons", "Os efeitos sonoros avisam sobre acertos, erros e tempo."],
      ["L", "Libras", "Use o botão azul quando quiser acompanhar o conteúdo em Libras."],
    ],
    tip: "Você também pode consultar o Dicionário durante sua aventura.",
  },
] as const;

type TopicId = (typeof topics)[number]["id"];

export default function ManualPage() {
  const [activeTopic, setActiveTopic] = useState<TopicId>("comecar");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const topicIndex = topics.findIndex((topic) => topic.id === activeTopic);
  const topic = topics[topicIndex];

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  function changeTopic(direction: -1 | 1) {
    const nextIndex = (topicIndex + direction + topics.length) % topics.length;
    setActiveTopic(topics[nextIndex].id);
  }

  return (
    <main className="manual-page">
      <section className="manual-hero">
        <div className="manual-hero__copy">
          <span className="manual-eyebrow">GUIA DO EXPLORADOR</span>
          <h1>Vamos explorar o Brasil?</h1>
          <p>
            O Beto vai mostrar como começar, jogar as fases e conquistar
            as Medalhas do Conhecimento.
          </p>

          <button
            className={`manual-audio ${isPlaying ? "is-playing" : ""}`}
            type="button"
            onClick={toggleAudio}
          >
            <span className="manual-audio__icon" aria-hidden="true">
              {isPlaying ? "Ⅱ" : "▶"}
            </span>
            <span>
              <strong>{isPlaying ? "Pausar o Beto" : "Ouvir o Beto"}</strong>
              <small>Uma saudação rápida antes da aventura</small>
            </span>
          </button>

          <audio
            ref={audioRef}
            src="/audio/beto-intro.wav"
            preload="metadata"
            onEnded={() => setIsPlaying(false)}
          />
        </div>

        <div className="manual-hero__character">
          <div className="manual-speech">Oi, explorador!</div>
          <img src={betoExplorer} alt="Beto, o explorador" />
        </div>
      </section>

      <nav className="manual-tabs" aria-label="Assuntos do manual">
        {topics.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={activeTopic === item.id ? "is-active" : ""}
            aria-current={activeTopic === item.id ? "page" : undefined}
            onClick={() => setActiveTopic(item.id)}
          >
            <span className="manual-tabs__number">0{index + 1}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <section className="manual-content" aria-live="polite">
        <header className="manual-content__header">
          <div>
            <span className="manual-eyebrow">
              PASSO {String(topicIndex + 1).padStart(2, "0")} DE {String(topics.length).padStart(2, "0")}
            </span>
            <h2>{topic.title}</h2>
            <p>{topic.description}</p>
          </div>
          <div className="manual-progress" aria-hidden="true">
            <span style={{ width: `${((topicIndex + 1) / topics.length) * 100}%` }} />
          </div>
        </header>

        <div className="manual-steps">
          {topic.steps.map(([number, title, description]) => (
            <article className="manual-step" key={title}>
              <span className="manual-step__number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className="manual-tip">
          <span className="manual-tip__spark" aria-hidden="true">✦</span>
          <p>
            <strong>Dica do Beto</strong>
            {topic.tip}
          </p>
        </aside>

        <footer className="manual-controls">
          <span>
            {topicIndex + 1} / {topics.length}
          </span>
          <div>
            <button type="button" className="manual-back" onClick={() => changeTopic(-1)}>
              Anterior
            </button>
            <button type="button" className="manual-next" onClick={() => changeTopic(1)}>
              Próximo assunto <span aria-hidden="true">→</span>
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
