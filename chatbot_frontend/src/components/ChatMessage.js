import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatMessage.css';

/**
 * Custom hook to animate streaming of text character-by-character.
 * For accessibility, it streams out content only for the "assistant" message role.
 * @param {string} text - The full text to animate.
 * @param {boolean} enabled - Whether streaming effect is enabled.
 * @param {number} speed - Milliseconds per character.
 * @returns {string} - The currently animated, visible portion.
 */
function useStreamingText(text, enabled, speed = 15) {
  const [displayText, setDisplayText] = useState(enabled ? '' : text);
  const timerRef = useRef();

  useEffect(() => {
    if (!enabled) {
      setDisplayText(text);
      return;
    }
    setDisplayText('');
    let current = 0;
    function showNext() {
      setDisplayText(text.slice(0, current + 1));
      current++;
      if (current < text.length) {
        timerRef.current = setTimeout(showNext, speed);
      }
    }
    showNext();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line
  }, [text, enabled, speed]);

  return displayText;
}

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

  // Only stream when this is an assistant message
  const shouldAnimate = isAssistant && typeof message.gemini_answer === "string";
  // For streaming, animate the gemini_answer only (the knowledge answer remains static if present)
  const streamingGeminiText = useStreamingText(
    (shouldAnimate ? message.gemini_answer : ""),
    shouldAnimate && message.gemini_answer != null
  );

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
              {typeof streamingGeminiText === "string" ? streamingGeminiText : ""}
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
