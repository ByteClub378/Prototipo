import { createContext } from "react";

export interface GameFeedbackOptions {
  title?: string;
  duration?: number;
}

export interface GameFeedbackApi {
  success: (message: string, options?: GameFeedbackOptions) => void;
  error: (message: string, options?: GameFeedbackOptions) => void;
  clear: () => void;
}

export const GameFeedbackContext = createContext<GameFeedbackApi | null>(null);
