import React from "react";
import "./StartNewChatButton.css";

/**
 * StartNewChatButton - triggers creation of a new chat/session
 * 
 * @param {Object} props
 * @param {Function} props.onClick - handler to start a new chat
 */
// PUBLIC_INTERFACE
function StartNewChatButton({ onClick }) {
  return (
    <button
      className="new-chat-btn"
      onClick={onClick}
      type="button"
      aria-label="Start new chat"
    >
      <span className="new-chat-btn-icon" role="img" aria-label="New chat">
        ➕
      </span>{" "}
      New Chat
    </button>
  );
}

export default StartNewChatButton;
