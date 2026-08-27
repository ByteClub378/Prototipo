import { useEffect, useState } from "react";
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

  useEffect(() => {
    setSecondsLeft(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isActive) return;

    if (secondsLeft <= 0) {
      onExpire();
      return;
    }

    const timeoutId = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isActive, secondsLeft, onExpire]);

  const isLow = secondsLeft <= 10;

  return (
    <div className={`mission-timer ${isLow ? "mission-timer--low" : ""}`}>
      <span className="mission-timer__icon">⏱️</span>
      <span className="mission-timer__time">{formatTime(secondsLeft)}</span>
    </div>
  );
}

export default MissionTimer;
