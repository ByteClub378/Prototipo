import { useCallback, useContext, useEffect, useRef } from "react";
import { GameFeedbackContext, type GameFeedbackOptions } from "../context/gameFeedbackContext";

export function useGameFeedback<T extends HTMLElement = HTMLDivElement>() {
  const api = useContext(GameFeedbackContext);
  if (!api) throw new Error("useGameFeedback precisa estar dentro de GameFeedbackProvider.");

  const feedbackRef = useRef<T>(null);
  const animationRef = useRef<Animation | null>(null);

  const clearFeedback = useCallback(() => {
    animationRef.current?.cancel();
    animationRef.current = null;
    api.clear();
  }, [api]);

  useEffect(() => clearFeedback, [clearFeedback]);

  const showSuccess = useCallback((message: string, options?: GameFeedbackOptions) => {
    animationRef.current?.cancel();
    api.success(message, options);
  }, [api]);

  const showError = useCallback((message: string, options?: GameFeedbackOptions) => {
    api.error(message, options);
    animationRef.current?.cancel();
    // Animar o diálogo diretamente evita deslocar seu backdrop fixo.
    const surface = feedbackRef.current?.querySelector<HTMLElement>('[role="dialog"]') ?? feedbackRef.current;
    if (!surface || typeof surface.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Só a fase treme; toast, confetes e navegação continuam estáveis.
    animationRef.current = surface.animate(
      [0, -6, 6, -4, 4, -2, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 360, easing: "ease-in-out" },
    );
  }, [api]);

  return {
    feedbackRef,
    showSuccess,
    showError,
    // Falhas de conexão recebem mensagem, sem tratar o jogador como se tivesse errado.
    notifyError: api.error,
    clearFeedback,
  };
}
