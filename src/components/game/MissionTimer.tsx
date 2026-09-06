import { useEffect, useRef, useState } from "react";
import "./MissionTimer.css";

interface MissionTimerProps {
  durationSeconds: number;
  isActive: boolean;
  onExpire: () => void;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function MissionTimer({ durationSeconds, isActive, onExpire }: MissionTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  // Garante uma única fonte de verdade: onExpire dispara só uma vez por
  // instância do timer, mesmo que o componente pai re-renderize.
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setSecondsLeft(durationSeconds);
    hasExpiredRef.current = false;
  }, [durationSeconds]);

  useEffect(() => {
    if (!isActive || hasExpiredRef.current) return;

    if (secondsLeft <= 0) {
      hasExpiredRef.current = true;
      onExpireRef.current();
      return;
    }

    const timeoutId = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isActive, secondsLeft]);

  const isLow = secondsLeft <= 10;

  return (
    <div className={`mission-timer ${isLow ? "mission-timer--low" : ""}`}>
      <span className="mission-timer__icon">⏱️</span>
      <span className="mission-timer__time">{formatTime(secondsLeft)}</span>
    </div>
  );
}

export default MissionTimer;