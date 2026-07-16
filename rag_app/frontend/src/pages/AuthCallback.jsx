import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

// This page handles the OAuth redirect from Google/GitHub.
// Supabase PKCE flow sends the user here with a ?code= param.
// Supabase SDK automatically exchanges it for a session, then
// onAuthStateChange in App.jsx fires SIGNED_IN and we navigate to /dashboard.
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Give supabase a moment to exchange the code, then redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        localStorage.setItem(
          "userName",
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email
        );
        navigate("/dashboard", { replace: true });
      }
    });

    // Safety fallback: if already have a session, go straight to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem(
          "userName",
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email
        );
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0f1a",
      color: "#fff",
      gap: "16px"
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
