import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile, listDocuments, askQuestion } from "../services/api";

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
      const res = await askQuestion(q);
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
                      <div className="doc-meta">{doc.created_at?.slice(0, 10)}</div>
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
                    style={msg.isError ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" } : {}}>
                    {msg.text}
                  </div>
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
    </div>
  );
}
