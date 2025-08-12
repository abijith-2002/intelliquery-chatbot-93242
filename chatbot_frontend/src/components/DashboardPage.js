import React, { useEffect } from "react";
import StartNewChatButton from "./StartNewChatButton";
import Header from "./Header";
import "./DashboardPage.css";

/**
 * DashboardPage - simplified post-login landing (optional route)
 * Displays a welcome and encourages starting a new chat.
 * Previous chats are not shown here and should be accessed via the sidebar within chat view.
 * 
 * @param {Object} props
 * @param {Object} props.user - Authenticated user object
 * @param {Function} props.onLogout - Handler to logout
 * @param {Function} props.onStartNewChat - Handler to create a new chat
 * @returns {JSX.Element} Dashboard component
 */
// PUBLIC_INTERFACE
function DashboardPage({ user, onLogout, onStartNewChat }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <div className="dashboard-page">
      <Header onLogout={onLogout} />
      <main className="dashboard-main">
        <section className="dashboard-header-section">
          <h2 className="dashboard-title">Welcome, {user?.username || "User"}!</h2>
          <StartNewChatButton onClick={onStartNewChat} />
        </section>

        {/* Removed central Previous Chats list to ensure history only appears in the sidebar */}
        <section className="dashboard-chats-section" aria-label="Get Started">
          <h3 className="chats-title">Get Started</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Start a new conversation using the button above. Your previous chats are available from the sidebar in the chat view.
          </p>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
