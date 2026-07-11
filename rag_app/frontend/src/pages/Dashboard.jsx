import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile, listDocuments, askQuestion, generateFlashcards, generateQuiz, deleteDocument } from "../services/api";

function getFileIcon(name = "") {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (ext === "docx") return "📝";
  if (ext === "txt") return "📃";
  return "📁";
}

function StatusBadge({ status }) {
  const map = { READY: "status-ready", PROCESSING: "status-processing", FAILED: "status-failed" };
  return <span className={`status-badge ${map[status] || "status-processing"}`}>{status}</span>;
}

function formatMessageText(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/^###\s+(.+)$/gm, '<h4 class="chat-heading">$1</h4>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="chat-list-item">$1</li>');
  html = html.replace(/\n/g, "<br />");
  return html;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "User";
  const initials = userName.slice(0, 2).toUpperCase();

  const [documents, setDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(""); // "", "uploading", "success", "error"
  const [uploadMsg, setUploadMsg] = useState("");

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  // Document selection state
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  // Study states: Flashcards
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

  // Study states: Quizzes
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const chatEndRef = useRef(null);
  const pollRef = useRef(null);

  // ── Load documents ───────────────────────────────────────────────
  const fetchDocs = useCallback(async () => {
    try {
      const res = await listDocuments();
      setDocuments(res.data.documents || []);
    } catch {
      // silently ignore auth errors — App.jsx handles redirect
    }
  }, []);

  useEffect(() => {
    fetchDocs();
    // Poll every 5s to catch PROCESSING → READY transitions
    pollRef.current = setInterval(fetchDocs, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchDocs]);

  // ── Scroll chat to bottom ────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  // ── Logout ───────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  // ── Upload ───────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadMsg(`Uploading "${file.name}"…`);

    try {
      await uploadFile(file, setUploadProgress);
      setUploadStatus("success");
      setUploadMsg(`"${file.name}" uploaded! Processing in background…`);
      fetchDocs();
      setTimeout(() => setUploadStatus(""), 4000);
    } catch (err) {
      setUploadStatus("error");
      setUploadMsg(err.response?.data?.detail || "Upload failed. Please try again.");
      setTimeout(() => setUploadStatus(""), 4000);
    }
  };

  // ── Ask question ─────────────────────────────────────────────────
  const handleAsk = async () => {
    const q = question.trim();
    if (!q || asking) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setAsking(true);

    try {
      const res = await askQuestion(q, selectedDocIds.length > 0 ? selectedDocIds : null);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.data.answer,
          sources: res.data.sources_used,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: err.response?.data?.detail || "Something went wrong. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  // Toggle specific document selection
  const handleToggleDocSelection = (docId) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(docId)) {
        return prev.filter((id) => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // Open and load flashcards
  const handleOpenFlashcards = async (docId) => {
    setShowFlashcards(true);
    setLoadingFlashcards(true);
    setFlashcards([]);
    setCurrentCardIdx(0);
    setCardFlipped(false);
    try {
      const res = await generateFlashcards(docId);
      setFlashcards(res.data.flashcards || []);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to generate flashcards.");
      setShowFlashcards(false);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  // Open and load quiz
  const handleOpenQuiz = async (docId) => {
    setShowQuiz(true);
    setLoadingQuiz(true);
    setQuizQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizFinished(false);
    try {
      const res = await generateQuiz(docId);
      setQuizQuestions(res.data.quiz || []);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to generate practice quiz.");
      setShowQuiz(false);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleDeleteDocument = async (docId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This will permanently remove all text chunks and vector embeddings.`)) {
      return;
    }
    try {
      await deleteDocument(docId);
      // Remove from document selection if selected
      setSelectedDocIds((prev) => prev.filter((id) => id !== docId));
      // Remove from local documents list
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete document.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="dashboard">
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="navbar-brand-icon">🎓</span>
          StudyAI
        </div>
        <div className="navbar-right">
          <div className="user-badge">
            <div className="user-avatar">{initials}</div>
            {userName}
          </div>
          <button className="logout-btn" onClick={handleLogout} id="logout-btn">
            Sign out
          </button>
        </div>
      </nav>

      {/* Main grid */}
      <div className="dashboard-content">

        {/* Left panel: Upload + Docs */}
        <aside>
          <div className="panel">
            <h2 className="panel-title"><span>📤</span> Upload Document</h2>

            {/* Drop zone */}
            <div className={`upload-zone ${uploadStatus === "uploading" ? "drag-over" : ""}`}>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                disabled={uploadStatus === "uploading"}
              />
              <div className="upload-icon">
                {uploadStatus === "uploading" ? "⏳" : uploadStatus === "success" ? "✅" : uploadStatus === "error" ? "❌" : "☁️"}
              </div>
              <div className="upload-hint">
                {uploadStatus === ""
                  ? <><strong>Click to browse</strong> or drag & drop your file here</>
                  : uploadMsg}
              </div>
              <div className="upload-formats">Supports PDF · DOCX · TXT</div>
            </div>

            {/* Progress bar */}
            {uploadStatus === "uploading" && (
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            {/* Alert after upload */}
            {(uploadStatus === "success" || uploadStatus === "error") && (
              <div className={`alert ${uploadStatus === "success" ? "alert-success" : "alert-error"}`}>
                {uploadStatus === "success" ? "✅" : "⚠️"} {uploadMsg}
              </div>
            )}
          </div>

          {/* Documents list */}
          <div className="panel" style={{ marginTop: 20 }}>
            <h2 className="panel-title"><span>📚</span> Your Documents</h2>
            {documents.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "16px 0" }}>
                No documents yet. Upload one to get started!
              </div>
            ) : (
              <div className="doc-list">
                {documents.map((doc) => (
                  <div className="doc-item" key={doc.id}>
                    <span className="doc-icon">{getFileIcon(doc.file_name)}</span>
                    <div className="doc-info">
                      <div className="doc-name" title={doc.file_name}>{doc.file_name}</div>
                      <div className="doc-meta-row">
                        <span className="doc-meta">{doc.created_at?.slice(0, 10)}</span>
                        <div className="doc-actions">
                          {doc.status === "READY" && (
                            <>
                              <button
                                className="doc-action-btn"
                                onClick={() => handleOpenFlashcards(doc.id)}
                                title="Study Flashcards"
                              >
                                ⚡ Card
                              </button>
                              <button
                                className="doc-action-btn"
                                onClick={() => handleOpenQuiz(doc.id)}
                                title="Take Practice Quiz"
                              >
                                📝 Quiz
                              </button>
                            </>
                          )}
                          <button
                            className="doc-action-btn doc-action-btn-danger"
                            onClick={() => handleDeleteDocument(doc.id, doc.file_name)}
                            title="Delete Document"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right panel: Chat */}
        <div className="panel chat-panel">
          <h2 className="panel-title"><span>💬</span> Ask a Question</h2>

          {/* Messages */}
          <div className="chat-messages" id="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">🤖</div>
                <h3>Ask anything</h3>
                <p>Upload a study document on the left, then ask questions about it here.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`msg msg-${msg.role}`}>
                  <span className="msg-role">{msg.role === "user" ? "You" : "StudyAI"}</span>
                  <div className={`msg-bubble${msg.isError ? " alert-error" : ""}`}
                    style={msg.isError ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" } : {}}
                    dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }}
                  />
                  {msg.sources && (
                    <span className="msg-sources">📎 {msg.sources} source chunk{msg.sources !== 1 ? "s" : ""} used</span>
                  )}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {asking && (
              <div className="msg msg-bot">
                <span className="msg-role">StudyAI</span>
                <div className="msg-bubble">
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Document selection pills */}
          <div className="document-selector-container">
            <div className="selector-label">Query Focus:</div>
            <div className="pill-list">
              <button
                className={`pill-item ${selectedDocIds.length === 0 ? "active" : ""}`}
                onClick={() => setSelectedDocIds([])}
              >
                🌐 All Documents
              </button>
              {documents
                .filter((doc) => doc.status === "READY")
                .map((doc) => (
                  <button
                    key={doc.id}
                    className={`pill-item ${selectedDocIds.includes(doc.id) ? "active" : ""}`}
                    onClick={() => handleToggleDocSelection(doc.id)}
                  >
                    {getFileIcon(doc.file_name)} {doc.file_name}
                  </button>
                ))}
            </div>
          </div>

          {/* Input */}
          <div className="chat-input-wrap">
            <textarea
              id="chat-input"
              className="chat-input"
              placeholder="Ask a question about your documents… (Enter to send)"
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={asking}
            />
            <button
              id="send-btn"
              className="send-btn"
              onClick={handleAsk}
              disabled={!question.trim() || asking}
              title="Send"
            >
              {asking ? <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : "↑"}
            </button>
          </div>
        </div>
      </div>

      {/* ── FLASHCARDS MODAL ──────────────────────────────────────────────── */}
      {showFlashcards && (
        <div className="study-modal-overlay" onClick={() => setShowFlashcards(false)}>
          <div className="study-modal" onClick={(e) => e.stopPropagation()}>
            <div className="study-modal-header">
              <div className="study-modal-title">⚡ Study Flashcards</div>
              <button className="close-modal-btn" onClick={() => setShowFlashcards(false)}>×</button>
            </div>
            <div className="study-modal-body">
              {loadingFlashcards ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "var(--accent)" }} />
                  <p style={{ marginTop: 12, color: "var(--text-secondary)", fontSize: 13 }}>Generating study cards...</p>
                </div>
              ) : flashcards.length === 0 ? (
                <div style={{ color: "var(--red)", padding: "20px 0" }}>Failed to generate flashcards. Please try again.</div>
              ) : (
                <>
                  <div className="quiz-progress-text">Card {currentCardIdx + 1} of {flashcards.length}</div>
                  <div className="flashcard-container">
                    <div className={`flashcard ${cardFlipped ? "flipped" : ""}`} onClick={() => setCardFlipped(!cardFlipped)}>
                      <div className="flashcard-side flashcard-front">
                        <div className="flashcard-hint">Question / Term</div>
                        <div className="flashcard-text">{flashcards[currentCardIdx]?.front}</div>
                      </div>
                      <div className="flashcard-side flashcard-back">
                        <div className="flashcard-hint">Answer / Explanation</div>
                        <div className="flashcard-text">{flashcards[currentCardIdx]?.back}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!loadingFlashcards && flashcards.length > 0 && (
              <div className="study-modal-footer">
                <button
                  className="nav-arrow-btn"
                  onClick={() => {
                    setCurrentCardIdx((prev) => Math.max(0, prev - 1));
                    setCardFlipped(false);
                  }}
                  disabled={currentCardIdx === 0}
                >
                  ← Previous
                </button>
                <div style={{ fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }} onClick={() => setCardFlipped(!cardFlipped)}>
                  [ Click card to flip ]
                </div>
                <button
                  className="nav-arrow-btn"
                  onClick={() => {
                    setCurrentCardIdx((prev) => Math.min(flashcards.length - 1, prev + 1));
                    setCardFlipped(false);
                  }}
                  disabled={currentCardIdx === flashcards.length - 1}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUIZ MODAL ────────────────────────────────────────────────────── */}
      {showQuiz && (
        <div className="study-modal-overlay" onClick={() => setShowQuiz(false)}>
          <div className="study-modal" onClick={(e) => e.stopPropagation()}>
            <div className="study-modal-header">
              <div className="study-modal-title">📝 Practice Quiz</div>
              <button className="close-modal-btn" onClick={() => setShowQuiz(false)}>×</button>
            </div>
            <div className="study-modal-body">
              {loadingQuiz ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "var(--accent)" }} />
                  <p style={{ marginTop: 12, color: "var(--text-secondary)", fontSize: 13 }}>Generating practice quiz...</p>
                </div>
              ) : quizQuestions.length === 0 ? (
                <div style={{ color: "var(--red)", padding: "20px 0" }}>Failed to generate practice quiz. Please try again.</div>
              ) : quizFinished ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
                  <div className="quiz-score-circle">{quizScore} / {quizQuestions.length}</div>
                  <div className="quiz-result-title">Quiz Completed!</div>
                  <div className="quiz-result-msg">
                    {quizScore === quizQuestions.length
                      ? "Perfect score! You're ready for the exam."
                      : "Great effort! Review the explanations to reinforce your understanding."}
                  </div>
                  <button className="quiz-submit-btn" onClick={() => setShowQuiz(false)}>Done</button>
                </div>
              ) : (
                <>
                  <div className="quiz-progress-text">Question {currentQuestionIdx + 1} of {quizQuestions.length}</div>
                  <div className="quiz-question-box">{quizQuestions[currentQuestionIdx]?.question}</div>
                  <div className="quiz-options-list">
                    {quizQuestions[currentQuestionIdx]?.options.map((opt, idx) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrect = opt === quizQuestions[currentQuestionIdx]?.correct_answer;
                      let btnClass = "";
                      if (quizSubmitted) {
                        if (isCorrect) btnClass = "correct";
                        else if (isSelected) btnClass = "incorrect";
                      }
                      return (
                        <button
                          key={idx}
                          className={`quiz-option-btn ${btnClass}`}
                          onClick={() => {
                            if (!quizSubmitted) setSelectedAnswer(opt);
                          }}
                          disabled={quizSubmitted}
                          style={selectedAnswer === opt && !quizSubmitted ? { borderColor: "var(--accent)", background: "var(--accent-glow)" } : {}}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className="quiz-explanation-box">
                      <strong>Explanation:</strong> {quizQuestions[currentQuestionIdx]?.explanation}
                    </div>
                  )}
                </>
              )}
            </div>
            {!loadingQuiz && quizQuestions.length > 0 && !quizFinished && (
              <div className="study-modal-footer" style={{ justifyContent: "flex-end" }}>
                {!quizSubmitted ? (
                  <button
                    className="quiz-submit-btn"
                    onClick={() => {
                      if (!selectedAnswer) return;
                      const isCorrect = selectedAnswer === quizQuestions[currentQuestionIdx]?.correct_answer;
                      if (isCorrect) setQuizScore((prev) => prev + 1);
                      setQuizSubmitted(true);
                    }}
                    disabled={!selectedAnswer}
                    style={!selectedAnswer ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    className="quiz-submit-btn"
                    onClick={() => {
                      if (currentQuestionIdx === quizQuestions.length - 1) {
                        setQuizFinished(true);
                      } else {
                        setCurrentQuestionIdx((prev) => prev + 1);
                        setSelectedAnswer(null);
                        setQuizSubmitted(false);
                      }
                    }}
                  >
                    {currentQuestionIdx === quizQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
