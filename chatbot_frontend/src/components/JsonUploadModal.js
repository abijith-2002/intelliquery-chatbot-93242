import React, { useCallback, useMemo, useRef, useState } from "react";
import "./JsonUploadModal.css";

/**
 * @typedef {Object} JsonFileToUpload
 * @property {string} id
 * @property {File} file
 * @property {string} name
 * @property {number} size
 * @property {'queued'|'parsing'|'ready'|'uploading'|'success'|'error'} status
 * @property {string} [error]
 * @property {any} [data]           // parsed JSON
 */

/**
 * @typedef {Object} UploadSummary
 * @property {string} session_id
 * @property {Array<{ filename: string, items?: number, error?: string }>} files_processed
 * @property {number} [total_items]
 * @property {string} [message]
 */

// PUBLIC_INTERFACE
/**
 * JsonUploadModal
 *
 * PUBLIC_INTERFACE
 * A modal/popup to upload one or more JSON files, parse them locally for validation,
 * and submit their content to the backend JSON upload endpoint.
 *
 * Props:
 * @param {boolean} open - Whether the modal is visible
 * @param {Function} onClose - Close handler
 * @param {string} sessionId - Current chat session id to associate uploads with
 * @param {string} apiBaseUrl - Base URL of the backend (e.g., REACT_APP_API_BASE_URL)
 * @param {(message: string, type?: 'success'|'error'|'info', ttl?: number) => void} [onToast] - Optional toaster function
 * @param {(summary: UploadSummary) => void} [onUploaded] - Called with server summary on success
 */
function JsonUploadModal({ open, onClose, sessionId, apiBaseUrl, onToast, onUploaded }) {
  const [files, setFiles] = useState(/** @type {JsonFileToUpload[]} */([]));
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const endpoint = useMemo(() => `${apiBaseUrl}/chat/upload-json`, [apiBaseUrl]);

  const acceptAttr = useMemo(() => ".json,application/json", []);

  const reset = useCallback(() => {
    setFiles([]);
    setSubmitting(false);
  }, []);

  const close = useCallback(() => {
    if (submitting) return;
    reset();
    if (typeof onClose === "function") onClose();
  }, [onClose, reset, submitting]);

  const addToast = useCallback((msg, type = "info", ttl = 4500) => {
    try {
      typeof onToast === "function" && onToast(msg, type, ttl);
    } catch {
      // ignore
    }
  }, [onToast]);

  const handlePickClick = useCallback(() => {
    if (submitting) return;
    inputRef.current?.click();
  }, [submitting]);

  const handleFileChange = useCallback(async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    // Deduplicate against current list
    const currentIds = new Set(files.map(f => f.id));
    const prepared = /** @type {JsonFileToUpload[]} */(selected.map(f => ({
      id: `${f.name}__${f.size}__${f.lastModified}`,
      file: f,
      name: f.name,
      size: f.size,
      status: "queued"
    })).filter(item => !currentIds.has(item.id)));

    // Validate extensions
    const invalid = prepared.filter(p => !p.name.toLowerCase().endsWith(".json"));
    if (invalid.length > 0) {
      addToast(`Unsupported file type for: ${invalid.map(i => i.name).join(", ")}`, "error");
    }
    const valid = prepared.filter(p => p.name.toLowerCase().endsWith(".json"));
    if (valid.length === 0) return;

    // Parse JSON sequentially for clear per-file status
    for (const item of valid) {
      item.status = "parsing";
      setFiles(prev => [...prev, { ...item }]);
      try {
        const text = await item.file.text();
        try {
          const parsed = JSON.parse(text);
          item.data = parsed;
          item.status = "ready";
          setFiles(prev => prev.map(f => f.id === item.id ? { ...item } : f));
        } catch (parseErr) {
          item.error = "Invalid JSON format";
          item.status = "error";
          setFiles(prev => prev.map(f => f.id === item.id ? { ...item } : f));
        }
      } catch (readErr) {
        item.error = "Failed to read file";
        item.status = "error";
        setFiles(prev => prev.map(f => f.id === item.id ? { ...item } : f));
      }
    }

    // Reset input to allow re-selecting the same file
    if (inputRef.current) inputRef.current.value = "";
  }, [files, addToast]);

  const handleRemove = useCallback((id) => {
    if (submitting) return;
    setFiles(prev => prev.filter(f => f.id !== id));
  }, [submitting]);

  const readyFiles = useMemo(() => files.filter(f => f.status === "ready"), [files]);
  const anySuccess = useMemo(() => files.some(f => f.status === "success"), [files]);
  const allDone = useMemo(() => files.every(f => f.status === "success" || f.status === "error"), [files]);

  const buildRequestBody = useCallback(() => {
    // Flexible request shape to maximize backend compatibility:
    // {
    //   session_id: string,
    //   files: [{ filename: string, data: any }]
    // }
    const items = readyFiles.map(f => ({
      filename: f.name,
      data: f.data
    }));
    return {
      session_id: sessionId,
      files: items
    };
  }, [readyFiles, sessionId]);

  const submit = useCallback(async () => {
    if (submitting) return;
    if (!sessionId) {
      addToast("Missing session id. Please start or select a chat.", "error");
      return;
    }
    if (readyFiles.length === 0) {
      addToast("No valid JSON files to upload.", "info");
      return;
    }

    setSubmitting(true);
    // Mark as uploading
    setFiles(prev => prev.map(f => f.status === "ready" ? { ...f, status: "uploading", error: undefined } : f));

    try {
      const body = buildRequestBody();
      // Primary attempt: JSON body
      let res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(body)
      });

      // If endpoint not found or unsupported media type, try multipart fallback
      if (!res.ok && (res.status === 404 || res.status === 415)) {
        const form = new FormData();
        form.append("session_id", sessionId);
        // Attach raw files as 'files'
        files
          .filter(f => f.status === "uploading" || f.status === "ready")
          .forEach(f => form.append("files", f.file, f.name));
        res = await fetch(endpoint, {
          method: "POST",
          body: form
        });
      }

      if (!res.ok) {
        let detail = "";
        try {
          const ct = res.headers.get("Content-Type") || "";
          if (ct.includes("application/json")) {
            const j = await res.json();
            detail = typeof j?.detail === "string" ? j.detail : JSON.stringify(j);
          } else {
            detail = await res.text();
          }
        } catch {}
        throw new Error(`Upload failed (HTTP ${res.status})${detail ? `: ${detail}` : ""}`);
      }

      /** @type {UploadSummary|any} */
      let summary;
      try {
        summary = await res.json();
      } catch {
        summary = null;
      }

      // Update per-file status using response, fallback to local success
      if (summary && Array.isArray(summary.files_processed)) {
        const byName = new Map(summary.files_processed.map(fp => [fp.filename, fp]));
        setFiles(prev => prev.map(f => {
          if (f.status !== "uploading" && f.status !== "ready") return f;
          const result = byName.get(f.name);
          if (!result) return { ...f, status: "success" }; // assume success
          if (result.error) return { ...f, status: "error", error: result.error };
          return { ...f, status: "success" };
        }));
      } else {
        // Assume success for uploaded ones
        setFiles(prev => prev.map(f => (f.status === "uploading" || f.status === "ready") ? { ...f, status: "success" } : f));
      }

      addToast("JSON upload completed.", "success");
      if (typeof onUploaded === "function" && summary) {
        onUploaded(summary);
      }
    } catch (err) {
      const msg = err?.message || "Upload failed";
      addToast(msg, "error");
      setFiles(prev => prev.map(f => (f.status === "uploading" || f.status === "ready") ? { ...f, status: "error", error: msg } : f));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, sessionId, readyFiles, buildRequestBody, endpoint, addToast, onUploaded, files]);

  if (!open) return null;

  return (
    <div className="json-modal-overlay" data-overlay="true" onMouseDown={(e) => {
      if ((e.target && e.target.getAttribute("data-overlay")) === "true") {
        close();
      }
    }}>
      <div className="json-modal-panel" role="dialog" aria-modal="true" aria-labelledby="json-modal-title">
        <h2 id="json-modal-title" className="json-modal-title">Upload JSON</h2>
        <p className="json-modal-desc">Select one or more .json files to add as context for this chat. We will validate the JSON before uploading.</p>

        <div className="json-picker-row">
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            multiple
            onChange={handleFileChange}
            className="visually-hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          <button type="button" className="json-pick-btn" onClick={handlePickClick} disabled={submitting} aria-label="Pick JSON files">
            <span className="btn-icon" aria-hidden="true">{'{}'}</span>
            Choose JSON Files
          </button>
        </div>

        <div className="json-filelist" aria-live="polite">
          {files.length === 0 ? (
            <div className="json-empty">No files selected.</div>
          ) : (
            files.map(f => {
              const statusClass =
                f.status === "success" ? "success" :
                f.status === "error" ? "error" :
                f.status === "uploading" ? "uploading" :
                f.status === "parsing" ? "parsing" :
                f.status === "ready" ? "ready" : "queued";
              return (
                <div key={f.id} className={`json-fileitem ${statusClass}`} title={f.error ? f.error : undefined}>
                  <div className="fileitem-main">
                    <span className="fileitem-icon" aria-hidden="true">📄</span>
                    <span className="fileitem-name">{f.name}</span>
                    <span className="fileitem-size">{formatBytes(f.size)}</span>
                  </div>
                  <div className="fileitem-actions">
                    <span className={`fileitem-status ${statusClass}`}>
                      {f.status === "success" ? "Uploaded" :
                       f.status === "error" ? "Error" :
                       f.status === "uploading" ? "Uploading…" :
                       f.status === "parsing" ? "Parsing…" :
                       f.status === "ready" ? "Ready" : "Queued"}
                    </span>
                    {(f.status === "queued" || f.status === "ready" || f.status === "error") && (
                      <button
                        type="button"
                        className="fileitem-remove"
                        onClick={() => handleRemove(f.id)}
                        disabled={submitting}
                        aria-label={`Remove ${f.name}`}
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="json-actions">
          <button type="button" className="json-cancel" onClick={close} disabled={submitting}>Cancel</button>
          <button
            type="button"
            className={`json-submit ${readyFiles.length > 0 && !submitting ? "" : "disabled"}`}
            disabled={readyFiles.length === 0 || submitting}
            onClick={submit}
            aria-label="Upload JSON files"
          >
            {submitting ? "Uploading…" : "Upload"}
          </button>
        </div>

        {anySuccess && allDone && (
          <div className="json-hint" role="note">
            You can close this dialog. Uploaded files will be used to improve answer quality for this chat.
          </div>
        )}
      </div>
    </div>
  );
}

/** Utility: format bytes human-readable */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

export default JsonUploadModal;
