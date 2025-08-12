import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
// Dark theme highlight.js style; adapts nicely to a dark UI
import 'highlight.js/styles/atom-one-dark.css';
import './ChatMessage.css';

// PUBLIC_INTERFACE
/**
 * Individual chat message component
 * Renders user and assistant messages with Markdown and syntax-highlighted code blocks.
 *
 * Supports:
 * - Inline code with backticks
 * - Fenced code blocks with language hints (```lang)
 * - Graceful fallback if language is not specified (auto-detect)
 *
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object
 * @param {number} props.index - Message index for key
 * @returns {JSX.Element|null} ChatMessage component
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
    const content = typeof message.gemini_answer === 'string' ? message.gemini_answer : '';

    return (
      <div className="chat-message chat-assistant-direct" data-message-id={index}>
        <div className="assistant-content-direct">
          {/* AI response with reduced font size */}
          <div className="response-content ai-response-font-size">
            <ReactMarkdown
              // NOTE: react-markdown@8 is compatible with remark-gfm@3 (pinned in package.json).
              // Using remark-gfm@4 with v8 can cause runtime errors like "Cannot read properties of undefined (reading 'inTable')".
              // GitHub-flavored Markdown for tables, strikethrough, task lists, etc.
              remarkPlugins={[remarkGfm]}
              // Highlight.js via rehype-highlight with missing-language tolerance
              rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
              // Do not render raw HTML for safety
              skipHtml={true}
              // Make links open in a new tab securely
              components={{
                a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                // Customize code rendering to ensure consistent structure and scoping
                code({ inline, className, children, ...props }) {
                  if (inline) {
                    return (
                      <code className={`inline-code ${className || ''}`} {...props}>
                        {children}
                      </code>
                    );
                  }
                  // For fenced code blocks, wrap with <pre> for styling and scrolling
                  return (
                    <pre className="code-block">
                      <code className={className || ''} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
              }}
              linkTarget="_blank"
            >
              {content}
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
 * Loading message component for when AI is processing
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
