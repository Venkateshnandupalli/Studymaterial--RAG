import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";

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
      await register(form);
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
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
          {/* Logo */}
          <div className="auth-form-logo">
            <div className="auth-form-logo-mark">🎓</div>
            <div className="auth-form-logo-name">StudyAI</div>
          </div>

          {/* Heading */}
          <div className="auth-form-header">
            <h1>Create your account</h1>
            <p>Free forever — no credit card required</p>
          </div>

          {error   && <div className="alert alert-error">⚠️ {error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                className="form-input"
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                className="form-input"
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              id="signup-btn"
              style={{ marginTop: 8 }}
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
