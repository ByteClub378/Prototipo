import { useRef } from "react";
import betoExplorer from "../../assets/beto-explorer.webp";
import RegionMap from "../../components/map/RegionMap";
import "./Dashboard.css";

function Dashboard() {
  const mapRef = useRef<HTMLDivElement>(null);

  function scrollToMap() {
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">DIÁRIO DE EXPLORAÇÃO</span>
          <h1>Mapa do Brasil</h1>
          <p>Escolha uma região e prepare-se para uma nova aventura!</p>
        </div>
        <span className="dashboard__welcome-badge">⭐ Sua aventura começa aqui</span>
      </header>

      <div className="dashboard__expedition">
        <section className="dashboard__guide" aria-labelledby="guide-title">
          <img className="dashboard__guide-image" src={betoExplorer} alt="Beto, o explorador" />
          <div className="dashboard__guide-copy">
            <span className="dashboard__guide-kicker">Beto tem uma dica</span>
            <h2 id="guide-title">Vamos explorar?</h2>
            <p>Toque em uma região colorida do mapa para começar sua missão.</p>
            <button className="dashboard__map-button" type="button" onClick={scrollToMap}>
              <span aria-hidden="true">🧭</span> Escolher uma região
            </button>
          </div>
        </section>

        <section className="dashboard__map-panel" aria-label="Regiões do Brasil">
          <div className="dashboard__map-heading">
            <span aria-hidden="true">🗺️</span>
            <p>Toque no mapa para explorar</p>
          </div>
          <div ref={mapRef} className="dashboard__map-anchor">
            <RegionMap />
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
