import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import {
  Bounce,
  ToastContainer,
  toast,
  type ToastOptions,
} from "react-toastify";

import confetti from "canvas-confetti";

import {
  GameFeedbackContext,
  type GameFeedbackOptions,
} from "../../context/gameFeedbackContext";

import "react-toastify/dist/ReactToastify.css";
import "./GameFeedback.css";

const TOAST_ID = "adventure-brasil-answer";

const TOAST_OPTIONS: ToastOptions = {
  position: "top-center",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  pauseOnFocusLoss: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
  transition: Bounce,
};

export default function GameFeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const confettiRef = useRef<
    ReturnType<typeof confetti.create> | null
  >(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const instance = confetti.create(canvasRef.current, {
      resize: true,
      disableForReducedMotion: true,
    });

    confettiRef.current = instance;

    return () => {
      instance.reset();
      confettiRef.current = null;

      toast.dismiss(TOAST_ID);
      toast.clearWaitingQueue();
    };
  }, []);

  const showToast = useCallback(
    (
      type: "success" | "error",
      message: string,
      options: GameFeedbackOptions = {},
    ) => {
      const content = (
        <div>
          <strong>
            {options.title ??
              (type === "success"
                ? "Meus parabéns!"
                : "Resposta incorreta!")}
          </strong>

          <p className="game-feedback-text">{message}</p>
        </div>
      );

      if (toast.isActive(TOAST_ID)) {
        toast.update(TOAST_ID, {
          ...TOAST_OPTIONS,
          render: content,
          type,
          delay: 0,
        });

        return;
      }

      const settings = {
        ...TOAST_OPTIONS,
        toastId: TOAST_ID,
      };

      if (type === "success") {
        toast.success(content, settings);
      } else {
        toast.error(content, settings);
      }
    },
    [],
  );

  const success = useCallback(
    (message: string, options?: GameFeedbackOptions) => {
      showToast("success", message, options);

      void confettiRef.current?.({
        particleCount: window.innerWidth < 600 ? 45 : 75,
        spread: 70,
        startVelocity: 28,
        ticks: 110,
        gravity: 1.1,
        origin: { x: 0.5, y: 0.65 },
        colors: [
          "#ffd166",
          "#43aa8b",
          "#ef8354",
          "#69b8e8",
        ],
        disableForReducedMotion: true,
      });
    },
    [showToast],
  );

  const error = useCallback(
    (message: string, options?: GameFeedbackOptions) => {
      confettiRef.current?.reset();
      showToast("error", message, options);
    },
    [showToast],
  );

  const clear = useCallback(() => {
    toast.dismiss(TOAST_ID);
    toast.clearWaitingQueue();
    confettiRef.current?.reset();
  }, []);

  const api = useMemo(
    () => ({ success, error, clear }),
    [success, error, clear],
  );

  return (
    <GameFeedbackContext.Provider value={api}>
      {children}

      <canvas
        ref={canvasRef}
        className="game-feedback-confetti"
        aria-hidden="true"
      />

      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
        limit={1}
        style={{ zIndex: 10000 }}
      />
    </GameFeedbackContext.Provider>
  );
}
