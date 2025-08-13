import React, { useEffect, useRef, useState, useCallback } from "react";
import "./ModalDialog.css";

// PUBLIC_INTERFACE
/**
 * ModalDialog - minimal, accessible dialog/modal for confirm and prompt flows.
 *
 * Supports two variants:
 * - "confirm": Confirmation dialog with title, description, and Confirm/Cancel actions.
 * - "prompt":  Prompt dialog with a text input for user to submit a value.
 *
 * Accessibility:
 * - role="dialog" with aria-modal="true"
 * - Focus is trapped within the dialog while open and returned to the last focused element on close
 * - ESC closes the dialog
 * - Overlay click closes the dialog
 *
 * Props:
 * @param {boolean} open - Whether the dialog is open
 * @param {string} title - Dialog title text
 * @param {string} [description] - Optional description text
 * @param {"confirm"|"prompt"} [variant="confirm"] - Dialog type
 * @param {string} [defaultValue] - Default input value for prompt
 * @param {string} [confirmText="Confirm"] - Confirm button label
 * @param {string} [cancelText="Cancel"] - Cancel button label
 * @param {function(value?: string): void} onConfirm - Called when user confirms; value provided for prompt
 * @param {function(): void} onClose - Called when user cancels or closes
 */
function ModalDialog({
  open,
  title,
  description,
  variant = "confirm",
  defaultValue = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}) {
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const lastActiveRef = useRef(null);
  const [value, setValue] = useState(defaultValue || "");

  // Sync default value when dialog opens for prompt variant
  useEffect(() => {
    if (open && variant === "prompt") {
      setValue(defaultValue || "");
    }
  }, [open, variant, defaultValue]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Manage focus: store last focus, move focus into dialog on open, restore on close
  useEffect(() => {
    if (open) {
      lastActiveRef.current = document.activeElement;
      const toFocus = variant === "prompt" ? inputRef.current : panelRef.current?.querySelector("button[data-primary='true']");
      setTimeout(() => {
        if (toFocus && typeof toFocus.focus === "function") toFocus.focus();
        else if (panelRef.current) panelRef.current.focus();
      }, 0);
    } else if (lastActiveRef.current && typeof lastActiveRef.current.focus === "function") {
      setTimeout(() => lastActiveRef.current.focus(), 0);
    }
  }, [open, variant]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (onClose) onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap for Tab navigation
  const trapFocus = useCallback((e) => {
    if (!open || !panelRef.current) return;
    if (e.key !== "Tab") return;

    const focusable = panelRef.current.querySelectorAll(
      "button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])"
    );
    const list = Array.from(focusable).filter((el) => !el.hasAttribute("disabled"));
    if (list.length === 0) return;

    const first = list[0];
    const last = list[list.length - 1];
    const current = document.activeElement;

    if (e.shiftKey) {
      if (current === first || !panelRef.current.contains(current)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (current === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node) return;
    node.addEventListener("keydown", trapFocus);
    return () => node.removeEventListener("keydown", trapFocus);
  }, [open, trapFocus]);

  const handleOverlayClick = (e) => {
    if (e.target && e.target.getAttribute("data-overlay") === "true") {
      if (onClose) onClose();
    }
  };

  const handleConfirm = () => {
    if (variant === "prompt") {
      const trimmed = (value || "").trim();
      if (!trimmed) return;
      if (onConfirm) onConfirm(trimmed);
    } else {
      if (onConfirm) onConfirm();
    }
  };

  if (!open) return null;

  const titleId = "modal-title";
  const descId = description ? "modal-desc" : undefined;
  const isPrompt = variant === "prompt";
  const confirmDisabled = isPrompt ? (value || "").trim().length === 0 : false;

  return (
    <div
      className="modal-overlay"
      data-overlay="true"
      onMouseDown={handleOverlayClick}
      aria-hidden={false}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        ref={panelRef}
        tabIndex={-1}
      >
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        {description && (
          <p id={descId} className="modal-desc">
            {description}
          </p>
        )}

        {isPrompt && (
          <div className="modal-input-group">
            <label htmlFor="modal-input" className="modal-label">
              New name
            </label>
            <input
              id="modal-input"
              ref={inputRef}
              className="modal-input"
              type="text"
              maxLength={100}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter a new chat name"
              aria-required="true"
            />
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`modal-btn primary ${confirmDisabled ? "disabled" : ""}`}
            onClick={handleConfirm}
            data-primary="true"
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalDialog;
