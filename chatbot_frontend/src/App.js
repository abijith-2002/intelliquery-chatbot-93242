import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/**
 * IntelliQuery Chatbot Frontend
 * 
 * A modern, minimalistic, dark-themed chatbot interface built with React.
 * Features real-time communication with FastAPI backend, displays both RAG 
 * and Gemini responses, and maintains conversation history with session persistence.
 * 
 * Design follows clean, card-based layout with responsive design for desktop and mobile.
 */

// Configuration
const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000/chat";

/**
 * Generate or retrieve persistent session ID from localStorage
 * @returns {string} Unique session identifier
 */
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
  // State Management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });
  
  const [input, setInput] = useState("");
  
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem("conversation");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to load conversation history:", error);
      return [];
    }
  });
  
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Effects
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Persist conversation to localStorage
    localStorage.setItem("conversation", JSON.stringify(messages));
  }, [messages]);

  // PUBLIC_INTERFACE
  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "dark" ? "light" : "dark");
  };

  // PUBLIC_INTERFACE
  /**
   * Handle message submission
   * @param {Event} e - Form submission event
   */
  async function handleSend(e) {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || pending) return;

    setPending(true);
    setError(null);

    // Add user message optimistically
    const userMessage = {
      role: "user",
      query: trimmedInput,
      timestamp: Date.now(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          session_id: generateSessionId(),
          query: trimmedInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage = {
        role: "assistant",
        rag_answer: data.rag_answer || "No RAG response available",
        gemini_answer: data.gemini_answer || "No Gemini response available",
        timestamp: Date.now(),
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
    } catch (err) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to get response. Please try again.");
      
      // Remove the optimistically added user message on error
      setMessages(prevMessages => prevMessages.slice(0, -1));
      setInput(trimmedInput); // Restore input
      
    } finally {
      setPending(false);
      
      // Focus back to input after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!pending && input.trim()) {
        handleSend(e);
      }
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Clear conversation history
   */
  function handleClear() {
    setMessages([]);
    localStorage.removeItem("conversation");
    setError(null);
    inputRef.current?.focus();
  }

  /**
   * Render individual chat message
   * @param {Object} message - Message object
   * @param {number} index - Message index
   * @returns {JSX.Element} Rendered message component
   */
  function renderMessage(message, index) {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";

    if (isUser) {
      return (
        <div key={index} className="chat-message chat-user">
          <div className="chat-avatar" aria-label="You">
            👤
          </div>
          <div className="chat-bubble">
            <div className="msg-ai">{message.query}</div>
            <div className="chat-meta">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      );
    }

    if (isAssistant) {
      return (
        <div key={index} className="chat-message chat-assistant">
          <div className="chat-avatar" aria-label="AI Assistant">
            🤖
          </div>
          <div className="chat-bubble chat-bubble-assistant">
            <div>
              <strong>Gemini Response:</strong>
              <div className="msg-ai">
                {message.gemini_answer}
              </div>
            </div>
            
            <hr className="chat-divider" />
            
            <div>
              <strong>Knowledge Base (RAG):</strong>
              <div className="msg-ai-secondary">
                {message.rag_answer}
              </div>
            </div>
            
            <div className="chat-meta">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  /**
   * Render loading indicator
   * @returns {JSX.Element} Loading component
   */
  function renderLoadingMessage() {
    return (
      <div className="chat-message chat-assistant">
        <div className="chat-avatar" aria-label="AI Assistant">
          🤖
        </div>
        <div className="chat-bubble chat-bubble-assistant">
          <div className="msg-ai">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            {" "}Thinking...
          </div>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="App">
      {/* Header Section */}
      <header className="chat-header">
        <div className="brand">
          <span role="img" aria-label="chat">💬</span>
          IntelliQuery Chatbot
        </div>
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          type="button"
        >
          <span role="img" aria-label={theme === "dark" ? "sun" : "moon"}>
            {theme === "dark" ? "☀️" : "🌙"}
          </span>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="chat-main">
        <section className="chat-area" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 && !pending ? (
            <div className="chat-empty">
              <div>
                <h2 style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>
                  Welcome to IntelliQuery! 👋
                </h2>
                <p>
                  Ask me anything about our knowledge base. I combine responses from 
                  our internal documents with Google Gemini AI to give you comprehensive answers.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => renderMessage(message, index))}
              {pending && renderLoadingMessage()}
            </>
          )}
          
          {error && (
            <div className="chat-error" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <div ref={chatEndRef} />
        </section>
      </main>

      {/* Input Section */}
      <form className="chat-form" onSubmit={handleSend} noValidate>
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={pending ? "Processing your message..." : "Ask me anything..."}
          rows={1}
          maxLength={2000}
          disabled={pending}
          aria-label="Type your message"
          required
        />
        <button
          className="btn-send"
          type="submit"
          disabled={pending || !input.trim()}
          aria-label={pending ? "Sending message" : "Send message"}
        >
          {pending ? (
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            "→"
          )}
        </button>
      </form>
    </div>
  );
}

export default App;
