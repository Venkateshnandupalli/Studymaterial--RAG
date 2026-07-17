import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./services/supabase";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";

function PrivateRoute({ children, session }) {
  return session ? children : <Navigate to="/login" replace />;
}

function App() {
  // null = not checked yet, false = no session, object = has session
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION (the current session or null).
    // This is the single source of truth — no need for a separate getSession() call.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Still initialising — don't render the router yet or PrivateRoute
  // will redirect to /login before the session is known.
  if (session === undefined) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f1a", color: "#fff" }}>
        Loading…
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        {/* OAuth PKCE callback — Supabase exchanges the ?code= here */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute session={session}>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
