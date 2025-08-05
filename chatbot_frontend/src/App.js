import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/*
  Modern chatbot frontend matching provided design notes & screenshot.
  Visual hierarchy: <Header />, <ChatArea />, <MessageList />, <ChatInput />
  - Error messages are shown as "assistant" (bot) message bubbles.
  - All main colors, paddings, font sizes, and spacing match extracted palette and description.
  - Input bar is responsive, anchored at bottom, with capsule look and green send button.
*/

// Theme colors from assets/chat_ui_design_notes.md
const DESIGN_COLORS = {
  bgCanvas: "#2D3840",
  primaryText: "#FFFFFF",
  secondaryText: "#C8CED3",
  accentBlue: "#3C98F5",
  sendBtnBg: "#19C37D",
  sendBtnIcon: "#FFFFFF",
  inputBg: "#232C34",
  inputPlaceholder: "#7B8996",
};

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:8000";
const API_URL = `${API_BASE_URL}/chat`;

function generateSessionId() {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = "session-" + Math.random().toString(36).substr(2, 10);
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

// PUBLIC_INTERFACE
function App() {
  // --- State
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("conversation")) || [];
    } catch {
      return [];
    }
  });
  const [pending, setPending] = useState(false);
  // error message disappears when user tries again OR when input changes
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // --- Effects: Scroll & persist
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("conversation", JSON.stringify(messages));
  }, [messages]);

  // Re-render for input changes to clear error
  useEffect(() => {
    if (error) setError(null);
    // eslint-disable-next-line
  }, [input]);

  // --- Chat Send Handler
  // PUBLIC_INTERFACE
  async function handleSend(e) {
    if (e) e.preventDefault();
    if (!input.trim() || pending) return;
    setPending(true);

    // Add user message
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
          query: newUserMsg.query,
        }),
      });
      if (!resp.ok) throw new Error("Network/Backend error. Please try again.");
      const data = await resp.json();
      // Compose bot message
      const aiMsg = {
        role: "assistant",
        rag_answer: data.rag_answer,
        gemini_answer: data.gemini_answer,
        timestamp: Date.now(),
      };
      setMessages((msgs) => [...msgs, aiMsg]);
    } catch (err) {
      // Insert error message as a "bot" response bubble
      const errorBotMsg = {
        role: "error",
        error: err.message || "Failed to get response.",
        timestamp: Date.now(),
      };
      setMessages((msgs) =>
        // Remove pending user msg and insert the error
        msgs.slice(0, msgs.length - 1).concat(errorBotMsg)
      );
      setError(errorBotMsg.error);
    } finally {
      setPending(false);
    }
  }

  // Handle Enter to send (without shift)
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
    setError(null);
  }

  // --- HEADER ---
  function Header() {
    return (
      <div className="cq-header">
        <div className="cq-header-avatar">
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>K</span>
        </div>
        <div className="cq-header-title">Knowledge Bot</div>
      </div>
    );
  }

  // --- MESSAGE LIST ---
  /**
   * MessageList: Renders chat messages, top-to-bottom, with new layout and bubbles per spec.
   * - User: right-aligned, rounded-corner blue rectangle.
   * - Assistant: left-aligned, full-width plain text (not in bubble).
   * - Error: rendered as a left-aligned "bot" bubble (cq-bubble-error style).
   */
  function MessageList({ messages }) {
    if (!messages.length)
      return (
        <div className="cq-empty">
          <p>Welcome! Ask me anything…</p>
        </div>
      );
    return (
      <div className="cq-message-list">
        {messages.map((msg, idx) => {
          if (msg.role === "user") {
            return (
              <div className="cq-msg-row cq-msg-user" key={idx}>
                <div className="cq-avatar cq-avatar-user" aria-label="You">
                  <span role="img" aria-label="You">🧑</span>
                </div>
                <div className="cq-msg-bubble cq-bubble-user">
                  <span>{msg.query}</span>
                  <span className="cq-meta">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          } else if (msg.role === "assistant") {
            // AI messages as proper bubbles with avatar
            return (
              <div className="cq-msg-row cq-msg-ai-row" key={idx}>
                <div className="cq-avatar" aria-label="Bot">
                  <span role="img" aria-label="Bot">🤖</span>
                </div>
                <div className="cq-msg-ai-content">
                  <div className="cq-msg-ai-block">
                    <span className="cq-msg-ai-label">Gemini:</span>
                    <div className="cq-msg-ai-text">{msg.gemini_answer}</div>
                  </div>
                  <div className="cq-msg-ai-block cq-msg-secondary">
                    <span className="cq-msg-ai-label">RAG:</span>
                    <div className="cq-msg-ai-text">{msg.rag_answer}</div>
                  </div>
                  <span className="cq-meta">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          } else if (msg.role === "error") {
            // Error stays as a left-aligned "bot bubble" with avatar and special styling
            return (
              <div className="cq-msg-row cq-msg-bot" key={idx}>
                <div className="cq-avatar" aria-label="Bot">
                  <span role="img" aria-label="Warning">⚠️</span>
                </div>
                <div className="cq-msg-bubble cq-bubble-bot cq-bubble-error">
                  <div className="cq-msg-error-content">
                    <span className="cq-error-icon" role="img" aria-label="Error">❗</span>
                    <span>{msg.error}</span>
                  </div>
                  <span className="cq-meta">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          } else {
            return null;
          }
        })}
        <div ref={chatEndRef} />
      </div>
    );
  }

  // --- CHAT INPUT COMPONENT ---
  function ChatInput({ value, onChange, onKeyDown, onSend, disabled }) {
    return (
      <form className="cq-chat-form" onSubmit={onSend} autoComplete="off">
        <textarea
          className="cq-input"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Awaiting response..." : "Type your message..."}
          rows={1}
          maxLength={2000}
          aria-label="Message"
          spellCheck={true}
          style={{ resize: "none" }}
          required
        />
        <button
          className="cq-btn-send"
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send"
        >
          <svg viewBox="0 0 24 24" width="21" height="21" style={{ verticalAlign: "middle"}}>
            <circle cx="12" cy="12" r="12" fill="none"/>
            <path
              d="M3 20l18-8-18-8v7l12 1-12 1z"
              fill={DESIGN_COLORS.sendBtnIcon}
            />
          </svg>
        </button>
        <button
          className="cq-btn-clear"
          type="button"
          aria-label="Clear chat"
          onClick={handleClear}
          disabled={messages.length === 0}
        >
          🗑️
        </button>
      </form>
    );
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="App cq-app-root">
      <Header />
      <main className="cq-main">
        <section className="cq-chat-container" aria-live="polite">
          <MessageList messages={messages} />
        </section>
      </main>
      <ChatInput
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleInputKey}
        onSend={handleSend}
        disabled={pending}
      />
    </div>
  );
}

export default App;
