import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import type { RegionId } from "../../types";
export function SessionBoundary() {
  const { status, gameState, retryBootstrap, sessionNotice } = useSession();
  if (status === "loading") return <p className="journey-message" role="status">Carregando sua aventura…</p>;
  if (status === "error" || !gameState) return <section className="journey-message" role="alert"><p>{sessionNotice ?? "Não foi possível carregar a aventura."}</p><button onClick={() => void retryBootstrap()}>Tentar conectar novamente</button></section>;
  return <Outlet key={`${gameState.playerId}:${gameState.journeyId}`} />;
}
export function RegionBoundary({ regionId }: { regionId: RegionId | "bonus" }) {
  const { gameState } = useSession();
  const unlocked = regionId === "bonus"
    ? gameState?.progress.regions.every(region => region.status === "completed")
    : gameState?.progress.regions.some(region => region.regionId === regionId && region.status !== "locked");
  return unlocked ? <Outlet /> : <Navigate to="/mapa" replace />;
}
