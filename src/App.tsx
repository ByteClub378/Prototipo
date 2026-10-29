import { Routes, Route, useNavigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import StartScreen from "./pages/Start/StartScreen";
import Dashboard from "./pages/Dashboard/Dashboard";
import Medals from "./pages/Medals/Medals";
import Dictionary from "./pages/Dictionary/Dictionary";
import NorthPhase from "./pages/phases/North/NorthPhase";
import NordestePhase from "./pages/phases/northeast/NordestePhase";
import CenterWestPhase from "./pages/phases/centerwest/CenterWestPhase";
import SouthPhase from "./pages/phases/south/SouthPhase";
import SudestePhase from "./pages/phases/southeast/southeastPhase";
import MemoryPhase from "./pages/phases/bonus/MemoryPhase";
import CreditsScreen from "./pages/Credits/CreditsScreen";
import AdminPanel from "./pages/Admin/AdminPanel";
import ManualPage from "./pages/Manual/ManualPage";

function App() {  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/admin" element={<AdminPanel />} />
      <Route
        path="/"
        element={
          <StartScreen
            onPlay={() => navigate("/mapa")}
            onCredits={() => navigate("/creditos")}
          />
        }
      />

      <Route element={<AppLayout />}>
        <Route path="/mapa" element={<Dashboard />} />
        <Route path="/manual" element={<ManualPage />} />
        <Route path="/medalhas" element={<Medals />} />
        <Route path="/dicionario" element={<Dictionary />} />
        <Route path="/missao/norte" element={<NorthPhase />} />
        <Route path="/missao/nordeste" element={<NordestePhase />} />
        <Route path="/missao/centro-oeste" element={<CenterWestPhase />} />
        <Route path="/missao/sul" element={<SouthPhase />} />
        <Route path="/missao/sudeste" element={<SudestePhase />} />
        <Route path="/missao/bonus" element={<MemoryPhase />} />
        <Route path="/creditos" element={<CreditsScreen />} />
      </Route>
    </Routes>
  );
}

export default App;