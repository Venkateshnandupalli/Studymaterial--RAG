import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      const { access_token, name, email } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("userName", name || email);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
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
            Study Smarter.<br />
            <em>Score Higher.</em>
          </h1>

          <p className="hero-sub">
            Upload your study materials and instantly get answers, flashcards,
            and practice quizzes — powered by RAG AI.
          </p>

          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon">📄</div>
              <div className="hero-feature-text">
                <strong>Smart Document Upload</strong>
                <span>PDF, DOCX & TXT — processed in seconds</span>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">🤖</div>
              <div className="hero-feature-text">
                <strong>Natural Language Q&A</strong>
                <span>Ask anything, get precise cited answers</span>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">⚡</div>
              <div className="hero-feature-text">
                <strong>Auto Flashcards & Quizzes</strong>
                <span>Reinforce learning with AI-generated tests</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login Form ───────────────────────────────────── */}
      <div className="auth-form-side">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-form-logo">
            <div className="auth-form-logo-mark">🎓</div>
            <div className="auth-form-logo-name">StudyAI</div>
          </div>

          {/* Heading */}
          <div className="auth-form-header">
            <h1>Welcome back</h1>
            <p>Sign in to your account to continue</p>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              id="login-btn"
              style={{ marginTop: 8 }}
            >
              {loading
                ? <><span className="spinner" /> Signing in…</>
                : "Sign In →"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link className="link" to="/signup">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
