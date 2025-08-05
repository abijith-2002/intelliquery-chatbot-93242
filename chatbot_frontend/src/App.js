import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/**
 * Modern chatbot frontend implementing the new design specifications.
 * - User messages: Right-aligned bubbles with blue background
 * - AI messages: Left-aligned, full-width text without bubbles
 * - Error messages: Left-aligned, full-width with error styling
 * 
 * Design follows specifications from:
 * - assets/chat_interface_design_notes.md
 * - assets/style_guide.md
 */

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "https://vscode-internal-11266-beta.beta01.cloud.kavia.ai:3001";
const API_URL = `${API_BASE_URL}/chat`;

function generateSessionId() {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = "session-" + Math.random().toString(36).substr(2, 10);
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

// --- COMPONENT DEFINITIONS (moved outside App to prevent recreation on re-renders) ---

/**
 * Header component with avatar and title
 */
const Header = React.memo(() => {
  return (
    <header className="chat-header">
      <div className="header-avatar" aria-label="Knowledge Bot Avatar">
        K
      </div>
      <h1 className="header-title">Knowledge Bot</h1>
    </header>
  );
});

/**
 * Empty state component shown when no messages exist
 */
const EmptyState = React.memo(() => {
  return (
    <div className="empty-state">
      <p>Welcome! Ask me anything to get started.</p>
    </div>
  );
});

/**
 * User message component - renders as right-aligned bubble
 */
const UserMessage = React.memo(({ message }) => {
  return (
    <div className="message-row user-message">
      <div className="user-bubble">
        <div>{message.query}</div>
        <span className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
});

/**
 * AI message component - renders as left-aligned full-width text without bubble
 */
const AIMessage = React.memo(({ message }) => {
  return (
    <div className="message-row ai-message">
      <div className="ai-content">
        <div className="ai-section">
          <span className="ai-label">Gemini Response:</span>
          <div className="ai-text">{message.gemini_answer}</div>
        </div>
        <div className="ai-section secondary">
          <span className="ai-label">RAG Response:</span>
          <div className="ai-text">{message.rag_answer}</div>
        </div>
        <span className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
});

/**
 * Error message component - renders as left-aligned full-width with error styling
 */
const ErrorMessage = React.memo(({ message }) => {
  return (
    <div className="message-row error-message">
      <div className="error-content">
        <span className="error-icon" role="img" aria-label="Error">⚠️</span>
        {message.error}
        <span className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
});

/**
 * Message list component that renders all messages
 */
const MessageList = React.memo(({ messages }) => {
  if (!messages.length) {
    return <EmptyState />;
  }

  return (
    <div className="message-list" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.map((message, index) => {
        // Use unique keys based on timestamp and content to prevent unnecessary re-renders
        const key = `${message.timestamp}-${message.role}-${index}`;
        switch (message.role) {
          case "user":
            return <UserMessage key={key} message={message} />;
          case "assistant":
            return <AIMessage key={key} message={message} />;
          case "error":
            return <ErrorMessage key={key} message={message} />;
          default:
            return null;
        }
      })}
    </div>
  );
});

// PUBLIC_INTERFACE
function App() {
  // --- State Management ---
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
  const inputRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("conversation", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (error) setError(null);
    // eslint-disable-next-line
  }, [input]);

  // --- Chat Handlers ---
  
  // PUBLIC_INTERFACE
  const handleSend = React.useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || pending) return;
    
    setPending(true);
    setError(null);

    const userMessage = {
      role: "user",
      query: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: generateSessionId(),
          query: userMessage.query,
        }),
      });

      if (!response.ok) {
        throw new Error("Network error. Please try again.");
      }

      const data = await response.json();
      
      const aiMessage = {
        role: "assistant",
        rag_answer: data.rag_answer,
        gemini_answer: data.gemini_answer,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        role: "error",
        error: err.message || "Failed to get response. Please try again.",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      setError(errorMessage.error);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }, [input, pending]);

  // PUBLIC_INTERFACE
  const handleInputKeyDown = React.useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey && !pending) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, pending]);

  // PUBLIC_INTERFACE
  const handleClear = React.useCallback(() => {
    setMessages([]);
    localStorage.removeItem("conversation");
    setError(null);
    inputRef.current?.focus();
  }, []);

  // Memoized ChatInput component to prevent recreation
  const ChatInput = React.useMemo(() => {
    return (
      <div className="chat-input-container">
        <form className="chat-form" onSubmit={handleSend}>
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={pending}
            placeholder={pending ? "Sending message..." : "Type your message..."}
            rows={1}
            maxLength={2000}
            aria-label="Message input"
            spellCheck
            style={{ resize: "none" }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-send"
            disabled={pending || !input.trim()}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-clear"
            onClick={handleClear}
            disabled={messages.length === 0}
            aria-label="Clear chat history"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </form>
      </div>
    );
  }, [input, pending, handleSend, handleInputKeyDown, handleClear, messages.length]);

  // --- MAIN RENDER ---
  return (
    <div className="App">
      <Header />
      <main className="chat-main">
        <div className="chat-container">
          <MessageList messages={messages} />
          <div ref={chatEndRef} />
        </div>
      </main>
      {ChatInput}
    </div>
  );
}

export default App;
