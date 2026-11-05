import { lazy, Suspense } from "react";
import { Link, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import StartPage from "./pages/Start/StartPage";
import { SessionBoundary, RegionBoundary } from "./components/game/SessionBoundary";
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Medals = lazy(() => import("./pages/Medals/Medals"));
const Dictionary = lazy(() => import("./pages/Dictionary/Dictionary"));
const NorthPhase = lazy(() => import("./pages/phases/North/NorthPhase"));
const NordestePhase = lazy(() => import("./pages/phases/northeast/NordestePhase"));
const CenterWestPhase = lazy(() => import("./pages/phases/centerwest/CenterWestPhase"));
const SouthPhase = lazy(() => import("./pages/phases/south/SouthPhase"));
const SudestePhase = lazy(() => import("./pages/phases/southeast/southeastPhase"));
const MemoryPhase = lazy(() => import("./pages/phases/bonus/MemoryPhase"));
const CreditsScreen = lazy(() => import("./pages/Credits/CreditsScreen"));
const AdminPanel = lazy(() => import("./pages/Admin/AdminPanel"));
const ManualPage = lazy(() => import("./pages/Manual/ManualPage"));
function App() {
  return <Suspense fallback={<p className="journey-message" role="status">Carregando…</p>}><Routes>
    <Route path="/admin" element={<AdminPanel />} />
    <Route path="/" element={<StartPage />} />
    <Route path="/creditos" element={<CreditsScreen />} />
    <Route element={<SessionBoundary />}><Route element={<AppLayout />}>
      <Route path="/mapa" element={<Dashboard />} />
      <Route path="/manual" element={<ManualPage />} />
      <Route path="/medalhas" element={<Medals />} />
      <Route path="/dicionario" element={<Dictionary />} />
      <Route element={<RegionBoundary regionId="norte" />}><Route path="/missao/norte" element={<NorthPhase />} /></Route>
      <Route element={<RegionBoundary regionId="nordeste" />}><Route path="/missao/nordeste" element={<NordestePhase />} /></Route>
      <Route element={<RegionBoundary regionId="centro-oeste" />}><Route path="/missao/centro-oeste" element={<CenterWestPhase />} /></Route>
      <Route element={<RegionBoundary regionId="sudeste" />}><Route path="/missao/sudeste" element={<SudestePhase />} /></Route>
      <Route element={<RegionBoundary regionId="sul" />}><Route path="/missao/sul" element={<SouthPhase />} /></Route>
      <Route element={<RegionBoundary regionId="bonus" />}><Route path="/missao/bonus" element={<MemoryPhase />} /></Route>
    </Route></Route>
    <Route path="*" element={<section className="journey-message"><h1>Página não encontrada</h1><Link to="/mapa">Voltar ao mapa</Link></section>} />
  </Routes></Suspense>;
}
export default App;
