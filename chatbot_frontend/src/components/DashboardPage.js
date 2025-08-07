import React, { useEffect } from "react";
import ChatList from "./ChatList";
import StartNewChatButton from "./StartNewChatButton";
import Header from "./Header";
import "./DashboardPage.css";

/**
 * DashboardPage - main dashboard after login
 * Allows user to start a new chat or resume previous chats.
 * 
 * @param {Object} props
 * @param {Object} props.user - Authenticated user object
 * @param {Function} props.onLogout - Handler to logout
 * @param {Function} props.onStartNewChat - Handler to create a new chat
 * @param {Function} props.onResumeChat - Handler to resume an existing chat (chatId)
 * @returns {JSX.Element} Dashboard component
 */
// PUBLIC_INTERFACE
function DashboardPage({ user, onLogout, chats, onStartNewChat, onResumeChat }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // Only show chats with at least one message
  const chatsWithMessages = Array.isArray(chats)
    ? chats.filter((session) => Array.isArray(session.messages) && session.messages.length > 0)
    : [];

  return (
    <div className="dashboard-page">
      <Header onLogout={onLogout} />
      <main className="dashboard-main">
        <section className="dashboard-header-section">
          <h2 className="dashboard-title">Welcome, {user?.username || "User"}!</h2>
          <StartNewChatButton onClick={onStartNewChat} />
        </section>
        <section className="dashboard-chats-section" aria-label="Previous Chats">
          <h3 className="chats-title">Previous Chats</h3>
          <ChatList chats={chatsWithMessages} onResumeChat={onResumeChat} />
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
