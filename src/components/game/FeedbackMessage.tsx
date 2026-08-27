import "./FeedbackMessage.css";

interface FeedbackMessageProps {
  type: "success" | "error";
  title: string;
  message: string;
}

function FeedbackMessage({ type, title, message }: FeedbackMessageProps) {
  return (
    <div className={`feedback-message feedback-message--${type}`}>
      <span className="feedback-message__icon">
        {type === "success" ? "🎉" : "❌"}
      </span>
      <div>
        <strong className="feedback-message__title">{title}</strong>
        <p className="feedback-message__text">{message}</p>
      </div>
    </div>
  );
}

export default FeedbackMessage;
