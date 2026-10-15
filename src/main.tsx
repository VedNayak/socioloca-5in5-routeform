import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/ibm-plex-mono/latin-400.css";
import App from "./App";
import "./styles.css";
import "./home-shell.css";
import "./cinema.css";
import "./interior-motion.css";
import "./openings.css";
import "./theme.css";
const root = document.getElementById("root")!;
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
if (root.hasChildNodes() && !window.location.search)
  ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);

import "./routeform.css";
