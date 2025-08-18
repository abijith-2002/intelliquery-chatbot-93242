import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import './ChatInput.css';
import MinimalAttachmentIcon from './icons/MinimalAttachmentIcon';

/* Allowed file types and constraints
 * Now supports: .pdf, .txt, .docx, .xlsx, .json
 */
const ALLOWED_EXTENSIONS = new Set(['pdf', 'txt', 'docx', 'xlsx', 'json']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ATTACHMENTS = 5;

// Utility: format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

// Utility: simple id for an attachment (avoids collisions while being deterministic for duplicates)
function makeAttachmentId(file) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

// PUBLIC_INTERFACE
/**
 * Chat input component - input with attachment support.
 * Renders:
 * - Attachments bar with removable chips
 * - Hidden <input type="file" /> and "Attach" button (paperclip)
 * - Auto-resizing textarea (Enter to send, Shift+Enter for newline)
 * - Explicit Send button
 *
 * Props:
 * @param {Object} props - Component props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Input change handler
 * @param {Function} props.onSubmit - Submit handler (called on Enter key or Send button)
 * @param {boolean} props.disabled - Whether input is disabled (e.g., during request)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {Array<{id: string, name: string, size: number, ext: string, status?: string, error?: string}>} [props.attachments] - Selected attachments
 * @param {Function} [props.onFilesSelected] - Handler(files: FileList|Array<File>) after validation; invalid files trigger onValidationError
 * @param {Function} [props.onRemoveAttachment] - Handler(id: string) to remove a specific attachment
 * @param {Function} [props.onValidationError] - Handler(message: string) for validation errors
 * @param {boolean} [props.hasContext] - Whether the current session already has uploaded context (enables sending even if chips cleared)
 * @returns {JSX.Element} ChatInput component
 */
function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Type your message...',
  attachments = [],
  onFilesSelected,
  onRemoveAttachment,
  onValidationError,
  hasContext = false,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Max height for auto-growth before enabling vertical scroll
  const MAX_HEIGHT = 200; // px

  // Adjust textarea height based on content, up to MAX_HEIGHT
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  // Focus textarea on component mount if not disabled and a file is attached or context exists
  useEffect(() => {
    if (
      textareaRef.current &&
      !disabled &&
      ((Array.isArray(attachments) && attachments.length > 0) || !!hasContext)
    ) {
      textareaRef.current.focus();
    }
  }, [disabled, attachments, hasContext]);

  // Keep height in sync with value changes
  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  // Also ensure height is correct on initial mount
  useEffect(() => {
    autoResize();
  }, [autoResize]);

  const acceptAttr = useMemo(() => '.pdf,.txt,.docx,.xlsx,.json,application/json', []);
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  const contextAvailable = !!hasContext;
  const canChat = hasAttachments || contextAvailable;

  const trimmedValue = (value || '').trim();
  const canSend = !disabled && canChat && trimmedValue.length > 0;
  const helperId = 'chatinput-helper-requires-attachment-or-context';

  // PUBLIC_INTERFACE
  /**
   * Handle keyboard shortcuts
   * - Enter to submit (blocked if no attachment/context yet)
   * - Shift+Enter to insert newline
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Block submission when disabled, empty, or when no attachment/context yet
      if (disabled || !trimmedValue) return;
      if (!canChat) {
        onValidationError &&
          onValidationError('Please attach at least one file (or wait for context upload) before sending your message.');
        return;
      }
      onSubmit(e);
    }
  };

  // Validate and prepare selected files; call parent with normalized attachments
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Helper to read a file as text using FileReader
    const readFileAsText = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
        reader.readAsText(file);
      });

    // Validate selection
    const currentCount = Array.isArray(attachments) ? attachments.length : 0;
    const remainingSlots = Math.max(0, MAX_ATTACHMENTS - currentCount);
    if (files.length > remainingSlots) {
      const msg = `You can attach up to ${MAX_ATTACHMENTS} files total. You tried to add ${files.length}, but only ${remainingSlots} ${remainingSlots === 1 ? 'slot is' : 'slots are'} available.`;
      onValidationError && onValidationError(msg);
      // Trim to allowed count for convenience
      files.splice(remainingSlots);
    }

    const valid = [];
    const rejectedMessages = [];

    for (const f of files) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        rejectedMessages.push(`Unsupported file type: "${f.name}". Allowed: .pdf, .txt, .docx, .xlsx, .json`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        rejectedMessages.push(`"${f.name}" is too large (${formatBytes(f.size)}). Max size is ${formatBytes(MAX_FILE_SIZE)}.`);
        continue;
      }
      const id = makeAttachmentId(f);
      // Avoid duplicates by id
      if (attachments.some(a => a.id === id) || valid.some(v => v.id === id)) {
        // silently skip duplicate
        continue;
      }

      // If JSON file, pre-parse to detect syntax errors and intercept upload if invalid
      if (ext === 'json') {
        try {
          const text = await readFileAsText(f);
          try {
            JSON.parse(text);
          } catch (parseErr) {
            const reason = parseErr && parseErr.message ? parseErr.message : 'Unknown JSON parse error';
            rejectedMessages.push(`Invalid JSON in "${f.name}": ${reason}`);
            continue;
          }
        } catch (readErr) {
          const reason = readErr && readErr.message ? readErr.message : 'Unable to read file';
          rejectedMessages.push(`Could not read "${f.name}" for validation: ${reason}`);
          continue;
        }
      }

      valid.push({ file: f, id, name: f.name, size: f.size, ext });
    }

    if (rejectedMessages.length > 0) {
      onValidationError && onValidationError(rejectedMessages.join('\n'));
    }

    if (valid.length > 0) {
      // Pass File objects to allow future upload; parent can store metadata as needed
      onFilesSelected && onFilesSelected(valid.map(v => v.file));
    }

    // Reset input so re-selecting the same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachClick = () => {
    if (disabled) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSendClick = () => {
    if (!canSend) {
      if (!canChat) {
        onValidationError &&
          onValidationError('Please attach at least one file (or wait for context upload) before sending your message.');
      }
      return;
    }
    // Ensure preventDefault exists for onSubmit handler
    const evt = { preventDefault: () => {} };
    onSubmit(evt);
  };

  const effectivePlaceholder = canChat
    ? placeholder
    : 'Attach a file to enable sending…';

  return (
    <div className="chat-input-container" role="group" aria-label="Chat input with attachments">
      {/* Attachment chips row */}
      {Array.isArray(attachments) && attachments.length > 0 && (
        <div className="attachments-bar" aria-live="polite">
          {attachments.map(att => {
            const status = att.status || 'queued';
            const statusClass = status === 'success' ? 'success' : status === 'error' ? 'error' : status === 'uploading' ? 'uploading' : '';
            return (
              <div
                key={att.id}
                className={`attachment-chip ${statusClass}`}
                title={`${att.name} (${formatBytes(att.size)})${att.error ? ' • ' + att.error : ''}`}
              >
                <span className="attachment-icon" aria-hidden="true">
                  {/* Minimal file icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                <span className="attachment-name" aria-label="File name">{att.name}</span>
                <span className="attachment-size" aria-label="File size">{formatBytes(att.size)}</span>

                {/* Status indicator */}
                <span
                  className={`attachment-status ${statusClass}`}
                  aria-label={status === 'success' ? 'Upload successful' : status === 'error' ? 'Upload failed' : status === 'uploading' ? 'Uploading' : 'Queued'}
                  title={att.error ? att.error : status === 'success' ? 'Uploaded' : status === 'uploading' ? 'Uploading...' : 'Queued'}
                >
                  {status === 'success' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : status === 'error' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : status === 'uploading' ? (
                    <span className="spinner" aria-hidden="true" />
                  ) : null}
                </span>

                {typeof onRemoveAttachment === 'function' && (
                  <button
                    type="button"
                    className="attachment-remove-btn"
                    onClick={() => onRemoveAttachment(att.id)}
                    aria-label={`Remove ${att.name}`}
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Textarea and action buttons */}
      <div className="input-row">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={value}
          onChange={onChange}
          onInput={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={effectivePlaceholder}
          rows={1}
          maxLength={2000}
          disabled={disabled || !canChat}
          aria-label="Type your message"
          aria-multiline="true"
          aria-describedby={!canChat ? helperId : undefined}
          data-requires-attachment={!canChat ? 'true' : 'false'}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="visually-hidden"
          accept={acceptAttr}
          multiple
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          className="attach-btn"
          onClick={handleAttachClick}
          disabled={disabled}
          aria-label="Attach files"
          title="Attach files (.pdf, .txt, .docx, .xlsx, .json)"
        >
          {/* Minimal line icon (paperclip) */}
          <MinimalAttachmentIcon size={18} />
        </button>
        <button
          type="button"
          className={`send-btn ${canSend ? '' : 'disabled'}`}
          onClick={handleSendClick}
          disabled={!canSend}
          aria-label="Send message"
          title={canChat ? 'Send message' : 'Attach a file to enable sending'}
        >
          {/* Minimal send icon (paper plane) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>
      </div>

      {/* Helper text when sending is blocked due to no attachments/context */}
      {!disabled && !canChat && (
        <div id={helperId} className="helper-text" aria-live="polite">
          Attach a .pdf, .txt, .docx, .xlsx, or .json to enable sending.
        </div>
      )}
    </div>
  );
}

export default ChatInput;
