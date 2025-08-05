import React, { useRef, useEffect } from 'react';
import './ChatInput.css';

// PUBLIC_INTERFACE
/**
 * Chat input component with send functionality
 * Matches design specifications with rounded input and conditional send button
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Input change handler
 * @param {Function} props.onSubmit - Form submit handler
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

  // PUBLIC_INTERFACE
  /**
   * Handle form submission
   * @param {Event} e - Form event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSubmit(e);
    }
  };

  const hasContent = value.trim().length > 0;

  return (
    <form className="chat-input-form" onSubmit={handleSubmit} noValidate>
      <div className="input-container">
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
          required
        />
        
        <button
          className={`send-button ${hasContent ? 'show' : ''}`}
          type="submit"
          disabled={disabled || !hasContent}
          aria-label={disabled ? "Sending message" : "Send message"}
        >
          {disabled ? (
            <div className="button-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <span className="send-icon">→</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default ChatInput;
