import { useId, useState } from 'react';
import './StartScreen.css';
import defaultBackground from '../../assets/paisagem-brasil.png';
import defaultLogo from '../../assets/logo-cruzeiro-do-sul.png';
import { useNavigate } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { useSession } from "../../context/SessionContext";
import { ApiError } from "../../utils/api";

export type StartScreenProps = {
  onPlay?: () => void;
  onContinue?: () => void;
  onCredits?: () => void;
  hasProgress?: boolean;
  isLoading?: boolean;
  backgroundUrl?: string;
  institutionLogoUrl?: string;
};

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StartScreen({
  onPlay = () => {},
  onContinue = () => {},
  onCredits = () => {},
  hasProgress = false,
  isLoading = false,
  backgroundUrl = defaultBackground,
  institutionLogoUrl = defaultLogo,
}: StartScreenProps) {
  const titleId = useId();
  const [logoFailed, setLogoFailed] = useState(false);

    const navigate = useNavigate();
    const { resetProgress } = useProgress();
    const { status, retryBootstrap } = useSession();
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);

    const regions = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];



    async function handleNewGame() {
  if (isResetting || status === "loading") return;
  setIsResetting(true);
  setResetError(null);
  try {
    if (status !== "ready" && !(await retryBootstrap())) {
      throw new Error("Não foi possível conectar com o servidor.");
    }
    await resetProgress();
    navigate("/mapa");
  } catch (error) {
    console.error("[start] Falha ao iniciar novo jogo:", error);
    setResetError(
      error instanceof ApiError
        ? error.message
        : "Não foi possível iniciar. Verifique se a API está ligada e tente novamente."
    );
  } finally {
    setIsResetting(false);
  }
}

  return (
    <main className="adventure-start" aria-labelledby={titleId}>
      <img className="adventure-start__scenery" src={backgroundUrl} alt="" fetchPriority="high" />
      <div className="adventure-start__shade" aria-hidden="true" />
  
      <div className="adventure-start__shell">
        <header className="adventure-start__header">
          <span className="adventure-start__eyebrow">
            <span aria-hidden="true">✦</span> Uma aventura brasileira
          </span>
          <span className="adventure-start__edition">Aprender é uma aventura</span>
        </header>
  
        <section className="adventure-start__panel">
          <p className="adventure-start__kicker">Descubra. Explore. Aprenda.</p>
          <h1 id={titleId} className="adventure-start__title">
            Aventura das <span>Regiões do Brasil</span>
          </h1>
  
          <ul className="adventure-start__badges" aria-label="Destaques do jogo">
            <li><span aria-hidden="true">⌖</span> 5 regiões</li>
            <li><span aria-hidden="true">✦</span> Grandes descobertas</li>
          </ul>
  
          <p className="adventure-start__description">
            Das florestas às praias, uma jornada cheia de desafios, animais e histórias espera por você!
          </p>
  
          <nav className="adventure-start__actions" aria-label="Menu inicial">
            <button
              type="button"
              className="adventure-start__button adventure-start__button--play"
              onClick={onPlay}
              disabled={isLoading}
            >
              <span className="adventure-start__button-icon" aria-hidden="true">▶</span>
              <span>{isLoading ? 'Preparando aventura…' : 'Jogar'}</span>
              <Arrow />
            </button>
  
            <button
              type="button"
              className="adventure-start__button adventure-start__button--continue"
              onClick={onContinue}
              disabled={!hasProgress || isLoading}
              aria-describedby={!hasProgress ? `${titleId}-progress` : undefined}
            >
              <span className="adventure-start__button-icon" aria-hidden="true">↻</span>
              <span>Continuar</span>
              <Arrow />
            </button>
  
            {!hasProgress && (
              <p className="adventure-start__hint" id={`${titleId}-progress`}>
                Sua jornada começa com “Jogar”.
              </p>
            )}
            <div className="start-screen__menu">
              <button
              className="start-screen__menu-item start-screen__menu-item--primary"
              onClick={handleNewGame}
              disabled={isResetting || status === "loading"}
            >
              {isResetting || status === "loading" ? "Conectando..." : "🎮 Novo Jogo"}
              </button>
          
              {resetError && <p role="alert">{resetError}</p>}
          
                <button
                  type="button"
                  className="adventure-start__button adventure-start__button--credits"
                  onClick={onCredits}
                  disabled={isLoading}
                >
                  <span aria-hidden="true">✦</span>
                  <span>Créditos</span>
                </button>
            </div>
          </nav>
        </section>
          
        <footer className="adventure-start__footer">
          <ul className="adventure-start__regions" aria-label="Regiões para explorar">
            {regions.map((region) => (
              <li key={region}>
                <span aria-hidden="true">◆</span>
                {region}
              </li>
            ))}
          </ul>
          {institutionLogoUrl && !logoFailed && (
            <img
              className="adventure-start__institution"
              src={institutionLogoUrl}
              alt="Universidade Cruzeiro do Sul"
              onError={() => setLogoFailed(true)}
            />
          )}
        </footer>
      </div>
    </main>
  );
  }


export default StartScreen;
