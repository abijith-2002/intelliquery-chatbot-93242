import React, { useEffect, useRef, useState, useCallback } from "react";
import Header from './components/Header';
import ChatMessage, { LoadingMessage } from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ErrorMessage from './components/ErrorMessage';
import AuthPage from './components/AuthPage';
import "./App.css";

/**
 * Knowledge Chat Frontend
 * 
 * A modern, minimalistic chat interface built with React.
 * Features real-time communication with FastAPI backend, displays both RAG 
 * and Gemini responses, and maintains conversation history with session persistence.
 * 
 * Design follows the exact specifications from the design notes.
 */

/**
 * Configuration - API base URL for chat endpoint.
 * For production, use the official deployed backend:
 *   https://vscode-internal-21843-beta.beta01.cloud.kavia.ai:3001
 * For development, override REACT_APP_API_BASE_URL in .env as needed.
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://vscode-internal-21843-beta.beta01.cloud.kavia.ai:3001";
const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;

/**
 * Generate or retrieve persistent session ID from localStorage
 * @returns {string} Unique session identifier
 */
function generateSessionId() {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = "session-" + Math.random().toString(36).substr(2, 12) + "-" + Date.now();
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

function App() {
  // Simple state for login/user storage (in real app use global context/JWT etc)
  const [user, setUser] = useState(() => {
    try {
      const session = localStorage.getItem("auth_user");
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  });

  // Authenticate callback from AuthPage
  const handleAuth = (userObj) => {
    setUser(userObj);
    try {
      localStorage.setItem("auth_user", JSON.stringify(userObj));
    } catch (e) {}
  };

  // -- The below block is the existing chat logic, rendered only if logged in:
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem("conversation_history");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to load conversation history:", error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryableMessage, setRetryableMessage] = useState(null);
  const chatEndRef = useRef(null);
  const sessionId = useRef(generateSessionId());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }, []);

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    try {
      localStorage.setItem("conversation_history", JSON.stringify(messages));
    } catch (error) {}
  }, [messages]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    const userMessage = {
      role: "user",
      query: trimmedInput,
      timestamp: Date.now(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setRetryableMessage(trimmedInput);
    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          session_id: sessionId.current,
          query: trimmedInput,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }
      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        rag_answer: data.rag_answer || "No knowledge base response available",
        gemini_answer: data.gemini_answer || "No Gemini response available",
        timestamp: Date.now(),
      };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setRetryableMessage(null);
    } catch (err) {
      setError(err.message || "Failed to get response. Please try again.");
      setMessages(prevMessages => prevMessages.slice(0, -1));
      setInput(trimmedInput);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleRetry = useCallback(() => {
    if (retryableMessage) {
      setInput(retryableMessage);
      setError(null);
      setRetryableMessage(null);
    }
  }, [retryableMessage]);

  const handleDismissError = useCallback(() => {
    setError(null);
    setRetryableMessage(null);
  }, []);

  // -- App routing: If no user, show AuthPage, else show chat.
  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // Main Chat UI if logged in
  return (
    <div className="App">
      <Header />
      <main className="chat-main">
        <section className="chat-area" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 && !isLoading ? (
            <div className="chat-welcome">
              <div className="welcome-content">
                <div className="welcome-icon">💬</div>
                <h2 className="welcome-title">Welcome to Knowledge Chat</h2>
                <p className="welcome-description">
                  Ask me anything and I'll provide answers using our knowledge base 
                  and AI-powered insights.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage 
                  key={`${message.timestamp}-${index}`}
                  message={message} 
                  index={index} 
                />
              ))}
              {isLoading && <LoadingMessage />}
            </>
          )}
          {error && (
            <ErrorMessage 
              message={error}
              onRetry={retryableMessage ? handleRetry : null}
              onDismiss={handleDismissError}
            />
          )}
          <div ref={chatEndRef} />
        </section>
      </main>

      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSendMessage}
        disabled={isLoading}
        placeholder={isLoading ? "Processing your message..." : "Type your message..."}
      />
    </div>
  );
}

export default App;
