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
          <div className="chat-bubble">
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
      {/* Header/Nav */}
      <header className="chat-header">
        <div className="brand">
          <span className="header-avatar" aria-label="Bot">{/* avatar */} <svg width="20" height="20" viewBox="0 0 20 20" style={{display:"block"}} fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="8" r="4" fill="#fff"/><ellipse cx="10" cy="15.05" rx="6" ry="3.2" fill="#fff" fillOpacity="0.6"/></svg></span>
          <span>Knowledge Bot</span>
        </div>
        {/* Example user quick-action (from screenshot 2) */}
        <button
          className="header-user-btn"
          type="button"
          tabIndex={0}
          title="Try sample test query"
          onClick={() => {
            // Send a demo message if not pending
            if (!pending) {
              setInput("How do I test the chatbot?");
              setTimeout(() => {
                document.querySelector('.chat-input')?.focus();
              }, 50);
            }
          }}
        >
          how to test
        </button>
      </header>

      {/* Main Layout */}
      <main className="chat-main">
        {/* Chat Area */}
        <section className="chat-area" aria-live="polite">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>Welcome! Ask me anything about knowledge or Gemini AI.</p>
            </div>
          ) : (
            messages.map((msg, idx) => renderMessage(msg, idx))
          )}
          <div ref={chatEndRef} />
        </section>
      </main>

      {/* Error bar above input */}
      {error && (
        <div className="chat-error" role="alert">
          {error}
        </div>
      )}
      {/* Chat input bar */}
      <form className="chat-form" onSubmit={handleSend} autoComplete="off">
        <div className="input-bar-pill" tabIndex={-1}>
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
            required
            style={{paddingTop:"13px", paddingBottom:"13px"}}
          />
          <button
            className="btn-send"
            type="submit"
            disabled={pending || !input.trim()}
            aria-label="Send"
          >
            {/* Paper plane SVG icon */}
            {pending ? (
              <svg className="btn-send-icon" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="rgba(255,255,255,0.1)" /><path d="M7.1 12.98l6.22-2.05c.62-.2.64-1.09.03-1.31L7.13 7.61c-.53-.18-1 .43-.73.9l1.14 2.01-.98 1.47c-.34.5.04 1.18.54 1.03zm.1 0" fill="#fff"/><circle cx="15.6" cy="11" r="1" fill="#fff"/></svg>
            ) : (
              <svg className="btn-send-icon" width="21" height="21" viewBox="0 0 21 21" fill="none"><path d="M5.064 9.239c-1.217.372-1.23 2.07-.021 2.463l9.786 3.271c1.145.382 2.147-.846 1.622-1.889l-3.674-7.169c-.525-1.043-2.003-.885-2.139.255l-.589 5.024-4.985-1.614zm.031-.07" fill="#fff"/></svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;
