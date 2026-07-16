import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

// This page handles the OAuth PKCE redirect from Google/GitHub.
// Supabase lands here with ?code=xxx — the SDK exchanges it for a real session.
// We then do a HARD redirect (window.location) — NOT React Router navigate —
// so the app does a fresh load and reads the session from storage. This
// prevents the race condition where PrivateRoute sees session=null because
// React state hasn't been updated yet.
export default function AuthCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribed = false;

    // 1. Set up listener FIRST so we don't miss the event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (unsubscribed) return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        localStorage.setItem(
          "userName",
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email
        );
        // Hard redirect — forces a fresh page load so App.jsx reads the
        // session from localStorage with no race condition.
        window.location.replace("/dashboard");
      }
    });

    // 2. Also check immediately in case SIGNED_IN already fired before listener was set
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (unsubscribed) return;
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (session) {
        localStorage.setItem(
          "userName",
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email
        );
        window.location.replace("/dashboard");
      }
    });

    // Safety timeout — if nothing happens in 10s, something went wrong
    const timeout = setTimeout(() => {
      if (unsubscribed) return;
      setError("Sign-in timed out. Please try again.");
    }, 10000);

    return () => {
      unsubscribed = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0f0f1a", color: "#fff", gap: "16px"
      }}>
        <p style={{ color: "#ff6b6b" }}>⚠️ {error}</p>
        <a href="/login" style={{ color: "#6c63ff" }}>← Back to login</a>
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0f0f1a", color: "#fff", gap: "16px"
    }}>
      <div style={{
        width: 48, height: 48, border: "3px solid #6c63ff",
        borderTopColor: "transparent", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ fontSize: 16, opacity: 0.7 }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
