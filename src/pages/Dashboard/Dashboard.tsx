import RegionMap from "../../components/map/RegionMap";
import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Mapa do Brasil</h1>
        <p>Escolha uma região desbloqueada para iniciar sua próxima missão.</p>
      </header>

      <RegionMap />
    </div>
  );
}

export default Dashboard;
