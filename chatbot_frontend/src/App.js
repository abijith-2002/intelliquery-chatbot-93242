import React, { useEffect, useRef, useState, useCallback } from "react";
import Header from './components/Header';
import ChatMessage, { LoadingMessage } from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ErrorMessage from './components/ErrorMessage';
import Sidebar from './components/Sidebar';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import "./App.css";
import ModalDialog from './components/ModalDialog';

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

  // ========== AUTH STATE ================
  const [user, setUser] = useState(() => {
    try {
      const session = localStorage.getItem("auth_user");
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  });

  // ---- APP ROUTING ---------------------
  const [appPath, setAppPath] = useState(() => {
    if (window.location.hash.startsWith("#/chat/"))
      return window.location.hash.replace("#", "");
    if (window.location.hash === "#/dashboard") return "/dashboard";
    return "/";
  });

  const navigate = (path) => {
    window.location.hash = "#" + path;
    setAppPath(path);
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ============= CHAT SESSION STATE =============
  // Each session: { id, title, lastActive, preview, messages }
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const existing = localStorage.getItem("chat_sessions");
      if (existing) return JSON.parse(existing);
    } catch (e) {}
    return [];
  });

  // For currently-active chat
  const [activeSessionId, setActiveSessionId] = useState(() => {
    if (window.location.hash.startsWith("#/chat/")) {
      return window.location.hash.substring(7);
    }
    return "";
  });

  // Load previous chat history from backend on user login (optional: if backend offers endpoint)
  // This is a placeholder; backend needs to provide a /chats or /history endpoint if supported.
  useEffect(() => {
    // Pull previous chats from API (if backend supports), otherwise load from localStorage.
    if (!user) return;
    let ignore = false;
    async function fetchBackendChats() {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
        // Example: GET /chats if API supports it (skipped for now: design uses localStorage)
        // const res = await fetch(`${API_BASE_URL}/chats`, { credentials: "include" });
        // if (res.ok) {
        //   const data = await res.json();
        //   if (!ignore && Array.isArray(data)) setChatSessions(data);
        // }
      } catch (err) {
        // fallback to localStorage
      }
    }
    fetchBackendChats();
    return () => { ignore = true; };
  }, [user]);

  // Save chatSessions to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("chat_sessions", JSON.stringify(chatSessions));
    } catch (e) {}
  }, [chatSessions]);

  // --- CHAT UI STATE -----------
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryableMessage, setRetryableMessage] = useState(null);
  const chatEndRef = useRef(null);

  const sessionId = useRef(activeSessionId || generateSessionId());

  // --- Modal/Dialog state for delete/rename ---
  const [modalState, setModalState] = useState({
    open: false,
    type: null,        // 'delete' | 'rename' | null
    chatId: null,
    defaultValue: '',  // used for rename default title
  });

  const closeDialog = useCallback(() => {
    setModalState((prev) => ({ ...prev, open: false }));
  }, []);

  const openDeleteDialog = useCallback((chatId) => {
    setModalState({ open: true, type: 'delete', chatId, defaultValue: '' });
  }, []);

  const openRenameDialog = useCallback((chatId, defaultValue = '') => {
    setModalState({ open: true, type: 'rename', chatId, defaultValue });
  }, []);

  // Start new chat (button on sidebar or header) - moved above all references to avoid TDZ
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
    navigate(`/chat/${newId}`);
  }, []);

  // Confirm handler for modal dialog (delete/rename)
  const handleDialogConfirm = useCallback((value) => {
    if (!modalState.open) return;

    if (modalState.type === 'delete' && modalState.chatId) {
      const chatId = modalState.chatId;

      // Compute next sessions list based on current state
      const nextSessions = chatSessions.filter((c) => c.id !== chatId);
      setChatSessions(nextSessions);

      if (activeSessionId === chatId) {
        // If there are remaining sessions, pick the most recent one
        const remainingSorted = nextSessions
          .filter((c) => Array.isArray(c.messages) && c.messages.length > 0)
          .slice()
          .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));

        if (remainingSorted.length > 0) {
          const next = remainingSorted[0];
          setActiveSessionId(next.id);
          setMessages(next.messages || []);
          setInput("");
          setError(null);
          setRetryableMessage(null);
          setIsLoading(false);
          sessionId.current = next.id;
          navigate(`/chat/${next.id}`);
        } else {
          // No remaining chats: reset and start a new chat
          setMessages([]);
          setInput("");
          setError(null);
          setRetryableMessage(null);
          setIsLoading(false);
          setActiveSessionId("");
          sessionId.current = "";
          handleStartNewChat();
        }
      }
    } else if (modalState.type === 'rename' && modalState.chatId) {
      const nextTitle = (value || '').trim();
      if (nextTitle) {
        setChatSessions((prev) =>
          prev.map((c) => (c.id === modalState.chatId ? { ...c, title: nextTitle } : c))
        );
      }
    }

    setModalState({ open: false, type: null, chatId: null, defaultValue: '' });
  }, [modalState, chatSessions, activeSessionId, navigate, handleStartNewChat]);

  const handleDialogCancel = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  // =========== LOGOUT ===========
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
    setChatSessions([]);
    setActiveSessionId("");
    navigate("/");
  }, []);

  // =========== LOGIN FLOW =========
  // Auth callback and auto-open new chat on successful login
  const handleAuth = useCallback((userObj) => {
    setUser(userObj);
    try {
      localStorage.setItem("auth_user", JSON.stringify(userObj));
    } catch (e) {}
    // After login: start a new chat automatically
    const newChatId = "session-" + Math.random().toString(36).substr(2, 12) + "-" + Date.now();
    setActiveSessionId(newChatId);
    setMessages([]);
    setInput("");
    setError(null);
    setRetryableMessage(null);
    setIsLoading(false);
    sessionId.current = newChatId;
    navigate(`/chat/${newChatId}`);
  }, []);

  // ============ CHAT SESSION STATE MGMT ===============
  // Switch chat: from sidebar
  const handleSelectChatFromSidebar = useCallback((chatId) => {
    if (activeSessionId === chatId) return;
    const sess = chatSessions.find((c) => c.id === chatId);
    if (sess) {
      setActiveSessionId(chatId);
      setMessages(sess.messages || []);
      setInput("");
      setError(null);
      setRetryableMessage(null);
      setIsLoading(false);
      sessionId.current = chatId;
      navigate(`/chat/${chatId}`);
    }
  }, [chatSessions, activeSessionId]);

  // Auto-start a new chat when user logs in or returns while logged in and not already on a chat route
  useEffect(() => {
    if (!user) return;
    const hash = window.location.hash || "";
    if (!hash.startsWith("#/chat/")) {
      handleStartNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- Backwards compat for dashboard "Resume chat" (legacy) ---
  const handleResumeChat = useCallback((chatId) => {
    handleSelectChatFromSidebar(chatId);
  }, [handleSelectChatFromSidebar]);

  // PUBLIC_INTERFACE
  /**
   * Delete a chat session by id with confirmation.
   * - Removes from chatSessions
   * - If deleting the active chat, navigates to the most recent remaining chat or starts a new chat
   */
  const handleDeleteChat = useCallback((chatId) => {
    if (!chatId) return;
    openDeleteDialog(chatId);
  }, [openDeleteDialog]);

  // PUBLIC_INTERFACE
  /**
   * Rename a chat session by id using a prompt
   * - Updates only the title field; keeps messages and metadata
   */
  const handleRenameChat = useCallback((chatId) => {
    if (!chatId) return;
    const sess = chatSessions.find((c) => c.id === chatId);
    const currentTitle = sess?.title || "Untitled";
    openRenameDialog(chatId, currentTitle);
  }, [chatSessions, openRenameDialog]);

  // Whenever we switch activeSessionId, update messages for that session
  useEffect(() => {
    if (!activeSessionId) return;
    const sess = chatSessions.find((c) => c.id === activeSessionId);
    setMessages(sess ? sess.messages : []);
    sessionId.current = activeSessionId;
    navigate(`/chat/${activeSessionId}`);
  // intentionally not depending on chatSessions to avoid loop
  // eslint-disable-next-line
  }, [activeSessionId]);

  // Save messages to chatSessions, and create/update session info.
  useEffect(() => {
    if (!activeSessionId) return;
    setChatSessions((prev) => {
      const foundIndex = prev.findIndex((c) => c.id === activeSessionId);
      // Session title logic: first message sets title, if not present
      function getChatTitle(msgs) {
        // Use first user message's content, trimmed & short
        const firstUser = msgs.find((m) => m.role === "user");
        if (!firstUser || !firstUser.query) return "Untitled";
        let msg = firstUser.query.trim();
        if (msg.length > 50) msg = msg.substring(0, 50) + "…";
        // Remove trailing punctuation and make into "Question?/something" → summary
        if (msg.endsWith("?")) msg = msg.substring(0, msg.length - 1);
        return msg.charAt(0).toUpperCase() + msg.slice(1);
      }
      if (foundIndex !== -1) {
        // Remove session if it no longer has messages
        if (!messages || messages.length === 0) {
          return prev.filter((c) => c.id !== activeSessionId);
        }
        const title = prev[foundIndex].title && prev[foundIndex].title !== "Untitled"
          ? prev[foundIndex].title
          : getChatTitle(messages);
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
                title
              }
            : c
        );
      } else {
        // Add as a new session if messages were sent
        if (messages && messages.length > 0) {
          return [
            {
              id: activeSessionId,
              title: getChatTitle(messages),
              lastActive: messages[messages.length - 1]?.timestamp || Date.now(),
              preview: messages
                .slice()
                .reverse()
                .find((msg) => msg.role === "user")?.query || "",
              messages,
            },
            ...prev,
          ];
        } else {
          // Don't create session if no messages yet
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
  const CHAT_TITLE_ENDPOINT = `${API_BASE_URL}/chat/title`;

  /**
   * Returns true if the current messages array is empty—i.e., this is the first user message in a new chat.
   */
  function isFirstMessageOfNewChat() {
    return Array.isArray(messages) && messages.length === 0;
  }

  // PUBLIC_INTERFACE
  /**
   * Handles sending a message (user hit Enter or clicked send)
   * If this is the first message in a new chat, also send to title endpoint.
   */
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
      let firstMsg = false;
      if (isFirstMessageOfNewChat()) firstMsg = true;
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);
      setRetryableMessage(trimmedInput);

      // If this is the first message of a new chat, fetch the title then proceed
      let generatedTitle = null;

      try {
        if (firstMsg) {
          // Call /chat/title with { prompt }
          const titleRes = await fetch(CHAT_TITLE_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ prompt: trimmedInput }),
          });
          // On error, fallback to default
          if (titleRes.ok) {
            // The endpoint returns a JSON body that's just a string
            // e.g. "Project Launch Timeline"
            // Try to parse as string:
            const contentType = titleRes.headers.get("Content-Type") || "";
            if (contentType.includes("application/json")) {
              const titleString = await titleRes.json();
              // Sometimes may return e.g. { detail: ... }
              if (typeof titleString === "string" && titleString.length > 0) {
                generatedTitle = titleString;
              }
            } else {
              const text = await titleRes.text();
              if (text.trim().length > 0) generatedTitle = text.trim();
            }
            if (!generatedTitle || generatedTitle.length === 0) {
              generatedTitle = trimmedInput.length > 50 ? trimmedInput.substring(0, 50) + "…" : trimmedInput;
            }
          } else {
            generatedTitle = trimmedInput.length > 50 ? trimmedInput.substring(0, 50) + "…" : trimmedInput;
          }
        }

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

        // If a title was generated, update chatSessions (and sync to localStorage)
        if (firstMsg && generatedTitle) {
          setChatSessions((prev) => {
            const idx = prev.findIndex(s => s.id === activeSessionId);
            if (idx !== -1) {
              // Update the session's title but preserve other content
              return prev.map((s, i) =>
                i === idx ? { ...s, title: generatedTitle } : s
              );
            } else {
              // If not in sessions, push a new one (should only rarely happen)
              return [
                {
                  id: activeSessionId,
                  title: generatedTitle,
                  lastActive: Date.now(),
                  preview: trimmedInput,
                  messages: [userMessage, assistantMessage],
                },
                ...prev,
              ];
            }
          });
        }

      } catch (err) {
        setError(err.message || "Failed to get response. Please try again.");
        setMessages((prevMessages) => prevMessages.slice(0, -1));
        setInput(trimmedInput);
      } finally {
        setIsLoading(false);
      }
    },
    // Note: added chatSessions (must be stable due to setChatSessions use)
    [input, isLoading, messages, activeSessionId, chatSessions]
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

  // ======= ROUTING LOGIC =========
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

  // Show chat if at "/chat/:id" (session might not yet exist)
  if (appPath.startsWith("/chat/") && activeSessionId) {
    return (
      <div className="App" style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
        <Sidebar
          chats={chatSessions}
          activeSessionId={activeSessionId}
          onSelectChat={handleSelectChatFromSidebar}
          onNewChat={handleStartNewChat}
          isOpen={sidebarOpen}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100vh"}}>
          <Header
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            isSidebarOpen={sidebarOpen}
          />
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

          <ModalDialog
            open={modalState.open}
            title={modalState.type === 'delete' ? 'Delete chat?' : 'Rename chat'}
            description={
              modalState.type === 'delete'
                ? 'This will permanently delete this chat. This cannot be undone.'
                : 'Enter a new name for this chat.'
            }
            variant={modalState.type === 'rename' ? 'prompt' : 'confirm'}
            defaultValue={modalState.type === 'rename' ? modalState.defaultValue : ''}
            confirmText={modalState.type === 'delete' ? 'Delete' : 'Save'}
            cancelText="Cancel"
            onConfirm={handleDialogConfirm}
            onClose={handleDialogCancel}
          />
        </div>
      </div>
    );
  }

  // Fallback: ensure we are on a chat session
  if (activeSessionId) {
    navigate(`/chat/${activeSessionId}`);
  } else {
    handleStartNewChat();
  }
  return null;
}

export default App;
