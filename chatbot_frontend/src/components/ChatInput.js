import React, { useRef, useEffect, useCallback } from 'react';
import './ChatInput.css';

// PUBLIC_INTERFACE
/**
 * Chat input component - pill-shaped input box only
 * Simplified design with just the input element, no form wrapper or send button.
 * Auto-expands height for multiline content up to a maximum, then becomes scrollable.
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Input change handler
 * @param {Function} props.onSubmit - Submit handler (called on Enter key)
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.placeholder - Placeholder text
 * @returns {JSX.Element} ChatInput component
 */
function ChatInput({ value, onChange, onSubmit, disabled, placeholder = "Type your message..." }) {
  const textareaRef = useRef(null);

  // Max height for auto-growth before enabling vertical scroll
  const MAX_HEIGHT = 200; // px

  // Adjust textarea height based on content, up to MAX_HEIGHT
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset height to auto to measure correct scrollHeight
    el.style.height = 'auto';

    // Compute desired height (capped)
    const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${newHeight}px`;

    // Toggle vertical scroll beyond max height
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  // Focus textarea on component mount if not disabled
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Keep height in sync with value changes (including when cleared)
  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  // Also ensure height is correct on initial mount
  useEffect(() => {
    autoResize();
  }, [autoResize]);

  // PUBLIC_INTERFACE
  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit(e);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      className="chat-textarea"
      value={value}
      onChange={onChange}
      onInput={autoResize}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={1}
      maxLength={2000}
      disabled={disabled}
      aria-label="Type your message"
      aria-multiline="true"
    />
  );
}

export default ChatInput;
