import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Check if user is actually authenticated (recovery redirect automatically establishes a session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError("No recovery session found. Please request a new password reset link.");
      }
      setSessionChecked(true);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password.trim()) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password.trim() });
      if (error) throw error;
      setSuccess("✅ Password reset successfully! Redirecting you to the dashboard...");
      
      // Get session to set user name in localStorage before redirecting
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        localStorage.setItem(
          "userName",
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email
        );
      }

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── LEFT: Animated Hero ─────────────────────────────────── */}
      <div className="auth-hero">
        <div className="auth-hero-bg" />
        <div className="auth-hero-grid" />
        <div className="auth-hero-glow-1" />
        <div className="auth-hero-glow-2" />

        <div className="auth-hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            AI-Powered Study Assistant
          </div>

          <h1 className="hero-heading">
            Reset Your<br />
            <em>Credentials.</em>
          </h1>

          <p className="hero-sub">
            Establish a secure new password for your account to immediately return
            to studying your documents, flashcards, and quizzes.
          </p>
        </div>
      </div>

      {/* ── RIGHT: Form ───────────────────────────────────── */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-form-logo">
            <div className="auth-form-logo-mark">🎓</div>
            <div className="auth-form-logo-name">StudyAI</div>
          </div>

          <div className="auth-form-header">
            <h1>Create new password</h1>
            <p>Set a strong password to secure your account</p>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}
          {success && <div className="alert alert-success" style={{ color: "#4caf50", border: "1px solid #4caf50", padding: "12px", borderRadius: "8px", margin: "10px 0" }}>{success}</div>}

          {sessionChecked && !success && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <input
                    id="new-password"
                    className="form-input has-icon"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || !!error.includes("No recovery session")}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <input
                    id="confirm-password"
                    className="form-input has-icon"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading || !!error.includes("No recovery session")}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-shine"
                type="submit"
                disabled={loading || !!error.includes("No recovery session")}
                style={{ marginTop: 12 }}
              >
                {loading ? <><span className="spinner" /> Resetting…</> : "Reset Password"}
              </button>
            </form>
          )}

          <p className="auth-footer">
            <a href="/login" className="link">← Back to Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
}
