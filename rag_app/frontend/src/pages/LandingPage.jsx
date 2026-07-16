import { Link } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* --- Navigation --- */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-mark">🎓</span>
          <span className="logo-text">StudyAI</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#testimonials">Testimonials</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn-login">Log in</Link>
          <Link to="/signup" className="btn-signup">Get Started</Link>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="landing-hero">
        <div className="hero-background">
          <div className="glow-sphere sphere-1"></div>
          <div className="glow-sphere sphere-2"></div>
          <div className="grid-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge-pill">
            <span className="badge-pulse"></span>
            Study Smarter, Not Harder v2.0
          </div>
          <h1 className="hero-title">
            Master Any Subject with <br />
            <span className="text-gradient">AI-Powered RAG</span>
          </h1>
          <p className="hero-subtitle">
            Instantly interact with your textbooks, lecture notes, and papers.
            Generate flashcards, take practice quizzes, and get precise answers in seconds.
          </p>
          <div className="hero-cta-group">
            <Link to="/signup" className="btn-primary-glow">
              Start Learning for Free
              <span className="arrow">→</span>
            </Link>
            <a href="#how-it-works" className="btn-secondary-outline">
              See how it works
            </a>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">10x</span>
              <span className="stat-label">Faster Prep</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">95%</span>
              <span className="stat-label">Better Recall</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">24/7</span>
              <span className="stat-label">AI Tutor</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- Features Section --- */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Supercharge Your Study Workflow</h2>
          <p>Everything you need to turn raw materials into structured knowledge.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">📄</span>
            </div>
            <h3>Intelligent Ingestion</h3>
            <p>Upload PDFs, DOCX, or TXT files. Our AI parses and indexes your materials instantly, preserving context and structure.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🤖</span>
            </div>
            <h3>Contextual Q&A</h3>
            <p>Ask complex questions and get accurate answers backed by exact citations from your own uploaded documents.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">⚡</span>
            </div>
            <h3>Auto-Generation</h3>
            <p>Instantly generate comprehensive flashcards and practice quizzes from any section of your study material.</p>
          </div>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section id="how-it-works" className="features-section" style={{ paddingTop: '2rem' }}>
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Get started in three simple steps.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">1</span>
            </div>
            <h3>Upload Material</h3>
            <p>Drag and drop your syllabus, lecture slides, or textbook chapters.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">2</span>
            </div>
            <h3>AI Processing</h3>
            <p>Our Retrieval-Augmented Generation (RAG) engine indexes your content.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">3</span>
            </div>
            <h3>Start Learning</h3>
            <p>Chat with your documents, generate quizzes, and master the subject.</p>
          </div>
        </div>
      </section>

      {/* --- Testimonials Section --- */}
      <section id="testimonials" className="features-section" style={{ paddingTop: '2rem' }}>
        <div className="section-header">
          <h2>What Students Say</h2>
          <p>Join thousands of students achieving better grades.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: 'var(--t1)' }}>"StudyAI has completely transformed how I prepare for exams. I just upload my lecture notes, and it creates flashcards for me in seconds. My grades have never been better!"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--p)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--t1)' }}>Sarah J.</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>Medical Student</span>
              </div>
            </div>
          </div>

          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: 'var(--t1)' }}>"The contextual Q&A is mind-blowing. When I get stuck on a complex engineering concept, I ask the AI, and it explains it perfectly using exact citations from my textbook."</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--s)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>M</div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--t1)' }}>Michael T.</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>Engineering Major</span>
              </div>
            </div>
          </div>

          <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: 'var(--t1)' }}>"I used to spend hours just organizing my notes before I could even start studying. Now, StudyAI does the heavy lifting, saving me at least 10 hours a week."</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>E</div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--t1)' }}>Emily R.</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>Law Student</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to ace your next exam?</h2>
          <p>Join thousands of students who are learning faster and remembering more.</p>
          <Link to="/signup" className="btn-primary-glow large">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-mark">🎓</span>
            <span className="logo-text">StudyAI</span>
            <p>Your personal AI study assistant.</p>
          </div>
          <div className="footer-links">
            <div className="link-column">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Use Cases</a>
            </div>
            <div className="link-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="link-column">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} StudyAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
