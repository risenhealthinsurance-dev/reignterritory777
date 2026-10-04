import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider, RequireAuth } from "./auth/AuthProvider";
import { AuthScreen } from "./auth/AuthScreen";
import { supabase } from "./lib/supabase";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider client={supabase}>
      <RequireAuth
        loading={<main className="auth-screen">Checking secure session…</main>}
        fallback={<AuthScreen />}
      >
        <App />
      </RequireAuth>
    </AuthProvider>
  </React.StrictMode>,
);
