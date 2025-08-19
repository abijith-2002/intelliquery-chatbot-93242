import React, { useEffect, useRef, useState, useCallback } from "react";
import Header from './components/Header';
import ChatMessage, { LoadingMessage } from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ErrorMessage from './components/ErrorMessage';
import Sidebar from './components/Sidebar';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import "./App.css";
import ModalDialog from './components/ModalDialog';
import NotificationToaster from './components/NotificationToaster';
import ContextInfoBar from './components/ContextInfoBar';

/**
 * Knowledge Chat Frontend
 * 
 * A modern, minimalistic chat interface built with React.
 * Features real-time communication with FastAPI backend, displays both RAG 
 * and Gemini responses, and maintains conversation history with session persistence.
 * 
 * Design follows the exact specifications from the design notes.
 */

/**
 * Configuration - API base URL for chat endpoint.
 * For production, use the official deployed backend:
 *   https://vscode-internal-21843-beta.beta01.cloud.kavia.ai:3001
 * For development, override REACT_APP_API_BASE_URL in .env as needed.
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://vscode-internal-32892-beta.beta01.cloud.kavia.ai:3001";
const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;

/**
 * Generate or retrieve persistent session ID from localStorage
 * @returns {string} Unique session identifier
 */
function generateSessionId() {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = "session-" + Math.random().toString(36).substr(2, 12) + "-" + Date.now();
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

function App() {
  // --- Demo path-based routing (no react-router): only supports /dashboard and /chat/:id (as string) ---

  // ========== AUTH STATE ================
  const [user, setUser] = useState(() => {
    try {
      const session = localStorage.getItem("auth_user");
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  });

  // ---- APP ROUTING ---------------------
  const [appPath, setAppPath] = useState(() => {
    if (window.location.hash.startsWith("#/chat/"))
      return window.location.hash.replace("#", "");
    if (window.location.hash === "#/dashboard") return "/dashboard";
    return "/";
  });

  const navigate = (path) => {
    window.location.hash = "#" + path;
    setAppPath(path);
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ============= CHAT SESSION STATE =============
  // Each session: { id, title, lastActive, preview, messages }
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const existing = localStorage.getItem("chat_sessions");
      if (existing) return JSON.parse(existing);
    } catch (e) {}
    return [];
  });

  // For currently-active chat
  const [activeSessionId, setActiveSessionId] = useState(() => {
    if (window.location.hash.startsWith("#/chat/")) {
      return window.location.hash.substring(7);
    }
    return "";
  });

  // Load previous chat history from backend on user login (optional: if backend offers endpoint)
  // This is a placeholder; backend needs to provide a /chats or /history endpoint if supported.
  useEffect(() => {
    // Pull previous chats from API (if backend supports), otherwise load from localStorage.
    if (!user) return;
    let ignore = false;
    async function fetchBackendChats() {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
        // Example: GET /chats if API supports it (skipped for now: design uses localStorage)
        // const res = await fetch(`${API_BASE_URL}/chats`, { credentials: "include" });
        // if (res.ok) {
        //   const data = await res.json();
        //   if (!ignore && Array.isArray(data)) setChatSessions(data);
        // }
      } catch (err) {
        // fallback to localStorage
      }
    }
    fetchBackendChats();
    return () => { ignore = true; };
  }, [user]);

  // Save chatSessions to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("chat_sessions", JSON.stringify(chatSessions));
    } catch (e) {}
  }, [chatSessions]);

  // --- CHAT UI STATE -----------
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryableMessage, setRetryableMessage] = useState(null);
  // New: attachments selected by the user (metadata only)
  const [attachments, setAttachments] = useState([]);
  // Toast notifications
  const [notifications, setNotifications] = useState([]);
  // Toast helpers
  const dismissToast = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const pushToast = useCallback((message, type = 'info', ttl = 4500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => dismissToast(id), ttl);
  }, [dismissToast]);



  // PUBLIC_INTERFACE
  /**
   * Handle summary from JSON upload endpoint and post an assistant message with a digest.
   * Updates session-level context stats for JSON uploads.
   * @param {{ session_id?: string, files_processed?: Array<{filename: string, items?: number, error?: string}>, total_items?: number, message?: string }} summary
   */
  const handleJsonUploaded = useCallback((summary) => {
    try {
      const filesProcessed = Array.isArray(summary?.files_processed) ? summary.files_processed : [];
      const okFiles = filesProcessed.filter(f => !f.error);
      const totalItems = typeof summary?.total_items === 'number'
        ? summary.total_items
        : okFiles.reduce((acc, f) => acc + (typeof f.items === 'number' ? f.items : 0), 0);

      const header = okFiles.length === 1
        ? `JSON context added from 1 file: ${okFiles[0]?.filename || 'file'}.`
        : `JSON context added from ${okFiles.length} files.`;
      const bullets = okFiles.slice(0, 3).map(f => `- ${f.filename}${typeof f.items === 'number' ? ` (${f.items} records)` : ''}`).join('\n');
      const more = okFiles.length > 3 ? `\n- …and ${okFiles.length - 3} more file(s)` : '';
      const msg = `✅ ${header}\n${bullets ? `\n${bullets}${more}\n` : ''}\n${typeof totalItems === 'number' && totalItems > 0 ? `Total records: ${totalItems}\n` : ''}${summary?.message ? `\n${summary.message}` : ''}\n\nYou can now ask questions about the uploaded JSON data.`;

      setMessages(prev => prev.concat({
        role: 'assistant',
        rag_answer: 'JSON upload summary',
        gemini_answer: msg,
        timestamp: Date.now(),
      }));

      // Update context stats for active session
      setContextBySession(prev => {
        const existing = prev[sessionId.current] || {};
        const next = {
          ...existing,
          jsonFilesCount: (existing.jsonFilesCount || 0) + okFiles.length,
          jsonItemsCount: (existing.jsonItemsCount || 0) + (totalItems || 0),
          lastJsonUploadedAt: Date.now(),
          lastJsonFilesProcessed: filesProcessed,
        };
        return { ...prev, [sessionId.current]: next };
      });
    } catch {
      // ignore non-fatal issues
    }
  }, []);

  // Session context stats map: { [sessionId]: { totalChars, filesCount, lastUploadedAt, lastFilesProcessed, lastMessage } }
  const [contextBySession, setContextBySession] = useState({});
  const chatEndRef = useRef(null);

  const sessionId = useRef(activeSessionId || generateSessionId());

  // --- Modal/Dialog state for delete/rename ---
  const [modalState, setModalState] = useState({
    open: false,
    type: null,        // 'delete' | 'rename' | null
    chatId: null,
    defaultValue: '',  // used for rename default title
  });

  const closeDialog = useCallback(() => {
    setModalState((prev) => ({ ...prev, open: false }));
  }, []);

  const openDeleteDialog = useCallback((chatId) => {
    setModalState({ open: true, type: 'delete', chatId, defaultValue: '' });
  }, []);

  const openRenameDialog = useCallback((chatId, defaultValue = '') => {
    setModalState({ open: true, type: 'rename', chatId, defaultValue });
  }, []);

  // Start new chat (button on sidebar or header) - moved above all references to avoid TDZ
  const handleStartNewChat = useCallback(() => {
    const now = Date.now();
    const newId = "session-" + Math.random().toString(36).substr(2, 12) + "-" + now;
    setActiveSessionId(newId);
    setMessages([]);
    setInput("");
    setError(null);
    setRetryableMessage(null);
    setIsLoading(false);
    sessionId.current = newId;
    navigate(`/chat/${newId}`);
  }, []);

  // Confirm handler for modal dialog (delete/rename)
  const handleDialogConfirm = useCallback((value) => {
    if (!modalState.open) return;

    if (modalState.type === 'delete' && modalState.chatId) {
      const chatId = modalState.chatId;

      // Compute next sessions list based on current state
      const nextSessions = chatSessions.filter((c) => c.id !== chatId);
      setChatSessions(nextSessions);

      if (activeSessionId === chatId) {
        // If there are remaining sessions, pick the most recent one
        const remainingSorted = nextSessions
          .filter((c) => Array.isArray(c.messages) && c.messages.length > 0)
          .slice()
          .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));

        if (remainingSorted.length > 0) {
          const next = remainingSorted[0];
          setActiveSessionId(next.id);
          setMessages(next.messages || []);
          setInput("");
          setError(null);
          setRetryableMessage(null);
          setIsLoading(false);
          sessionId.current = next.id;
          navigate(`/chat/${next.id}`);
        } else {
          // No remaining chats: reset and start a new chat
          setMessages([]);
          setInput("");
          setError(null);
          setRetryableMessage(null);
          setIsLoading(false);
          setActiveSessionId("");
          sessionId.current = "";
          handleStartNewChat();
        }
      }
    } else if (modalState.type === 'rename' && modalState.chatId) {
      const nextTitle = (value || '').trim();
      if (nextTitle) {
        setChatSessions((prev) =>
          prev.map((c) => (c.id === modalState.chatId ? { ...c, title: nextTitle } : c))
        );
      }
    }

    setModalState({ open: false, type: null, chatId: null, defaultValue: '' });
  }, [modalState, chatSessions, activeSessionId, navigate, handleStartNewChat]);

  const handleDialogCancel = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  // =========== LOGOUT ===========
  const handleLogout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("conversation_history");
      localStorage.removeItem("chat_session_id");
      localStorage.removeItem("chat_sessions");
    } catch (e) {
      console.warn("Failed to clear localStorage on logout:", e);
    }
    setMessages([]);
    setInput("");
    setError(null);
    setRetryableMessage(null);
    setIsLoading(false);
    sessionId.current = generateSessionId();
    setChatSessions([]);
    setActiveSessionId("");
    navigate("/");
  }, []);

  // =========== LOGIN FLOW =========
  // Auth callback and auto-open new chat on successful login
  const handleAuth = useCallback((userObj) => {
    setUser(userObj);
    try {
      localStorage.setItem("auth_user", JSON.stringify(userObj));
    } catch (e) {}
    // After login: start a new chat automatically
    const newChatId = "session-" + Math.random().toString(36).substr(2, 12) + "-" + Date.now();
    setActiveSessionId(newChatId);
    setMessages([]);
    setInput("");
    setError(null);
    setRetryableMessage(null);
    setIsLoading(false);
    sessionId.current = newChatId;
    navigate(`/chat/${newChatId}`);
  }, []);

  // ============ CHAT SESSION STATE MGMT ===============
  // Switch chat: from sidebar
  const handleSelectChatFromSidebar = useCallback((chatId) => {
    if (activeSessionId === chatId) return;
    const sess = chatSessions.find((c) => c.id === chatId);
    if (sess) {
      setActiveSessionId(chatId);
      setMessages(sess.messages || []);
      setInput("");
      setError(null);
      setRetryableMessage(null);
      setIsLoading(false);
      sessionId.current = chatId;
      navigate(`/chat/${chatId}`);
    }
  }, [chatSessions, activeSessionId]);

  // Auto-start a new chat when user logs in or returns while logged in and not already on a chat route
  useEffect(() => {
    if (!user) return;
    const hash = window.location.hash || "";
    if (!hash.startsWith("#/chat/")) {
      handleStartNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- Backwards compat for dashboard "Resume chat" (legacy) ---
  const handleResumeChat = useCallback((chatId) => {
    handleSelectChatFromSidebar(chatId);
  }, [handleSelectChatFromSidebar]);

  // PUBLIC_INTERFACE
  /**
   * Delete a chat session by id with confirmation.
   * - Removes from chatSessions
   * - If deleting the active chat, navigates to the most recent remaining chat or starts a new chat
   */
  const handleDeleteChat = useCallback((chatId) => {
    if (!chatId) return;
    openDeleteDialog(chatId);
  }, [openDeleteDialog]);

  // PUBLIC_INTERFACE
  /**
   * Rename a chat session by id using a prompt
   * - Updates only the title field; keeps messages and metadata
   */
  const handleRenameChat = useCallback((chatId) => {
    if (!chatId) return;
    const sess = chatSessions.find((c) => c.id === chatId);
    const currentTitle = sess?.title || "Untitled";
    openRenameDialog(chatId, currentTitle);
  }, [chatSessions, openRenameDialog]);

  // Whenever we switch activeSessionId, update messages for that session
  useEffect(() => {
    if (!activeSessionId) return;
    const sess = chatSessions.find((c) => c.id === activeSessionId);
    setMessages(sess ? sess.messages : []);
    sessionId.current = activeSessionId;
    navigate(`/chat/${activeSessionId}`);
  // intentionally not depending on chatSessions to avoid loop
  // eslint-disable-next-line
  }, [activeSessionId]);

  // Save messages to chatSessions, and create/update session info.
  useEffect(() => {
    if (!activeSessionId) return;
    setChatSessions((prev) => {
      const foundIndex = prev.findIndex((c) => c.id === activeSessionId);
      // Session title logic: first message sets title, if not present
      function getChatTitle(msgs) {
        // Use first user message's content, trimmed & short
        const firstUser = msgs.find((m) => m.role === "user");
        if (!firstUser || !firstUser.query) return "Untitled";
        let msg = firstUser.query.trim();
        if (msg.length > 50) msg = msg.substring(0, 50) + "…";
        // Remove trailing punctuation and make into "Question?/something" → summary
        if (msg.endsWith("?")) msg = msg.substring(0, msg.length - 1);
        return msg.charAt(0).toUpperCase() + msg.slice(1);
      }
      if (foundIndex !== -1) {
        // Remove session if it no longer has messages
        if (!messages || messages.length === 0) {
          return prev.filter((c) => c.id !== activeSessionId);
        }
        const title = prev[foundIndex].title && prev[foundIndex].title !== "Untitled"
          ? prev[foundIndex].title
          : getChatTitle(messages);
        return prev.map((c) =>
          c.id === activeSessionId
            ? {
                ...c,
                messages,
                lastActive:
                  messages && messages.length
                    ? messages[messages.length - 1].timestamp
                    : c.lastActive,
                preview:
                  messages && messages.length
                    ? messages
                        .slice()
                        .reverse()
                        .find((msg) => msg.role === "user")?.query || ""
                    : "",
                title
              }
            : c
        );
      } else {
        // Add as a new session if messages were sent
        if (messages && messages.length > 0) {
          return [
            {
              id: activeSessionId,
              title: getChatTitle(messages),
              lastActive: messages[messages.length - 1]?.timestamp || Date.now(),
              preview: messages
                .slice()
                .reverse()
                .find((msg) => msg.role === "user")?.query || "",
              messages,
            },
            ...prev,
          ];
        } else {
          // Don't create session if no messages yet
          return prev;
        }
      }
    });
  // eslint-disable-next-line
  }, [messages, activeSessionId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }, []);

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  // PUBLIC_INTERFACE
  /**
   * Handle files selected from ChatInput.
   * Immediately uploads files to the backend /chat/upload-context and shows per-file status via chips.
   * @param {File[]} files
   */
  const handleFilesSelected = useCallback((files) => {
    if (!Array.isArray(files) || files.length === 0) return;

    const current = Array.isArray(attachments) ? attachments.slice() : [];

    // Prepare attachments with uploading status
    const prepared = files.map((f) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const id = `${f.name}__${f.size}__${f.lastModified}`;
      return { id, name: f.name, size: f.size, ext, file: f, status: 'uploading' };
    });

    // Show chips as uploading
    setAttachments(current.concat(prepared));

    // Perform uploads in two batches: non-JSON context files and JSON files
    (async () => {
      const docsBatch = prepared.filter(p => p.ext !== 'json');
      const jsonBatch = prepared.filter(p => p.ext === 'json');

      // 1) Upload non-JSON context files to /chat/upload-context
      if (docsBatch.length > 0) {
        try {
          const formData = new FormData();
          formData.append('session_id', sessionId.current);
          docsBatch.forEach((p) => formData.append('files', p.file));

          const uploadEndpoint = `${API_BASE_URL}/chat/upload-context`;
          const res = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(`Upload failed (HTTP ${res.status}): ${t || res.statusText}`);
          }

          const data = await res.json();
          const filesProcessed = Array.isArray(data.files_processed) ? data.files_processed : [];
          const byName = new Map(filesProcessed.map((fp) => [fp.filename, fp]));

          // Update per-file status for docs
          setAttachments((prev) =>
            prev.map((att) => {
              const inBatch = docsBatch.find((p) => p.id === att.id);
              if (!inBatch) return att;
              const result = byName.get(att.name);
              if (!result) return { ...att, status: 'error', error: 'No result received for this file' };
              if (result.error) return { ...att, status: 'error', error: result.error };
              return { ...att, status: 'success' };
            })
          );

          // Toasts
          const successCount = filesProcessed.filter((f) => !f.error).length;
          const errorCount = filesProcessed.filter((f) => !!f.error).length;
          if (successCount > 0) {
            pushToast(`${successCount} file${successCount === 1 ? '' : 's'} uploaded successfully`, 'success');
          }
          if (errorCount > 0) {
            pushToast(`${errorCount} file${errorCount === 1 ? '' : 's'} failed to upload`, 'error');
          }

          // Update session context stats for docs
          setContextBySession((prev) => {
            const existing = prev[sessionId.current] || { totalChars: 0, filesCount: 0 };
            const addedChars = typeof data.total_chars === 'number' ? data.total_chars : 0;
            const addedFiles = filesProcessed.filter((f) => !f.error).length;
            const next = {
              totalChars: (existing.totalChars || 0) + addedChars,
              filesCount: (existing.filesCount || 0) + addedFiles,
              lastUploadedAt: Date.now(),
              lastFilesProcessed: filesProcessed,
              lastMessage: data.message || '',
              // keep any json counters if present
              jsonFilesCount: existing.jsonFilesCount || 0,
              jsonItemsCount: existing.jsonItemsCount || 0,
              lastJsonUploadedAt: existing.lastJsonUploadedAt,
              lastJsonFilesProcessed: existing.lastJsonFilesProcessed,
            };
            return { ...prev, [sessionId.current]: next };
          });

          // Post a contextual assistant message summarizing the uploaded content (docs)
          try {
            const successful = filesProcessed.filter((f) => !f.error);
            if (successful.length > 0) {
              const header = successful.length === 1
                ? `Context added from 1 file: ${successful[0].filename}`
                : `Context added from ${successful.length} files`;
              const bulletCount = Math.min(successful.length, 3);
              const bullets = successful.slice(0, bulletCount).map((f) => {
                const preview = typeof f.preview === 'string' ? f.preview.trim() : '';
                const trimmedPreview = preview.length > 300 ? preview.slice(0, 300) + '…' : preview;
                const chars = typeof f.content_chars === 'number' ? f.content_chars : 0;
                return `- ${f.filename} (${chars} chars)\n  Preview: ${trimmedPreview || '(no preview available)'}`;
              }).join('\n');
              const moreNote = successful.length > bulletCount ? `\n- …and ${successful.length - bulletCount} more file(s)` : '';
              const content = `✅ ${header}\n\n${bullets}${moreNote}\n\nYou can now ask questions about these file(s) (e.g., "Summarize the document" or "What are the key points?").`;
              setMessages((prev) => prev.concat({
                role: 'assistant',
                rag_answer: 'Context upload summary',
                gemini_answer: content,
                timestamp: Date.now(),
              }));
            }
          } catch {
            // ignore non-fatal
          }

          // Clear uploaded doc chips after a short delay (context is stored server-side)
          window.setTimeout(() => {
            setAttachments((prev) => prev.filter((att) => !docsBatch.some((p) => p.id === att.id)));
          }, 1500);
        } catch (err) {
          // Mark docs in batch as error
          setAttachments((prev) =>
            prev.map((att) =>
              docsBatch.some((p) => p.id === att.id)
                ? { ...att, status: 'error', error: err.message || 'Upload failed' }
                : att
            )
          );
          pushToast('File upload failed. Please try again.', 'error');
          // Auto-clear failed chips after delay
          window.setTimeout(() => {
            setAttachments((prev) => prev.filter((att) => !docsBatch.some((p) => p.id === att.id)));
          }, 2500);
        }
      }

      // 2) Upload JSON files to /chat/upload-json (special handling)
      if (jsonBatch.length > 0) {
        try {
          // Parse JSON files locally to validate and build JSON body
          const parsedEntries = [];
          for (const item of jsonBatch) {
            try {
              const text = await item.file.text();
              const data = JSON.parse(text);
              parsedEntries.push({ filename: item.name, data });
            } catch (e) {
              // Mark parse error
              setAttachments((prev) =>
                prev.map((att) =>
                  att.id === item.id ? { ...att, status: 'error', error: 'Invalid JSON format' } : att
                )
              );
            }
          }

          // If nothing valid to upload after parsing, notify and clear error ones later
          if (parsedEntries.length === 0) {
            pushToast('No valid JSON files to upload.', 'info');
            // Clean up all JSON chips that are not already success
            window.setTimeout(() => {
              setAttachments((prev) =>
                prev.filter((att) => !jsonBatch.some((p) => p.id === att.id))
              );
            }, 2000);
          } else {
            // Attempt JSON POST first
            const endpoint = `${API_BASE_URL}/chat/upload-json`;
            let res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({
                session_id: sessionId.current,
                files: parsedEntries,
              }),
            });

            // Fallback to multipart if not supported
            if (!res.ok && (res.status === 404 || res.status === 415)) {
              const form = new FormData();
              form.append('session_id', sessionId.current);
              jsonBatch.forEach((p) => form.append('files', p.file, p.name));
              res = await fetch(endpoint, { method: 'POST', body: form });
            }

            if (!res.ok) {
              let detail = '';
              try {
                const ct = res.headers.get('Content-Type') || '';
                if (ct.includes('application/json')) {
                  const j = await res.json();
                  detail = typeof j?.detail === 'string' ? j.detail : JSON.stringify(j);
                } else {
                  detail = await res.text();
                }
              } catch {}
              throw new Error(`JSON upload failed (HTTP ${res.status})${detail ? `: ${detail}` : ''}`);
            }

            let summary = null;
            try {
              summary = await res.json();
            } catch {
              summary = null;
            }

            // Update per-file status using response summary when possible
            if (summary && Array.isArray(summary.files_processed)) {
              const byName = new Map(summary.files_processed.map(fp => [fp.filename, fp]));
              setAttachments((prev) =>
                prev.map((att) => {
                  const inBatch = jsonBatch.find((p) => p.id === att.id);
                  if (!inBatch) return att;
                  const result = byName.get(att.name);
                  if (!result) return { ...att, status: 'success' };
                  if (result.error) return { ...att, status: 'error', error: result.error };
                  return { ...att, status: 'success' };
                })
              );
            } else {
              // Assume success for JSON batch if no details
              setAttachments((prev) =>
                prev.map((att) =>
                  jsonBatch.some((p) => p.id === att.id) ? { ...att, status: 'success' } : att
                )
              );
            }

            // Toasts based on summary
            try {
              const list = Array.isArray(summary?.files_processed) ? summary.files_processed : [];
              const successCount = list.filter(f => !f.error).length;
              const errorCount = list.filter(f => f.error).length;
              if (successCount > 0) pushToast(`${successCount} JSON file${successCount === 1 ? '' : 's'} processed`, 'success');
              if (errorCount > 0) pushToast(`${errorCount} JSON file${errorCount === 1 ? '' : 's'} failed`, 'error');
            } catch {}

            // Update higher-level state: assistant message + JSON counters
            if (summary) {
              handleJsonUploaded(summary);
            }

            // Clear JSON chips after a short delay
            window.setTimeout(() => {
              setAttachments((prev) => prev.filter((att) => !jsonBatch.some((p) => p.id === att.id)));
            }, 1500);
          }
        } catch (err) {
          // Mark JSON batch as error
          setAttachments((prev) =>
            prev.map((att) =>
              jsonBatch.some((p) => p.id === att.id)
                ? { ...att, status: 'error', error: err.message || 'JSON upload failed' }
                : att
            )
          );
          pushToast('JSON upload failed. Please try again.', 'error');
          // Auto-clear failed chips after delay
          window.setTimeout(() => {
            setAttachments((prev) => prev.filter((att) => !jsonBatch.some((p) => p.id === att.id)));
          }, 2500);
        }
      }
    })();
  }, [attachments, API_BASE_URL, pushToast, handleJsonUploaded, setContextBySession, setAttachments, setMessages]);

  // PUBLIC_INTERFACE
  /**
   * Remove a single attachment by id.
   * @param {string} id
   */
  const handleRemoveAttachment = useCallback((id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // PUBLIC_INTERFACE
  /**
   * Propagate validation errors from ChatInput to the app-level ErrorMessage
   * @param {string} message
   */
  const handleAttachmentValidationError = useCallback((message) => {
    setError(message);
  }, []);

  // A chat always belongs to the sessionId (active chat)
  const CHAT_TITLE_ENDPOINT = `${API_BASE_URL}/chat/title`;

  /**
   * Returns true if the current messages array is empty—i.e., this is the first user message in a new chat.
   */
  function isFirstMessageOfNewChat() {
    return Array.isArray(messages) && messages.length === 0;
  }

  // PUBLIC_INTERFACE
  /**
   * Handles sending a message (user hit Enter or clicked send)
   * If this is the first message in a new chat, also send to title endpoint.
   */
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput || isLoading) return;
      const hasUploaded = (contextBySession[activeSessionId]?.filesCount || 0) > 0;
      if (!hasUploaded) {
        try { pushToast('Please upload at least one file before sending a message.', 'info'); } catch (e) {}
        return;
      }
      const userMessage = {
        role: "user",
        query: trimmedInput,
        timestamp: Date.now(),
      };
      let firstMsg = false;
      if (isFirstMessageOfNewChat()) firstMsg = true;
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);
      setRetryableMessage(trimmedInput);

      // If this is the first message of a new chat, fetch the title then proceed
      let generatedTitle = null;

      try {
        if (firstMsg) {
          // Call /chat/title with { prompt }
          const titleRes = await fetch(CHAT_TITLE_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ prompt: trimmedInput }),
          });
          // On error, fallback to default
          if (titleRes.ok) {
            // The endpoint returns a JSON body that's just a string
            // e.g. "Project Launch Timeline"
            // Try to parse as string:
            const contentType = titleRes.headers.get("Content-Type") || "";
            if (contentType.includes("application/json")) {
              const titleString = await titleRes.json();
              // Sometimes may return e.g. { detail: ... }
              if (typeof titleString === "string" && titleString.length > 0) {
                generatedTitle = titleString;
              }
            } else {
              const text = await titleRes.text();
              if (text.trim().length > 0) generatedTitle = text.trim();
            }
            if (!generatedTitle || generatedTitle.length === 0) {
              generatedTitle = trimmedInput.length > 50 ? trimmedInput.substring(0, 50) + "…" : trimmedInput;
            }
          } else {
            generatedTitle = trimmedInput.length > 50 ? trimmedInput.substring(0, 50) + "…" : trimmedInput;
          }
        }

        const response = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId.current,
            query: trimmedInput,
          }),
        });

        // Robust HTTP error handling with informative details when available
        if (!response.ok) {
          let detail = "";
          try {
            const ct = response.headers.get("Content-Type") || "";
            if (ct.includes("application/json")) {
              const errJson = await response.json();
              if (typeof errJson?.detail === "string") {
                detail = errJson.detail;
              } else if (errJson) {
                detail = JSON.stringify(errJson);
              }
            } else {
              detail = await response.text();
            }
          } catch {
            // ignore parse errors
          }
          const extras = detail ? `: ${detail}` : "";
          throw new Error(`Chat request failed (HTTP ${response.status})${extras}`);
        }

        // Parse response supporting the new { answer: string } format while remaining backward-compatible.
        let answerText = "";
        try {
          const contentType = response.headers.get("Content-Type") || "";
          if (contentType.includes("application/json")) {
            const data = await response.json();
            if (data && typeof data.answer === "string") {
              answerText = data.answer;
            } else if (typeof data.gemini_answer === "string") {
              // Backward compatibility with legacy format
              answerText = data.gemini_answer;
            } else if (typeof data === "string") {
              // Some servers may return plain string as JSON
              answerText = data;
            }
          } else {
            // Fallback: try text, then attempt JSON parse
            const textBody = await response.text();
            try {
              const parsed = JSON.parse(textBody);
              if (parsed && typeof parsed.answer === "string") {
                answerText = parsed.answer;
              } else if (typeof parsed.gemini_answer === "string") {
                answerText = parsed.gemini_answer;
              } else if (typeof parsed === "string") {
                answerText = parsed;
              } else {
                answerText = textBody;
              }
            } catch {
              answerText = textBody;
            }
          }
        } catch {
          // Safe default on parse failure
          answerText = "";
        }

        if (!answerText || answerText.trim().length === 0) {
          answerText = "No answer available.";
        }

        const assistantMessage = {
          role: "assistant",
          // Display only Gemini's (final) answer
          gemini_answer: answerText,
          timestamp: Date.now(),
        };

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
        setRetryableMessage(null);
        // Attachments are managed by the upload flow and cleared after upload.

        // If a title was generated, update chatSessions (and sync to localStorage)
        if (firstMsg && generatedTitle) {
          setChatSessions((prev) => {
            const idx = prev.findIndex(s => s.id === activeSessionId);
            if (idx !== -1) {
              // Update the session's title but preserve other content
              return prev.map((s, i) =>
                i === idx ? { ...s, title: generatedTitle } : s
              );
            } else {
              // If not in sessions, push a new one (should only rarely happen)
              return [
                {
                  id: activeSessionId,
                  title: generatedTitle,
                  lastActive: Date.now(),
                  preview: trimmedInput,
                  messages: [userMessage, assistantMessage],
                },
                ...prev,
              ];
            }
          });
        }

      } catch (err) {
        setError(err.message || "Failed to get response. Please try again.");
        setMessages((prevMessages) => prevMessages.slice(0, -1));
        setInput(trimmedInput);
      } finally {
        setIsLoading(false);
      }
    },
    // Note: added chatSessions (must be stable due to setChatSessions use)
    [input, isLoading, messages, activeSessionId, chatSessions, contextBySession, pushToast]
  );

  const handleRetry = useCallback(() => {
    if (retryableMessage) {
      setInput(retryableMessage);
      setError(null);
      setRetryableMessage(null);
    }
  }, [retryableMessage]);

  const handleDismissError = useCallback(() => {
    setError(null);
    setRetryableMessage(null);
  }, []);

  // Listen for hash changes to switch pages (simulate basic navigation)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("/chat/")) {
        const chatId = hash.substring("/chat/".length);
        setAppPath("/chat/" + chatId);
        setActiveSessionId(chatId);
      } else if (hash === "/dashboard") {
        setAppPath("/dashboard");
      } else {
        setAppPath("/");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // ======= ROUTING LOGIC =========
  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // Show dashboard if at "/dashboard"
  if (appPath === "/dashboard") {
    return (
      <DashboardPage
        user={user}
        onLogout={handleLogout}
        chats={chatSessions}
        onStartNewChat={handleStartNewChat}
        onResumeChat={handleResumeChat}
      />
    );
  }

  // Show chat if at "/chat/:id" (session might not yet exist)
  if (appPath.startsWith("/chat/") && activeSessionId) {
    const hasUploadedContext = ((contextBySession[activeSessionId]?.filesCount || 0) > 0)
      || ((contextBySession[activeSessionId]?.jsonFilesCount || 0) > 0);
    return (
      <div className="App" style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
        <Sidebar
          chats={chatSessions}
          activeSessionId={activeSessionId}
          onSelectChat={handleSelectChatFromSidebar}
          onNewChat={handleStartNewChat}
          isOpen={sidebarOpen}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100vh", minWidth: 0 }}>
          <Header
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            isSidebarOpen={sidebarOpen}
          />
          {/* Context info bar reminding users their uploaded files are used in answers */}
          <ContextInfoBar context={contextBySession[activeSessionId]} />
          <main className="chat-main">
            <section
              className="chat-area"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.length === 0 && !isLoading ? (
                <div className="chat-welcome">
                  <div className="welcome-content">
                    <div className="welcome-icon">💬</div>
                    <h2 className="welcome-title">
                      Welcome to Knowledge Chat
                    </h2>
                    <p className="welcome-description">
                      Ask me anything and I'll provide answers using our
                      knowledge base and AI-powered insights.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={`${message.timestamp}-${index}`}
                      message={message}
                      index={index}
                    />
                  ))}
                  {isLoading && <LoadingMessage />}
                </>
              )}
              {error && (
                <ErrorMessage
                  message={error}
                  onRetry={retryableMessage ? handleRetry : null}
                  onDismiss={handleDismissError}
                />
              )}
              <div ref={chatEndRef} />
            </section>
          </main>
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSendMessage}
            disabled={isLoading}
            requiresUpload={!hasUploadedContext}
            onBlockedSend={() => pushToast('Please upload at least one file before sending a message.', 'info')}
            placeholder={
              isLoading ? "Processing your message..." : (hasUploadedContext ? "Type your message..." : "Upload a file to enable sending...")
            }
            attachments={attachments}
            onFilesSelected={handleFilesSelected}
            onRemoveAttachment={handleRemoveAttachment}
            onValidationError={handleAttachmentValidationError}
          />

          <ModalDialog
            open={modalState.open}
            title={modalState.type === 'delete' ? 'Delete chat?' : 'Rename chat'}
            description={
              modalState.type === 'delete'
                ? 'This will permanently delete this chat. This cannot be undone.'
                : 'Enter a new name for this chat.'
            }
            variant={modalState.type === 'rename' ? 'prompt' : 'confirm'}
            defaultValue={modalState.type === 'rename' ? modalState.defaultValue : ''}
            confirmText={modalState.type === 'delete' ? 'Delete' : 'Save'}
            cancelText="Cancel"
            onConfirm={handleDialogConfirm}
            onClose={handleDialogCancel}
          />

          {/* Toast notifications */}
          <NotificationToaster notifications={notifications} onDismiss={dismissToast} />
        </div>
      </div>
    );
  }

  // Fallback: ensure we are on a chat session
  if (activeSessionId) {
    navigate(`/chat/${activeSessionId}`);
  } else {
    handleStartNewChat();
  }
  return null;
}

export default App;
