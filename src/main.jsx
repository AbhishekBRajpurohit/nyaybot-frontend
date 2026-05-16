import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./components/AuthContext";
import { AlertsProvider } from "./components/AlertsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AlertsProvider>
        <App />
      </AlertsProvider>
    </AuthProvider>
  </React.StrictMode>
);