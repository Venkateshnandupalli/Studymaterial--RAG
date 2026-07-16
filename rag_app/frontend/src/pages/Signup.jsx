import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
          }
        }
      });
      
      if (error) throw error;
      
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || `Failed to authenticate with ${provider}`);
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
            Join 1000+ students already studying smarter
          </div>

          <h1 className="hero-heading">
            Your AI Study<br />
            <em>Companion Awaits.</em>
          </h1>

          <p className="hero-sub">
            Create your free account and start turning your notes into an
            interactive, intelligent study experience.
          </p>

          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon">🔐</div>
              <div className="hero-feature-text">
                <strong>Private & Secure</strong>
                <span>Your documents are encrypted and belong to you</span>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">📚</div>
              <div className="hero-feature-text">
                <strong>RAG-Powered Answers</strong>
                <span>Answers grounded in your exact study material</span>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">🏆</div>
              <div className="hero-feature-text">
                <strong>Exam-Ready in Minutes</strong>
                <span>Flashcards & quizzes to lock in what you learn</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Sign-Up Form ─────────────────────────────────── */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-form-logo">
            <div className="auth-form-logo-mark">🎓</div>
            <div className="auth-form-logo-name">StudyAI</div>
          </div>

          <div className="auth-form-header">
            <h1>Create your account</h1>
            <p>Free forever — no credit card required</p>
          </div>

          {error   && <div className="alert alert-error">⚠️ {error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}

          <div className="social-logins">
            <button type="button" className="btn-social" onClick={() => handleOAuthLogin('google')}>
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
              Google
            </button>
            <button type="button" className="btn-social" onClick={() => handleOAuthLogin('github')}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </button>
          </div>

          <div className="auth-separator">
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <input
                  id="signup-name"
                  className="form-input has-icon"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email Address</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input
                  id="signup-email"
                  className="form-input has-icon"
                  type="email"
                  name="email"
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input
                  id="signup-password"
                  className="form-input has-icon"
                  type="password"
                  name="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-shine"
              type="submit"
              disabled={loading}
              id="signup-btn"
              style={{ marginTop: 12 }}
            >
              {loading
                ? <><span className="spinner" /> Creating account…</>
                : "Create Free Account →"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link className="link" to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
