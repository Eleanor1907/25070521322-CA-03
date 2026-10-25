// main.jsx
// Starts React and wraps the app with routing, login state and notifications.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@fontsource-variable/archivo/wdth.css"; // Archivo font, bundled locally (works offline)
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
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
