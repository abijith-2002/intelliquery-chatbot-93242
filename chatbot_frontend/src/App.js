import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/**
 * Modern, minimalistic, dark-themed chatbot frontend.
 * Features:
 *  - Real-time chat with FastAPI backend (`/chat`)
 *  - Displays RAG and Gemini answers, chat history, user/assistant styling
 *  - Minimal, accessible, fully responsive for desktop/mobile
 *  - Session persisted in localStorage for long-term context
 */

// Helpers
const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000/chat";

function generateSessionId() {
  // Unique, persistent session identifier in localStorage
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = "session-" + Math.random().toString(36).substr(2, 10);
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

// PUBLIC_INTERFACE
function App() {
  // --- State ---
  const [theme, setTheme] = useState("dark");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("conversation")) || [];
    } catch {
      return [];
    }
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // --- Effects: Theme & Chat Scroll ---
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme || "dark");
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("conversation", JSON.stringify(messages));
  }, [messages]);

  // --- Theme Toggle ---
  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // --- Handle Send ---
  // PUBLIC_INTERFACE
  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || pending) return;
    setPending(true);
    setError(null);

    // Add user message optimistically
    const newUserMsg = {
      role: "user",
      query: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((msgs) => [...msgs, newUserMsg]);
    setInput("");

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: generateSessionId(),
          query: input.trim(),
        }),
      });
      if (!resp.ok) throw new Error("Network/Backend error. Please try again.");
      const data = await resp.json();

      // Compose assistant message
      const aiMsg = {
        role: "assistant",
        rag_answer: data.rag_answer,
        gemini_answer: data.gemini_answer,
        timestamp: Date.now(),
      };
      setMessages((msgs) => [...msgs, aiMsg]);
    } catch (err) {
      setError(err.message || "Failed to get response.");
      // Remove pending user message if error for better UX
      setMessages((msgs) =>
        msgs.slice(0, msgs.length - 1)
      );
    } finally {
      setPending(false);
    }
  }

  // --- Render Chat Messages ---
  function renderMessage(msg, idx) {
    if (msg.role === "user") {
      return (
        <div key={idx} className="chat-message chat-user">
          <div className="chat-avatar" aria-label="You">🧑</div>
          <div className="chat-bubble">
            <span>{msg.query}</span>
            <span className="chat-meta">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      );
    }
    if (msg.role === "assistant") {
      return (
        <div key={idx} className="chat-message chat-assistant">
          <div className="chat-avatar" aria-label="AI">🤖</div>
          <div className="chat-bubble chat-bubble-assistant">
            <strong>Gemini:</strong>
            <div className="msg-ai">
              <span>{msg.gemini_answer}</span>
            </div>
            <hr className="chat-divider" />
            <strong>RAG:</strong>
            <div className="msg-ai msg-ai-secondary">
              <span>{msg.rag_answer}</span>
            </div>
            <span className="chat-meta">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      );
    }
    return null;
  }

  // PUBLIC_INTERFACE
  function handleInputKey(e) {
    if (e.key === "Enter" && !e.shiftKey && input.trim() && !pending) {
      handleSend(e);
    }
  }

  // PUBLIC_INTERFACE
  function handleClear() {
    setMessages([]);
    localStorage.removeItem("conversation");
  }

  // --- Layout ---
  return (
    <div className="App">
      {/* Header (redesigned) */}
      <header className="chat-header">
        <div className="brand">
          <span className="header-icon" aria-label="info">
            {/* Info icon as SVG for crisp, consistent look */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#262e3b" stroke="#346EF1" strokeWidth="2"/>
              <text x="12" y="17" textAnchor="middle" fontSize="11" fontFamily="Arial" fill="#7ac8f3" fontWeight="600">i</text>
            </svg>
          </span>
          Knowledge Bot
        </div>
        {/* Help/Profile button (pill-shaped) */}
        <button
          className="profile-pill"
          type="button"
          tabIndex={0}
          aria-label="How to test"
          title="How to test the chatbot"
          // Optionally you can add a click handler for user help flow
        >
          How to test
        </button>
      </header>

      {/* Main Layout */}
      <main className="chat-main">
        {/* Chat Area */}
        <section className="chat-area" aria-live="polite">
          {/* System error (top, only if error present) */}
          {error && <div className="chat-error" role="alert">{error}</div>}

          {/* Welcome message (if no messages) */}
          {messages.length === 0 ? (
            <div className="chat-empty">
              Welcome! Ask anything about our knowledge base or Gemini AI.
            </div>
          ) : (
            messages.map((msg, idx) => renderMessage(msg, idx))
          )}
          <div ref={chatEndRef} />
        </section>
      </main>

      {/* Chat input docked at bottom */}
      <footer className="chat-footer">
        <form className="chat-form" onSubmit={handleSend} autoComplete="off">
          <div className="chat-input-wrap">
            <textarea
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleInputKey}
              placeholder={pending ? "Awaiting response..." : "Type your message..."}
              rows={1}
              maxLength={2000}
              disabled={pending}
              aria-label="Message"
              autoFocus
              required
            />
          </div>
          <button
            className="btn-send"
            type="submit"
            disabled={pending || !input.trim()}
            aria-label="Send"
          >
            {/* SVG right arrow for send (per design) */}
            {pending
              ? <span style={{ fontSize: "1.24em" }}>...</span>
              : (
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="none"/>
                  <path d="M7 12h9m0 0l-4-4m4 4l-4 4" stroke="#fff" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            }
          </button>
          <button
            className="btn-clear"
            type="button"
            disabled={pending || messages.length === 0}
            aria-label="Clear chat"
            onClick={handleClear}
            title="Clear your chat history"
          >
            🗑️
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;
