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
      {/* ── Left Hero Panel ────────────────────────────────────────── */}
      <div className="auth-hero">
        <div className="auth-hero-grid" />
        <div className="auth-hero-content">
          <div className="hero-logo">
            <div className="hero-logo-icon">🎓</div>
            <div className="hero-logo-text">StudyAI</div>
          </div>

          <h2 className="hero-tagline">
            Your AI-Powered<br />
            <span className="hero-tagline-highlight">Study Companion.</span>
          </h2>

          <p className="hero-sub">
            Join thousands of students who use StudyAI to ace their exams.
            Upload your notes and let AI do the heavy lifting.
          </p>

          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon">🔐</div>
              Secure, private — your documents belong to you
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">📚</div>
              RAG-powered answers from your exact study material
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">🏆</div>
              Flashcards &amp; quizzes to lock in what you learn
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────────────────── */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="brand">
            <div className="brand-icon">🎓</div>
            <h1>Create your account</h1>
            <p>Start studying smarter today</p>
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
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="john@example.com"
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

            <button className="btn btn-primary" type="submit" disabled={loading} id="signup-btn">
              {loading ? <><span className="spinner" /> Creating account…</> : "Create Account →"}
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
