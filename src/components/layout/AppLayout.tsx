import { useSession } from "../../context/SessionContext";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./AppLayout.css";

function AppLayout() {
  const { syncPending, sessionNotice, refreshState } = useSession();
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__content">
        {syncPending && <div className="journey-message" role="alert"><p>O placar pode estar desatualizado. Resultados confirmados pelo servidor já estão salvos.</p><button onClick={() => void refreshState()}>Atualizar progresso</button></div>}
        {sessionNotice && <p className="journey-message" role="status">{sessionNotice}</p>}
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
