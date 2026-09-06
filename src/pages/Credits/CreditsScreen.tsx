import { TEAM_MEMBERS } from "../../data/team";
import logoCruzeiroDoSul from "../../assets/logo-cruzeiro-do-sul.png";
import "./CreditsScreen.css";


function CreditsScreen() {
  function handleResetAll() {
    const confirmed = window.confirm(
      "Isso vai apagar TODO o progresso, medalhas e pontuação salvos neste navegador (inclusive dados antigos de outros testes). Quer continuar?"
    );
    if (!confirmed) return;

    localStorage.clear();
    window.location.reload();
  }

  return (
    <div className="credits-screen">
      <header className="credits-screen__header">
        
        <img 
          src={logoCruzeiroDoSul} 
          alt="Universidade Cruzeiro do Sul" 
          className="credits-screen__logo" 
        />
        
        <p className="credits-screen__institution">Universidade Cruzeiro do Sul</p>

        <h1 className="credits-screen__title">Aventura das Regiões</h1>
        <p className="credits-screen__subtitle">Conheça nosso time Scrum</p>
      </header>

      <div className="credits-screen__grid">
        {TEAM_MEMBERS.map((member) => (
          <div key={member.id} className="credits-screen__card">
            <div className="credits-screen__avatar">
              <span>{member.initials}</span>
            </div>

            <p className="credits-screen__name">{member.name}</p>
            <p className="credits-screen__role">{member.role}</p>

            <div className="credits-screen__links">
              {member.github && (
                <a
                  href={member.github}
                  target="_blank"
                  rel="noreferrer"
                  className="credits-screen__link credits-screen__link--github"
                >
                  GitHub
                </a>
              )}
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="credits-screen__link credits-screen__link--linkedin"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="credits-screen__danger-zone">
        <p className="credits-screen__danger-text">
          Precisa testar do zero? Isso apaga pontuação, progresso e medalhas salvos neste navegador.
        </p>
        <button className="credits-screen__reset-button" onClick={handleResetAll}>
          🗑️ Reiniciar progresso deste navegador
        </button>
      </div>
    </div>
  );
}

export default CreditsScreen;