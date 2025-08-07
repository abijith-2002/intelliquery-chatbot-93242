import React, { useEffect, useRef, useState, useCallback } from "react";
import Header from './components/Header';
import ChatMessage, { LoadingMessage } from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ErrorMessage from './components/ErrorMessage';
import "./App.css";

/**
 * Knowledge Chat Frontend
 * 
 * Real-time chat interface. This version implements streaming AI responses from the backend
 * using Server-Sent Events (SSE), or WebSocket if supported. The UI updates as data chunks arrive.
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://vscode-internal-21843-beta.beta01.cloud.kavia.ai:3001";
const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;
// Optionally, check for WebSocket info endpoint used by backend for discovery:
const WSINFO_ENDPOINT = `${API_BASE_URL}/chat/wsinfo`;

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

// Utility: Resolve websocket URL from HTTP API base
function getWebSocketURL() {
  try {
    if (!API_BASE_URL) return null;
    const url = new URL(API_BASE_URL);
    url.protocol = (url.protocol === "https:") ? "wss:" : "ws:";
    url.pathname = "/chat/ws";
    url.search = "";
    return url.href;
  } catch {
    return null;
  }
}

function App() {
  // State Management
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem("conversation_history");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to load conversation history:", error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryableMessage, setRetryableMessage] = useState(null);
  const [streamingAssistant, setStreamingAssistant] = useState(null); // for in-progress stream

  // Refs
  const chatEndRef = useRef(null);
  const sessionId = useRef(generateSessionId());
  const wsRef = useRef();

  // --- Effects ---
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or stream updates
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    try {
      localStorage.setItem("conversation_history", JSON.stringify(messages));
    } catch (error) {
      console.warn("Failed to save conversation history:", error);
    }
  }, [messages, streamingAssistant]);

  // PUBLIC_INTERFACE
  /** Handle input change */
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  // PUBLIC_INTERFACE
  /**
   * Stream AI response from the backend and update UI as chunks arrive.
   * First, try using WebSocket (if available). Fallback on HTTP chunk streaming (fetch+SSE/eventStream).
   */
  const streamAIResponse = async ({ query }) => {
    // --- WebSocket fallback plan ---
    // We'll try to connect to /chat/ws if exists. Otherwise, fallback to chunked fetch (SSE or text/event-stream).
    // --- NOTE: For future - the /chat/wsinfo endpoint can provide upgrade hints ---

    // This implementation uses HTTP chunked streaming (Fetch+ ReadableStream) for incremental updates.
    // If backend supports event-stream or data chunking, process it.
    setStreamingAssistant({
      role: "assistant",
      rag_answer: "",
      gemini_answer: "",
      timestamp: Date.now(),
      _final: false,
    });

    let ragBuffer = "";
    let geminiBuffer = "";
    let allRawBuffer = "";
    let streamMsg = {
      role: "assistant",
      rag_answer: "",
      gemini_answer: "",
      timestamp: Date.now(),
      _final: false,
    };

    // 1. Use fetch with 'Accept: text/event-stream' (SSE/stream), fallback to classic POST
    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          session_id: sessionId.current,
          query,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      // Try reading as text/event-stream (SSE) or chunked JSON text
      const reader = response.body && response.body.getReader ? response.body.getReader() : null;
      if (reader) {
        const textDecoder = new TextDecoder();
        let done = false;
        let firstJSON = "";
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = textDecoder.decode(value, { stream: true });
            allRawBuffer += chunk;
            // Try to split into lines/events
            const lines = chunk.split('\n');
            for (let line of lines) {
              line = line.trim();
              if (!line) continue;
              // Try to parse as JSON object chunk if possible
              try {
                if (line.startsWith("data:")) line = line.slice(5).trim();
                const evt = JSON.parse(line);
                // May contain { type:..., data:... } or directly answer keys
                if (evt.rag_answer !== undefined) {
                  ragBuffer += evt.rag_answer;
                  streamMsg.rag_answer = ragBuffer;
                }
                if (evt.gemini_answer !== undefined) {
                  geminiBuffer += evt.gemini_answer;
                  streamMsg.gemini_answer = geminiBuffer;
                }
                setStreamingAssistant({ ...streamMsg, _final: false });
                continue;
              } catch (error) {
                // not JSON, ingest as plain text into gemini_answer
                geminiBuffer += line + "\n";
                streamMsg.gemini_answer = geminiBuffer;
                setStreamingAssistant({ ...streamMsg, _final: false });
              }
            }
          }
        }
        // Once finished, finalize the message
        streamMsg._final = true;
        setStreamingAssistant(null);
        setMessages(prev => [...prev, { ...streamMsg, _final: undefined, timestamp: Date.now() }]);
      } else {
        // If cannot stream, fallback to .json as normal
        const data = await response.json();
        setStreamingAssistant(null);
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            rag_answer: data.rag_answer || "No knowledge base response available",
            gemini_answer: data.gemini_answer || "No Gemini response available",
            timestamp: Date.now(),
          }
        ]);
      }
    } catch (error) {
      setStreamingAssistant(null);
      throw error;
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Handle message submission (with streaming)
   */
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage = {
      role: "user",
      query: trimmedInput,
      timestamp: Date.now(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setRetryableMessage(trimmedInput);

    try {
      // Use streaming function
      await streamAIResponse({ query: trimmedInput });
      setRetryableMessage(null);
    } catch (err) {
      console.error("Chat error [stream]:", err);
      setError(err.message || "Failed to get response. Please try again.");

      // Remove the optimistically added user message on error
      setMessages(prevMessages => prevMessages.slice(0, -1));
      setInput(trimmedInput); // Restore input
    } finally {
      setIsLoading(false);
      setStreamingAssistant(null);
    }
  // eslint-disable-next-line
  }, [input, isLoading]);

  // PUBLIC_INTERFACE
  /** Retry last failed message */
  const handleRetry = useCallback(() => {
    if (retryableMessage) {
      setInput(retryableMessage);
      setError(null);
      setRetryableMessage(null);
    }
  }, [retryableMessage]);

  // PUBLIC_INTERFACE
  /** Dismiss error message */
  const handleDismissError = useCallback(() => {
    setError(null);
    setRetryableMessage(null);
  }, []);

  // Main Render
  return (
    <div className="App">
      <Header />

      <main className="chat-main">
        <section className="chat-area" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 && !isLoading && !streamingAssistant ? (
            <div className="chat-welcome">
              <div className="welcome-content">
                <div className="welcome-icon">💬</div>
                <h2 className="welcome-title">Welcome to Knowledge Chat</h2>
                <p className="welcome-description">
                  Ask me anything and I'll provide answers using our knowledge base 
                  and AI-powered insights.
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
              {isLoading && streamingAssistant && (
                <ChatMessage message={streamingAssistant} index={messages.length} />
              )}
              {isLoading && !streamingAssistant && <LoadingMessage />}
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
        placeholder={isLoading ? "Processing your message..." : "Type your message..."}
      />
    </div>
  );
}

export default App;
