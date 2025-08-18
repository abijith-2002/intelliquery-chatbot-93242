import React from 'react';
import './ContextInfoBar.css';

// Types for reference
/**
 * @typedef {Object} UploadedFileResult
 * @property {string} filename
 * @property {number} size
 * @property {number} content_chars
 * @property {string|null} [error]
 */

/**
 * @typedef {Object} SessionContextInfo
 * @property {number} totalChars - Cumulative chars added in this session (frontend-tracked)
 * @property {number} filesCount - Cumulative number of files successfully uploaded (frontend-tracked)
 * @property {number} [lastUploadedAt] - Timestamp of last upload
 * @property {UploadedFileResult[]} [lastFilesProcessed] - Per-file results from the last upload
 * @property {string} [lastMessage] - Status message from last upload
 */

// PUBLIC_INTERFACE
/**
 * ContextInfoBar - persistent lightweight bar reminding that uploaded files are used for answers,
 * with optional stats of current session context.
 *
 * Props:
 * @param {SessionContextInfo|null|undefined} context - Context info for the active chat session
 */
function ContextInfoBar({ context }) {
  const hasStats = !!context && ((context.filesCount || 0) > 0 || (context.totalChars || 0) > 0);

  return (
    <div className="contextbar-wrapper" role="note" aria-live="polite">
      <div className="contextbar">
        <span className="contextbar-icon" aria-hidden="true">📎</span>
        <div className="contextbar-text">
          {hasStats ? (
            <>
              <div className="contextbar-line">
                Files uploaded to this chat are used to improve answers.
              </div>
              <div className="contextbar-line subtle">
                Current context: {context.filesCount || 0} file{(context.filesCount || 0) === 1 ? '' : 's'} · {context.totalChars || 0} chars
              </div>
            </>
          ) : (
            <>
              <div className="contextbar-line">
                Tip: Upload files via the paperclip to provide context. We’ll use them to answer your questions.
              </div>
              <div className="contextbar-line subtle">
                Supported: PDF, DOCX, XLSX, TXT
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContextInfoBar;
