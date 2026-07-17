import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile, listDocuments, askQuestion, generateFlashcards, generateQuiz, deleteDocument } from "../services/api";

// --- SVG Icons ---
const Icons = {
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Library: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Lightning: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  CheckSquare: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  MessageCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  Bot: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  LogOut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Key: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>
};

function StatusBadge({ status }) {
  const map = { READY: "status-ready", PROCESSING: "status-processing", FAILED: "status-failed" };
  return <span className={`status-badge ${map[status] || "status-processing"}`}>{status}</span>;
}

function formatMessageText(text) {
  if (!text) return "";
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  // Study states
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);



  const containerRef = useRef(null);
  const chatEndRef = useRef(null);
  const pollRef = useRef(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await listDocuments();
      setDocuments(res.data.documents || []);
    } catch { }
  }, []);

  useEffect(() => {
    fetchDocs();
    pollRef.current = setInterval(fetchDocs, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchDocs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const handleLogout = async () => {
    const { supabase } = await import("../services/supabase");
    await supabase.auth.signOut();
    localStorage.removeItem("userName");
    navigate("/login");
  };



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
      setUploadMsg(`"${file.name}" uploaded! Processing…`);
      fetchDocs();
      setTimeout(() => setUploadStatus(""), 4000);
    } catch (err) {
      setUploadStatus("error");
      setUploadMsg(err.response?.data?.detail || "Upload failed.");
      setTimeout(() => setUploadStatus(""), 4000);
    }
  };

  const handleAsk = async (textOverride) => {
    const q = (typeof textOverride === "string" ? textOverride : question).trim();
    if (!q || asking) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text: q, time: now }]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await askQuestion(q, selectedDocIds.length > 0 ? selectedDocIds : null);
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [...prev, { role: "bot", text: res.data.answer, sources: res.data.sources_used, time: botTime }]);
    } catch (err) {
      const errTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [...prev, { role: "bot", text: err.response?.data?.detail || "Something went wrong.", isError: true, time: errTime }]);
    } finally {
      setAsking(false);
    }
  };

  const handleToggleDocSelection = (docId) => {
    setSelectedDocIds((prev) => prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]);
  };

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
      alert("Failed to generate flashcards.");
      setShowFlashcards(false);
    } finally {
      setLoadingFlashcards(false);
    }
  };

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
      alert("Failed to generate quiz.");
      setShowQuiz(false);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleDeleteDocument = async (docId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(docId);
      setSelectedDocIds((prev) => prev.filter((id) => id !== docId));
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (err) {
      alert("Failed to delete document.");
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="dashboard-3d-wrapper" ref={containerRef}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-grid" />

      {/* 3D Container (Static) */}
      <div className="dashboard-3d-container">
        <nav className="navbar pro-navbar">
          <div className="navbar-brand">
            <div className="brand-logo"><Icons.Library /></div>
            StudyAI
          </div>
          <div className="navbar-right">
            <div className="user-badge">
              <div className="user-avatar-pro"><Icons.User /></div>
              <span className="user-name-text">{userName}</span>
            </div>

            <button className="logout-btn pro-logout" onClick={handleLogout} title="Sign Out">
              <Icons.LogOut />
            </button>
          </div>
        </nav>

        <div className="dashboard-content pro-layout">
          {/* LEFT SIDEBAR */}
          <aside className="pro-sidebar">
            <div className="panel pro-panel upload-panel-3d">
              <div className="panel-label">
                <Icons.Upload /> Upload Material
              </div>
              <div className={`upload-zone pro-upload ${uploadStatus === "uploading" ? "drag-over" : ""}`}>
                <input id="file-upload" type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} disabled={uploadStatus === "uploading"} />
                <div className="upload-icon-pro">
                  {uploadStatus === "uploading" ? <span className="spinner" /> 
                    : uploadStatus === "success" ? <Icons.CheckSquare /> 
                    : <Icons.FileText />}
                </div>
                <div className="upload-hint pro-hint">
                  {uploadStatus === "" ? <><strong>Click to upload</strong> or drag & drop</> : uploadMsg}
                </div>
              </div>
              {uploadStatus === "uploading" && (
                <div className="progress-bar-wrap pro-progress">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>

            <div className="panel pro-panel library-panel-3d">
              <div className="panel-label">
                <Icons.Library /> Document Library
                <span className="panel-title-badge pro-badge">{documents.length}</span>
              </div>
              {documents.length === 0 ? (
                <div className="empty-library">
                  <Icons.FileText />
                  <p>No documents yet.</p>
                </div>
              ) : (
                <div className="doc-list pro-doc-list">
                  {documents.map((doc) => (
                    <div className="doc-item pro-doc-item" key={doc.id}>
                      <div className="doc-item-main">
                        <div className="doc-icon-pro"><Icons.FileText /></div>
                        <div className="doc-info">
                          <div className="doc-name">{doc.file_name}</div>
                          <div className="doc-meta-row">
                            <StatusBadge status={doc.status} />
                            <span className="doc-date">{doc.created_at?.slice(0, 10)}</span>
                          </div>
                        </div>
                      </div>
                      {doc.status === "READY" && (
                        <div className="doc-actions-inline">
                          <button className="pro-action-pill" onClick={() => handleOpenFlashcards(doc.id)} title="Flashcards"><Icons.Lightning /> Flashcards</button>
                          <button className="pro-action-pill" onClick={() => handleOpenQuiz(doc.id)} title="Quiz"><Icons.CheckSquare /> Quiz</button>
                          <button className="pro-action-pill danger-pill" onClick={() => handleDeleteDocument(doc.id, doc.file_name)} title="Delete"><Icons.Trash /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT CHAT PANEL */}
          <div className="chat-panel pro-chat-panel">
            <div className="chat-header pro-chat-header chat-header-3d">
              <div className="chat-header-title">
                <Icons.MessageCircle /> Ask StudyAI
              </div>
              <div className="document-selector-pill-container">
                {documents.filter(d => d.status === "READY").length > 0 ? (
                  <div className="pill-list-mini">
                    <button className={`pill-mini ${selectedDocIds.length === 0 ? "active" : ""}`} onClick={() => setSelectedDocIds([])}>All Docs</button>
                    {documents.filter(d => d.status === "READY").map(doc => (
                      <button key={doc.id} className={`pill-mini ${selectedDocIds.includes(doc.id) ? "active" : ""}`} onClick={() => handleToggleDocSelection(doc.id)}>
                        {doc.file_name.length > 15 ? doc.file_name.substring(0, 15) + "..." : doc.file_name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="chat-header-sub">Waiting for documents...</span>
                )}
              </div>
            </div>

            <div className="chat-messages pro-messages chat-messages-3d" id="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty pro-empty">
                  <div className="chat-empty-icon-pro"><Icons.Bot /></div>
                  <h3>How can I help you study?</h3>
                  <div className="chat-suggestions-pro">
                    <button onClick={() => handleAsk("Summarize the key concepts of the document.")}>Summarize concepts</button>
                    <button onClick={() => handleAsk("What are the most important terms to remember?")}>Important terms</button>
                    <button onClick={() => handleAsk("Explain the main topic like I'm 5 years old.")}>Explain simply</button>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`msg msg-${msg.role} pro-msg`}>
                    <div className="msg-header">
                      <div className="msg-avatar pro-avatar">
                        {msg.role === "user" ? <Icons.User /> : <Icons.Bot />}
                      </div>
                      <span className="msg-role">{msg.role === "user" ? "You" : "StudyAI"}</span>
                      {msg.time && <span className="msg-time">{msg.time}</span>}
                    </div>
                    <div className={`msg-bubble pro-bubble${msg.isError ? " error-bubble" : ""}`} dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }} />
                    {msg.sources && <span className="msg-sources pro-sources"><Icons.FileText /> {msg.sources} source{msg.sources !== 1 ? "s" : ""}</span>}
                  </div>
                ))
              )}
              {asking && (
                <div className="msg msg-bot pro-msg">
                  <div className="msg-header">
                    <div className="msg-avatar pro-avatar"><Icons.Bot /></div>
                    <span className="msg-role">StudyAI</span>
                  </div>
                  <div className="msg-bubble pro-bubble typing-bubble">
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area pro-input-area chat-input-3d">
              <div className="chat-input-wrap pro-input-wrap">
                <textarea id="chat-input" className="chat-input" placeholder="Type your question here..." rows={1} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKeyDown} disabled={asking} />
                <button id="send-btn" className="send-btn pro-send-btn" onClick={handleAsk} disabled={!question.trim() || asking}>
                  {asking ? <span className="spinner" /> : <Icons.Send />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* FLASHCARDS MODAL */}
      {showFlashcards && (
        <div className="study-modal-overlay" onClick={() => setShowFlashcards(false)}>
          <div className="study-modal pro-modal" onClick={(e) => e.stopPropagation()}>
            <div className="study-modal-header">
              <div className="study-modal-title"><Icons.Lightning /> Flashcards</div>
              <button className="close-modal-btn" onClick={() => setShowFlashcards(false)}><Icons.Close /></button>
            </div>
            <div className="study-modal-body">
              {loadingFlashcards ? (
                <div className="loading-state-pro"><span className="spinner" /><p>Generating smart flashcards...</p></div>
              ) : flashcards.length === 0 ? (
                <div className="error-state-pro">Failed to generate flashcards.</div>
              ) : (
                <>
                  <div className="quiz-progress-text">Card {currentCardIdx + 1} of {flashcards.length}</div>
                  <div className="flashcard-container">
                    <div className={`flashcard ${cardFlipped ? "flipped" : ""}`} onClick={() => setCardFlipped(!cardFlipped)}>
                      <div className="flashcard-side flashcard-front">
                        <div className="flashcard-hint">Term</div>
                        <div className="flashcard-text">{flashcards[currentCardIdx]?.front}</div>
                      </div>
                      <div className="flashcard-side flashcard-back">
                        <div className="flashcard-hint">Definition</div>
                        <div className="flashcard-text">{flashcards[currentCardIdx]?.back}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!loadingFlashcards && flashcards.length > 0 && (
              <div className="study-modal-footer">
                <button className="nav-arrow-btn" onClick={() => { setCurrentCardIdx((p) => Math.max(0, p - 1)); setCardFlipped(false); }} disabled={currentCardIdx === 0}>← Prev</button>
                <div className="flip-hint">Click card to flip</div>
                <button className="nav-arrow-btn" onClick={() => { setCurrentCardIdx((p) => Math.min(flashcards.length - 1, p + 1)); setCardFlipped(false); }} disabled={currentCardIdx === flashcards.length - 1}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUIZ MODAL */}
      {showQuiz && (
        <div className="study-modal-overlay" onClick={() => setShowQuiz(false)}>
          <div className="study-modal pro-modal" onClick={(e) => e.stopPropagation()}>
            <div className="study-modal-header">
              <div className="study-modal-title"><Icons.CheckSquare /> Practice Quiz</div>
              <button className="close-modal-btn" onClick={() => setShowQuiz(false)}><Icons.Close /></button>
            </div>
            <div className="study-modal-body">
              {loadingQuiz ? (
                <div className="loading-state-pro"><span className="spinner" /><p>Generating practice quiz...</p></div>
              ) : quizQuestions.length === 0 ? (
                <div className="error-state-pro">Failed to generate quiz.</div>
              ) : quizFinished ? (
                <div className="quiz-results-pro">
                  <div className="quiz-score-circle">{quizScore}/{quizQuestions.length}</div>
                  <div className="quiz-result-title">Quiz Complete! 🎉</div>
                  <p>{quizScore === quizQuestions.length ? "Perfect score!" : "Great effort! Review the explanations."}</p>
                  <button className="btn btn-primary" onClick={() => setShowQuiz(false)}>Done</button>
                </div>
              ) : (
                <>
                  <div className="quiz-progress-text">Question {currentQuestionIdx + 1} of {quizQuestions.length}</div>
                  <div className="quiz-question-box pro-question-box">{quizQuestions[currentQuestionIdx]?.question}</div>
                  <div className="quiz-options-list pro-options">
                    {(quizQuestions[currentQuestionIdx]?.options || []).map((opt, idx) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrect  = opt === quizQuestions[currentQuestionIdx]?.correct_answer;
                      let btnClass = "";
                      if (quizSubmitted) {
                        if (isCorrect) btnClass = "correct";
                        else if (isSelected) btnClass = "incorrect";
                      }
                      return (
                        <button key={idx} className={`quiz-option-btn pro-option-btn ${btnClass}`} onClick={() => { if (!quizSubmitted) setSelectedAnswer(opt); }} disabled={quizSubmitted} style={selectedAnswer === opt && !quizSubmitted ? { borderColor: "var(--p)", background: "var(--p-soft)" } : {}}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className="quiz-explanation-box pro-explanation">
                      <strong>Explanation:</strong> {quizQuestions[currentQuestionIdx]?.explanation}
                    </div>
                  )}
                </>
              )}
            </div>
            {!loadingQuiz && quizQuestions.length > 0 && !quizFinished && (
              <div className="study-modal-footer" style={{ justifyContent: "flex-end" }}>
                {!quizSubmitted ? (
                  <button className="btn btn-primary" onClick={() => {
                      if (!selectedAnswer) return;
                      if (selectedAnswer === quizQuestions[currentQuestionIdx]?.correct_answer) setQuizScore((p) => p + 1);
                      setQuizSubmitted(true);
                    }} disabled={!selectedAnswer}>Submit Answer</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => {
                      if (currentQuestionIdx === quizQuestions.length - 1) setQuizFinished(true);
                      else { setCurrentQuestionIdx((p) => p + 1); setSelectedAnswer(null); setQuizSubmitted(false); }
                    }}>{currentQuestionIdx === quizQuestions.length - 1 ? "Finish Quiz" : "Next Question"}</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}