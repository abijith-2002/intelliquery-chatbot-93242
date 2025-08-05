import React, { useRef, useEffect } from 'react';
import './ChatInput.css';

// PUBLIC_INTERFACE
/**
 * Chat input component - pill-shaped input box only
 * Simplified design with just the input element, no form wrapper or send button
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

  // Focus textarea on component mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

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
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={1}
      maxLength={2000}
      disabled={disabled}
      aria-label="Type your message"
    />
  );
}

export default ChatInput;
