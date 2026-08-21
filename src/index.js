/* eslint-disable */
import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const container = document.getElementById("root");

// Create a root.
const root = ReactDOMClient.createRoot(container);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    alert("New version available! Please refresh.");
    window.location.reload();
  },
  onSuccess: (registration) => {
    console.log("Service Worker registered successfully.");
  },
});
