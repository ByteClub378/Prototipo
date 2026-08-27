import "./ProgressBar.css";

interface ProgressBarProps {
  current: number;
  total: number;
}

function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.min((current / total) * 100, 100);

  return (
    <div className="progress-bar">
      <span className="progress-bar__icon">🌱</span>
      <div className="progress-bar__track">
        <div
          className="progress-bar__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="progress-bar__label">
        {current}/{total}
      </span>
    </div>
  );
}

export default ProgressBar;
