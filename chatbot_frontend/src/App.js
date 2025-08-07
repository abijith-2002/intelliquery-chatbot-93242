import React, { useEffect, useRef, useState, useCallback } from "react";
import Header from './components/Header';
import ChatMessage, { LoadingMessage } from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ErrorMessage from './components/ErrorMessage';
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
  // State Management (no theme switching)
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
  
  // Refs
  const chatEndRef = useRef(null);
  const sessionId = useRef(generateSessionId());

  // Effects
  useEffect(() => {
    // Set the default theme (dark, or as set by .env/app config)
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Persist conversation to localStorage
    try {
      localStorage.setItem("conversation_history", JSON.stringify(messages));
    } catch (error) {
      console.warn("Failed to save conversation history:", error);
    }
  }, [messages]);

  // PUBLIC_INTERFACE
  /**
   * Handle input change
   * @param {Event} e - Input change event
   */
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  // PUBLIC_INTERFACE
  /**
   * Handle message submission
   * @param {Event} e - Form submission event
   */
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Optimistically clear input and set loading state, but do NOT add the user message here.
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

      // Use backend's returned conversation_history as the source of truth for messages.
      // Format to fit frontend's expected display format for each message.
      const formattedMessages = data.conversation_history.map((m) => {
        if (m.type === "human") {
          return {
            role: "user",
            query: m.content,
            timestamp: Date.now(),
          };
        } else if (m.type === "ai") {
          return {
            role: "assistant",
            rag_answer: data.rag_answer || "",
            gemini_answer: data.gemini_answer || "",
            timestamp: Date.now(),
          };
        }
        // fallback for unknown types
        return {
          role: "assistant",
          rag_answer: data.rag_answer || "",
          gemini_answer: data.gemini_answer || "",
          timestamp: Date.now(),
        };
      });

      // To ensure no duplicates, display full message history but keep only appropriately formatted new messages.
      setMessages(formattedMessages);
      setRetryableMessage(null);

    } catch (err) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to get response. Please try again.");
      // No need to revert message state since we did not modify messages locally on send
      setInput(trimmedInput); // Restore input if failed
      
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // PUBLIC_INTERFACE
  /**
   * Retry last failed message
   */
  const handleRetry = useCallback(() => {
    if (retryableMessage) {
      setInput(retryableMessage);
      setError(null);
      setRetryableMessage(null);
    }
  }, [retryableMessage]);

  // PUBLIC_INTERFACE
  /**
   * Dismiss error message
   */
  const handleDismissError = useCallback(() => {
    setError(null);
    setRetryableMessage(null);
  }, []);

  // Main Render
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
