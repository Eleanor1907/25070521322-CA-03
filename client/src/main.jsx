// main.jsx
// Starts React and wraps the app with routing, login state and notifications.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Fonts are bundled locally, so the app looks the same offline
import "@fontsource-variable/archivo/wdth.css"; // Archivo with its width axis (normal to expanded)
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/seats.css";
import "./styles/pages.css";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./hooks/useToast";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
