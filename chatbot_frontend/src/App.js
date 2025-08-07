import React, { useEffect, useRef, useState, useCallback } from "react";
import Header from './components/Header';
import ChatMessage, { LoadingMessage } from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ErrorMessage from './components/ErrorMessage';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
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
  // --- Demo path-based routing (no react-router): only supports /dashboard and /chat/:id (as string) ---

  // Auth state
  const [user, setUser] = useState(() => {
    try {
      const session = localStorage.getItem("auth_user");
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  });

  // Path state - track the "url" hash for demo routing
  const [appPath, setAppPath] = useState(() => {
    // Could use window.location.hash (e.g. "#/dashboard"), default to dashboard if logged in.
    const hasUser = !!localStorage.getItem("auth_user");
    if (window.location.hash.startsWith("#/chat/")) return window.location.hash.replace("#", "");
    if (window.location.hash === "#/dashboard") return "/dashboard";
    return hasUser ? "/dashboard" : "/";
  });

  // Demo navigation
  const navigate = (path) => {
    window.location.hash = "#" + path;
    setAppPath(path);
  };

  // Simple logout logic
  const handleLogout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("conversation_history");
      localStorage.removeItem("chat_session_id");
      localStorage.removeItem("chat_sessions");
    } catch (e) {
      console.warn("Failed to clear localStorage on logout:", e);
    }
    setMessages([]);
    setInput("");
    setError(null);
    setRetryableMessage(null);
    setIsLoading(false);
    sessionId.current = generateSessionId();
    navigate("/");
  }, []);

  // Authenticate callback from AuthPage
  const handleAuth = (userObj) => {
    setUser(userObj);
    try {
      localStorage.setItem("auth_user", JSON.stringify(userObj));
    } catch (e) {}
    navigate("/dashboard");
  };

  // --- Manage chat sessions (demo/mock for local/frontend only) ---
  // Each session: { id, title, lastActive, preview, messages }

  const [chatSessions, setChatSessions] = useState(() => {
    // Try to load chat sessions from localStorage
    try {
      const existing = localStorage.getItem("chat_sessions");
      if (existing) return JSON.parse(existing);
    } catch (e) {}
    // Demo: if no chats exist, create an empty array
    return [];
  });

  // Save chatSessions to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("chat_sessions", JSON.stringify(chatSessions));
    } catch (e) {}
  }, [chatSessions]);

  // Helper: create new chat session, returns id and sets state
  // We do not immediately insert a session into chatSessions until the first message is sent.
  const handleStartNewChat = useCallback(() => {
    const now = Date.now();
    const newId = "session-" + Math.random().toString(36).substr(2, 12) + "-" + now;
    setActiveSessionId(newId);
    setMessages([]);
    setInput("");
    setError(null);
    setRetryableMessage(null);
    setIsLoading(false);
    sessionId.current = newId;
    // Route to /chat/<session-id>
    navigate(`/chat/${newId}`);
  // eslint-disable-next-line
  }, [chatSessions]);

  // Helper: resume chat given id
  const handleResumeChat = useCallback((chatId) => {
    const sess = chatSessions.find((c) => c.id === chatId);
    if (sess) {
      setActiveSessionId(chatId);
      setMessages(sess.messages);
      setInput("");
      setError(null);
      setRetryableMessage(null);
      setIsLoading(false);
      sessionId.current = chatId;
      navigate(`/chat/${chatId}`);
    }
    // else ignore
  }, [chatSessions]);

  // For currently-active chat
  const [activeSessionId, setActiveSessionId] = useState(() => {
    // If hash is #/chat/<id>, extract id
    if (window.location.hash.startsWith("#/chat/")) {
      return window.location.hash.substring(7);
    }
    return "";
  });

  // Chat UI state
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryableMessage, setRetryableMessage] = useState(null);
  const chatEndRef = useRef(null);
  const sessionId = useRef(activeSessionId || generateSessionId());

  // Whenever we switch activeSessionId, update messages for that session
  useEffect(() => {
    if (!activeSessionId) return;
    const sess = chatSessions.find((c) => c.id === activeSessionId);
    setMessages(sess ? sess.messages : []);
    sessionId.current = activeSessionId;
    // Set hash/path
    navigate(`/chat/${activeSessionId}`);
    // eslint-disable-next-line
  }, [activeSessionId]);

  // Save messages to session in chatSessions
  useEffect(() => {
    if (!activeSessionId) return;

    setChatSessions((prev) => {
      // If this session already exists, update it as before
      const foundIndex = prev.findIndex((c) => c.id === activeSessionId);
      if (foundIndex !== -1) {
        // Remove session if it no longer has messages
        if (!messages || messages.length === 0) {
          return prev.filter((c) => c.id !== activeSessionId);
        }
        // Update session
        return prev.map((c) =>
          c.id === activeSessionId
            ? {
                ...c,
                messages,
                lastActive:
                  messages && messages.length
                    ? messages[messages.length - 1].timestamp
                    : c.lastActive,
                preview:
                  messages && messages.length
                    ? messages
                        .slice()
                        .reverse()
                        .find((msg) => msg.role === "user")?.query || ""
                    : "",
              }
            : c
        );
      } else {
        // If messages is non-empty, add this as a new session
        if (messages && messages.length > 0) {
          const firstUserMessage = messages.find((msg) => msg.role === "user");
          return [
            {
              id: activeSessionId,
              title: "New Chat " + (prev.length + 1),
              lastActive: messages[messages.length - 1]?.timestamp || Date.now(),
              preview: firstUserMessage ? firstUserMessage.query : "",
              messages,
            },
            ...prev,
          ];
        } else {
          // Don't create a session if no messages
          return prev;
        }
      }
    });
    // eslint-disable-next-line
  }, [messages, activeSessionId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }, []);

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  // A chat always belongs to the sessionId (active chat)
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput || isLoading) return;
      const userMessage = {
        role: "user",
        query: trimmedInput,
        timestamp: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);
      setRetryableMessage(trimmedInput);
      try {
        const response = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId.current,
            query: trimmedInput,
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}\n${errorText}`
          );
        }
        const data = await response.json();
        const assistantMessage = {
          role: "assistant",
          rag_answer: data.rag_answer || "No knowledge base response available",
          gemini_answer: data.gemini_answer || "No Gemini response available",
          timestamp: Date.now(),
        };
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
        setRetryableMessage(null);
      } catch (err) {
        setError(err.message || "Failed to get response. Please try again.");
        setMessages((prevMessages) => prevMessages.slice(0, -1));
        setInput(trimmedInput);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading]
  );

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

  // Listen for hash changes to switch pages (simulate basic navigation)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("/chat/")) {
        const chatId = hash.substring("/chat/".length);
        setAppPath("/chat/" + chatId);
        setActiveSessionId(chatId);
      } else if (hash === "/dashboard") {
        setAppPath("/dashboard");
      } else {
        setAppPath("/");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // -- Routing logic --
  // If not logged in, show login/register page
  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // Show dashboard if at "/dashboard"
  if (appPath === "/dashboard") {
    return (
      <DashboardPage
        user={user}
        onLogout={handleLogout}
        chats={chatSessions}
        onStartNewChat={handleStartNewChat}
        onResumeChat={handleResumeChat}
      />
    );
  }

  // Show chat if at "/chat/:id" and session exists, fallback to dashboard otherwise
  if (appPath.startsWith("/chat/") && activeSessionId) {
    const currSession = chatSessions.find((sess) => sess.id === activeSessionId);
    if (!currSession) {
      // If session id doesn't exist (bad url), redirect to dashboard
      navigate("/dashboard");
      return null;
    }
    return (
      <div className="App">
        <Header onLogout={handleLogout} />
        <main className="chat-main">
          <section
            className="chat-area"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.length === 0 && !isLoading ? (
              <div className="chat-welcome">
                <div className="welcome-content">
                  <div className="welcome-icon">💬</div>
                  <h2 className="welcome-title">
                    Welcome to Knowledge Chat
                  </h2>
                  <p className="welcome-description">
                    Ask me anything and I'll provide answers using our
                    knowledge base and AI-powered insights.
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
          placeholder={
            isLoading ? "Processing your message..." : "Type your message..."
          }
        />
        {/* Return/Back to Dashboard button */}
        <div style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 50,
        }}>
          <button
            className="clear-button"
            type="button"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              padding: "8px 14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)"
            }}
          >← Dashboard</button>
        </div>
      </div>
    );
  }

  // Fallback: redirect to dashboard
  navigate("/dashboard");
  return null;
}

export default App;
