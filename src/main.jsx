import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/dm-sans/latin-800.css";
import "./brand-font.js";
import App from "./App.jsx";
import { ConfirmProvider } from "./components/UI.jsx";
import "./styles.css";
import "./planning.css";

createRoot(document.getElementById("root")).render(
  <ConfirmProvider>
    <App />
  </ConfirmProvider>,
);
