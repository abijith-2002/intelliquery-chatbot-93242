import React from 'react';
import './ErrorMessage.css';

// PUBLIC_INTERFACE
/**
 * Error message component for displaying chat errors
 * Features retry functionality and proper error styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Optional retry handler
 * @param {Function} props.onDismiss - Optional dismiss handler
 * @returns {JSX.Element} ErrorMessage component
 */
function ErrorMessage({ message, onRetry, onDismiss }) {
  return (
    <div className="error-message" role="alert">
      <div className="error-content">
        <div className="error-icon" role="img" aria-label="Error">
          ⚠️
        </div>
        <div className="error-text">
          <strong>Something went wrong</strong>
          <p>{message}</p>
        </div>
      </div>
      
      <div className="error-actions">
        {onRetry && (
          <button 
            className="error-button retry-button"
            onClick={onRetry}
            type="button"
          >
            Try Again
          </button>
        )}
        
        {onDismiss && (
          <button 
            className="error-button dismiss-button"
            onClick={onDismiss}
            type="button"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
