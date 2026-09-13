import { useEffect, useRef, useState } from "react";
import "./MissionTimer.css";

interface MissionTimerProps {
  durationSeconds: number;
  isActive: boolean;
  onExpire: () => void;
  label?: string;
}

function MissionTimer({ durationSeconds, isActive, onExpire, label = "Tempo restante" }: MissionTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setSecondsLeft(durationSeconds);
    expiredRef.current = false;
  }, [durationSeconds]);

  useEffect(() => {
    if (!isActive || expiredRef.current) return;

    if (secondsLeft === 0) {
      expiredRef.current = true;
      onExpireRef.current();
      return;
    }

    const timeoutId = window.setTimeout(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);

    return () => clearTimeout(timeoutId);
  }, [isActive, secondsLeft]);

  const percentage = (secondsLeft / durationSeconds) * 100;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 3;

  return (
    <div
      className={`mission-timer ${isUrgent ? "mission-timer--urgent" : ""}`}
      role="timer"
      aria-live={isUrgent ? "assertive" : "off"}
      aria-label={`${label}: ${secondsLeft} segundos`}
    >
      <div className="mission-timer__top">
        <span aria-hidden="true">⏱️</span>
        <span>{label}</span>
        <strong>{secondsLeft}s</strong>
      </div>
      <div className="mission-timer__track" aria-hidden="true">
        <span className="mission-timer__fill" style={{ transform: `scaleX(${percentage / 100})` }} />
      </div>
    </div>
  );
}

export default MissionTimer;