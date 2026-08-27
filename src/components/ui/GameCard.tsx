import type { ReactNode } from "react";
import "./GameCard.css";

interface GameCardProps {
  children: ReactNode;
  className?: string;
}

function GameCard({ children, className = "" }: GameCardProps) {
  return <div className={`game-card ${className}`}>{children}</div>;
}

export default GameCard;
