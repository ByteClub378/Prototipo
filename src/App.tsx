import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import StartScreen from "./pages/Start/StartScreen";
import Dashboard from "./pages/Dashboard/Dashboard";
import Medals from "./pages/Medals/Medals";
import Dictionary from "./pages/Dictionary/Dictionary";
import Adventures from "./pages/Adventures/Adventures";
import NorthPhase from "./pages/phases/North/NorthPhase";

function App() {
  return (
    <Routes>
      <Route path="/" element={<StartScreen />} />

      <Route element={<AppLayout />}>
        <Route path="/mapa" element={<Dashboard />} />
        <Route path="/medalhas" element={<Medals />} />
        <Route path="/dicionario" element={<Dictionary />} />
        <Route path="/aventuras" element={<Adventures />} />
        <Route path="/missao/norte" element={<NorthPhase />} />
      </Route>
    </Routes>
  );
}

export default App;