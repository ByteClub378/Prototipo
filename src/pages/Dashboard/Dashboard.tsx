import { useSession } from "../../context/SessionContext";
import betoExplorer from "../../assets/beto-explorer.webp";
import RegionMap from "../../components/map/RegionMap";
import "./Dashboard.css";

function Dashboard() {
  const { gameState } = useSession();
  const completed = gameState?.medals.length ?? 0;
  const nextRegion = gameState?.progress.regions.find(region => region.status === "unlocked");
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">DIÁRIO DE EXPLORAÇÃO</span>
          <h1>Mapa do Brasil</h1>
        </div>
        <span className="dashboard__welcome-badge">🏅 {completed} de 5 medalhas · {gameState?.totalScore ?? 0} pontos salvos</span>
      </header>

      <div className="dashboard__expedition">
        <section className="dashboard__guide" aria-labelledby="guide-title">
          <img className="dashboard__guide-image" src={betoExplorer} alt="Beto, o explorador" />
          <div className="dashboard__guide-copy">
            <h2 id="guide-title">{nextRegion ? `Próxima parada: ${nextRegion.name}` : "Brasil explorado!"}</h2>
            <p>{nextRegion ? "Uma nova descoberta espera por você!" : "Suas medalhas contam uma grande aventura!"}</p>
          </div>
        </section>

        <section className="dashboard__map-panel" aria-label="Regiões do Brasil">
          <div className="dashboard__map-heading">
            <span aria-hidden="true">🗺️</span>
            <p>Toque no mapa para explorar</p>
          </div>
          <div className="dashboard__map-anchor">
            <RegionMap />
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
