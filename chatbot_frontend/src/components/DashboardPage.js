import React, { useEffect, useState } from "react";
import ChatList from "./ChatList";
import StartNewChatButton from "./StartNewChatButton";
import Header from "./Header";
import ChatInput from "./ChatInput";
import ChatMessage, { LoadingMessage } from "./ChatMessage";
import ErrorMessage from "./ErrorMessage";
import "./DashboardPage.css";

/**
 * DashboardPage - new dashboard layout with left sidebar for chats
 * and right area showing a new chat (ready for input). Sending the first
 * message adds a new chat to the sidebar.
 */
function DashboardPage({ user, onLogout, chats, onStartNewChat, onResumeChat }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // Mock chat history if no chats in props
  const [chatSessions, setChatSessions] = useState(() => {
    if (Array.isArray(chats) && chats.length > 0) return chats;
    // Use mock data for first load
    return [
      {
        id: "session-mock1",
        title: "How to use the chatbot?",
        lastActive: Date.now() - 60 * 60 * 1000,
        preview: "How do I talk with Knowledge Chat?",
        messages: [{ role: "user", query: "How do I talk with Knowledge Chat?" }],
      },
      {
        id: "session-mock2",
        title: "Gemini integration details",
        lastActive: Date.now() - 2 * 60 * 60 * 1000,
        preview: "Tell me about Gemini API.",
        messages: [{ role: "user", query: "Tell me about Gemini API." }],
      },
    ];
  });

  // State for new chat session on the right (not in history until message sent)
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to decide the title based on first message
  const getChatTitleFromFirstMessage = (msg) => {
    // Simple heuristic: use first 8 words, max 40 chars
    let trimmed = msg.trim();
    if (!trimmed) return "New Chat";
    return trimmed.split(" ").slice(0, 8).join(" ").slice(0, 40) + (trimmed.length > 40 ? "…" : "");
  };

  // Send handler for new chat
  const handleSendNewChat = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMsg = { role: "user", query: trimmed, timestamp: Date.now() };
    setIsLoading(true);
    setError(null);
    setMessages([userMsg]); // local show
    // Add to chatSessions as "new" chat
    const sessionId = "session-" + Math.random().toString(36).substr(2, 8) + "-" + Date.now();
    const newChat = {
      id: sessionId,
      title: getChatTitleFromFirstMessage(trimmed),
      lastActive: Date.now(),
      preview: trimmed,
      messages: [userMsg],
    };
    setChatSessions((prev) => [newChat, ...prev]);
    setInput("");
    setTimeout(() => {
      setIsLoading(false);
      setMessages([]);
    }, 900); // simulate brief loading
  };

  // Dismiss error
  const handleDismissError = () => setError(null);

  // Responsive layout: main split view
  return (
    <div className="dashboard-page" style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg-primary)",
    }}>
      <Header onLogout={onLogout} />
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: "calc(100vh - 60px)",
        }}
      >
        {/* Sidebar - previous chats */}
        <aside
          style={{
            width: 280,
            background: "var(--bg-secondary)",
            padding: "32px 0 24px 0",
            borderRight: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: "32px",
            minHeight: "100%",
            zIndex: 2,
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            alignItems: "center",
          }}>
            <StartNewChatButton onClick={onStartNewChat} />
          </div>
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 18px",
            marginTop: 20,
          }}>
            <h3 className="chats-title" style={{
              color: "var(--text-secondary)",
              fontSize: 16,
              fontWeight: 500,
              margin: "0 0 18px 0",
            }}>Previous Chats</h3>
            <ChatList
              chats={chatSessions.filter((s) => Array.isArray(s.messages) && s.messages.length > 0)}
              onResumeChat={onResumeChat}
            />
          </div>
        </aside>
        {/* Main chat area (new chat on the right) */}
        <main
          className="dash-chat-main"
          style={{
            flex: 1,
            minWidth: 0,
            background: "var(--bg-primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: messages.length === 0 ? "center" : "flex-start",
            padding: "0 0 36px 0",
            position: "relative",
          }}
        >
          <div style={{
            width: "100%",
            maxWidth: 620,
            margin: "56px auto 0 auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}>
            {messages.length === 0 && !isLoading ? (
              <div className="chat-welcome" style={{ flex: 1, textAlign: "center" }}>
                <div className="welcome-content">
                  <div className="welcome-icon">💬</div>
                  <h2 className="welcome-title">
                    Start a new chat session
                  </h2>
                  <p className="welcome-description">
                    Type your question below to begin a new chat.<br />
                    Your previous chats are always available in the sidebar.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage key={msg.timestamp || idx} message={msg} index={idx} />
                ))}
                {isLoading && <LoadingMessage />}
              </>
            )}
            {error && (
              <ErrorMessage message={error} onDismiss={handleDismissError} />
            )}
          </div>
          <ChatInput
            value={input}
            onChange={e => setInput(e.target.value)}
            onSubmit={handleSendNewChat}
            disabled={isLoading}
            placeholder={isLoading ? "Sending..." : "Ask your question here..."}
          />
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
