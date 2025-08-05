import React from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatMessage.css';

// PUBLIC_INTERFACE
/**
 * Individual chat message component
 * Handles rendering of user and assistant messages with proper styling
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object
 * @param {number} props.index - Message index for key
 * @returns {JSX.Element} ChatMessage component
 */
function ChatMessage({ message, index }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  if (isUser) {
    return (
      <div className="chat-message chat-user" data-message-id={index}>
        <div className="chat-bubble user-bubble">
          <div className="message-content">
            {message.query}
          </div>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="chat-message chat-assistant-direct" data-message-id={index}>
        <div className="assistant-content-direct">
          <div className="response-content">
            <ReactMarkdown
              components={{
                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer"/>,
              }}
              linkTarget="_blank"
            >
              {typeof message.gemini_answer === "string" ? message.gemini_answer : ""}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// PUBLIC_INTERFACE
/**
 * Loading message component for when AI is thinking
 * @returns {JSX.Element} Loading message component
 */
export function LoadingMessage() {
  return (
    <div className="chat-message chat-assistant-direct loading-message">
      <div className="assistant-content-direct">
        <div className="loading-content">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="loading-text">Thinking...</span>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
