import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
// Dark theme highlight.js style; adapts nicely to a dark UI
import 'highlight.js/styles/atom-one-dark.css';
import './ChatMessage.css';

/**
 * Normalize Markdown to ensure a newline after any horizontal rule line '---'.
 * Skips lines inside fenced code blocks (``` or ~~~).
 * This helps maintain consistent spacing when the AI outputs a horizontal rule.
 *
 * @param {string} md - Markdown content
 * @returns {string} Normalized markdown with newline after '---' lines.
 */
function ensureNewlineAfterHorizontalRule(md = '') {
  if (typeof md !== 'string' || md.length === 0) return md;

  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let inCode = false;

  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Toggle code block state on encountering a fence (``` or ~~~)
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      inCode = !inCode;
      out.push(line);
      continue;
    }

    // Only process '---' outside of code blocks
    if (!inCode && line.trim() === '---') {
      out.push('---');
      const next = lines[i + 1];
      // Ensure a blank line follows if there isn't one already or if end of file
      if (i + 1 >= lines.length || (next && next.trim() !== '')) {
        out.push('');
      }
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

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
    const rawContent = typeof message.gemini_answer === 'string' ? message.gemini_answer : '';
    // Ensure newline after any horizontal rule lines for consistent spacing in AI responses
    const content = ensureNewlineAfterHorizontalRule(rawContent);

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
          {/* Animated cat loader */}
          <div className="cat-loader" role="img" aria-label="Loading cat animation">
            <svg
              className="cat-svg"
              viewBox="0 0 120 60"
              width="120"
              height="60"
              aria-hidden="true"
              focusable="false"
            >
              {/* Group animation slight bob up and down */}
              <g className="cat-bob">
                {/* Head */}
                <g className="cat-head" transform="translate(42,16)">
                  <circle cx="18" cy="18" r="12" className="cat-stroke" fill="none" />
                  {/* Ears */}
                  <path d="M9 10 L13 2 L17 10" className="cat-stroke" fill="none" />
                  <path d="M27 10 L31 2 L35 10" className="cat-stroke" fill="none" />
                  {/* Eyes */}
                  <ellipse cx="14" cy="19" rx="1.8" ry="2.2" className="cat-eye" />
                  <ellipse cx="22" cy="19" rx="1.8" ry="2.2" className="cat-eye" />
                  {/* Nose */}
                  <circle cx="18" cy="22" r="1" className="cat-accent" />
                  {/* Whiskers */}
                  <path d="M6 22 H14" className="cat-stroke" />
                  <path d="M22 22 H30" className="cat-stroke" />
                </g>

                {/* Body line (desk edge) */}
                <path d="M12 44 H108" className="cat-stroke subtle" />

                {/* Paws (typing) */}
                <g className="cat-paws">
                  <circle cx="50" cy="44" r="3.2" className="cat-paw cat-paw-left" />
                  <circle cx="66" cy="44" r="3.2" className="cat-paw cat-paw-right" />
                </g>

                {/* Tail (wag) */}
                <path
                  className="cat-tail"
                  d="M86 40 C 95 34, 103 46, 112 40"
                  fill="none"
                />
              </g>
            </svg>
          </div>

          {/* Keep existing dots to complement the cat and preserve minimal footprint */}
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* Preserve text for accessibility and tests */}
          <span className="loading-text">Thinking...</span>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
