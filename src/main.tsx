import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ProgressProvider } from "./context/ProgressContext";
import { SessionProvider } from "./context/SessionContext";
import { ScoreProvider } from "./context/ScoreContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <ScoreProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </ScoreProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>
);