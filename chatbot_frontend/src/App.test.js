import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock localStorage with proper implementation
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear();
  });

  test('renders welcome screen initially', () => {
    render(<App />);
    
    expect(screen.getByText('Welcome to IntelliQuery!')).toBeInTheDocument();
    expect(screen.getByText(/I'm your AI assistant/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /type your message/i })).toBeInTheDocument();
  });

  test('renders header with brand name', () => {
    render(<App />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('IntelliQuery')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  test('theme toggle functionality', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const themeToggle = screen.getByRole('button', { name: /switch to light theme/i });
    expect(themeToggle).toBeInTheDocument();
    
    await act(async () => {
      await user.click(themeToggle);
    });
    
    // Check if localStorage.setItem was called with theme and light
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  test('input field accepts text', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const inputField = screen.getByRole('textbox', { name: /type your message/i });
    
    await user.type(inputField, 'Hello, IntelliQuery!');
    
    expect(inputField).toHaveValue('Hello, IntelliQuery!');
  });

  test('send button is disabled when input is empty', () => {
    render(<App />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    const inputField = screen.getByRole('textbox', { name: /type your message/i });
    
    expect(sendButton).toBeDisabled();
    expect(inputField).toHaveValue('');
  });

  test('send button is enabled when input has text', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    const inputField = screen.getByRole('textbox', { name: /type your message/i });
    
    await user.type(inputField, 'Test message');
    
    expect(sendButton).not.toBeDisabled();
  });

  test('displays error message on API failure', async () => {
    const user = userEvent.setup();
    fetch.mockRejectedValueOnce(new Error('API Error'));
    
    render(<App />);
    
    const inputField = screen.getByRole('textbox', { name: /type your message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(inputField, 'Test message');
    
    await act(async () => {
      await user.click(sendButton);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  test('successful message submission', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      rag_answer: 'Test RAG response',
      gemini_answer: 'Test Gemini response',
      conversation_history: []
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });
    
    render(<App />);
    
    const inputField = screen.getByRole('textbox', { name: /type your message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    await user.type(inputField, 'Test question');
    
    await act(async () => {
      await user.click(sendButton);
    });
    
    // Check that loading state appears by looking for loading text
    await waitFor(() => {
      expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Check that response appears
    await waitFor(() => {
      expect(screen.getByText('Test RAG response')).toBeInTheDocument();
      expect(screen.getByText('Test Gemini response')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check that input is cleared
    expect(inputField).toHaveValue('');
  });

  test('keyboard shortcut Enter submits message', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      rag_answer: 'Test response',
      gemini_answer: 'Test Gemini response',
      conversation_history: []
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });
    
    render(<App />);
    
    const inputField = screen.getByRole('textbox', { name: /type your message/i });
    
    await user.type(inputField, 'Test message');
    
    await act(async () => {
      await user.keyboard('{Enter}');
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test message'),
        })
      );
    });
  });

  test('restores conversation from localStorage', () => {
    const mockConversation = [
      {
        role: 'user',
        query: 'Previous question',
        timestamp: Date.now() - 1000
      },
      {
        role: 'assistant',
        rag_answer: 'Previous RAG answer',
        gemini_answer: 'Previous Gemini answer',
        timestamp: Date.now()
      }
    ];
    
    // Set up localStorage mock to return conversation data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'conversation_history') {
        return JSON.stringify(mockConversation);
      }
      return null;
    });
    
    render(<App />);
    
    // Use more flexible text matching
    expect(screen.getByText(/previous question/i)).toBeInTheDocument();
    expect(screen.getByText(/previous rag answer/i)).toBeInTheDocument();
    expect(screen.getByText(/previous gemini answer/i)).toBeInTheDocument();
  });
});
