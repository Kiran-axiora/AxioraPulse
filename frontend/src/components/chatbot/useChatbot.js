import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'axiora_chatbot_history';
const MAX_HISTORY = 50;

const QUICK_REPLIES = [
  'How does Axiora Pulse work?',
  'What survey types are supported?',
  'How do I share a survey?',
  'Can I view analytics?',
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  content:
    "👋 Hi there! \n\nI can help you create surveys, understand analytics, or answer any questions about the platform. What can I help you with today?",
  timestamp: new Date().toISOString(),
  quickReplies: QUICK_REPLIES,
};

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveHistory(messages) {
  try {
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function useChatbot({ apiEndpoint = '/api/chat', apiKey = '', userId = null } = {}) {
  const storageKey = userId ? `${STORAGE_KEY}_${userId}` : `${STORAGE_KEY}_guest`;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [WELCOME_MESSAGE];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [WELCOME_MESSAGE];
    } catch {
      return [WELCOME_MESSAGE];
    }
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const lastUserIdRef = useRef(userId);

  // Sync messages to localStorage with dynamic key
  useEffect(() => {
    // Only persist if we have a real user. Don't persist guest sessions.
    if (!userId) return;

    if (messages.length > 1 || messages[0]?.id !== 'welcome') {
      try {
        const trimmed = messages.slice(-MAX_HISTORY);
        localStorage.setItem(storageKey, JSON.stringify(trimmed));
      } catch (e) {
        console.error('Chatbot storage error:', e);
      }
    }
  }, [messages, storageKey, userId]);

  // Reset chat if userId changes (e.g. login/logout)
  useEffect(() => {
    // If we just logged out (no userId), always start fresh
    if (!userId) {
      setMessages([WELCOME_MESSAGE]);
      setError(null);
      setInput('');
      setUnreadCount(0);
      lastUserIdRef.current = null;
      return;
    }

    const raw = localStorage.getItem(storageKey);
    let initialMessages = [WELCOME_MESSAGE];
    
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialMessages = parsed;
        }
      } catch {
        // ignore
      }
    }
    
    setMessages(initialMessages);
    setError(null);
    setInput('');
    setUnreadCount(0);
    
    // Update the "last seen" userId so the save effect can resume safely
    lastUserIdRef.current = userId;
  }, [userId, storageKey]);

  // Reset unread count when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Track unread messages arriving while closed
  const prevMessagesCount = useRef(messages.length);
  useEffect(() => {
    // Only increment if a NEW message has been added to the array
    if (!isOpen && messages.length > prevMessagesCount.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'bot' && lastMsg.id !== 'welcome') {
        setUnreadCount((c) => c + 1);
      }
    }
    prevMessagesCount.current = messages.length;
  }, [messages, isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const minimize = useCallback(() => {
    setIsMinimized((m) => !m);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(storageKey);
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date().toISOString() }]);
    setError(null);
  }, [storageKey]);

  const addMessage = useCallback((role, content, extras = {}) => {
    const msg = {
      id: nanoid(),
      role,
      content,
      timestamp: new Date().toISOString(),
      ...extras,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const sendMessage = useCallback(
    async (text = input.trim()) => {
      if (!text || isTyping) return;

      setError(null);
      setInput('');
      addMessage('user', text);
      setIsTyping(true);

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const history = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-20)
          .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({ message: text, history }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const botReply = data.reply || data.message || data.content || 'Sorry, I could not process that.';

        addMessage('bot', botReply, {
          quickReplies: data.quickReplies || [],
        });
      } catch (err) {
        if (err.name === 'AbortError') return;
        const errorMsg =
          err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')
            ? "I'm having trouble connecting right now. Please check your connection and try again."
            : err.message || 'Something went wrong. Please try again.';
        setError(errorMsg);
        addMessage('bot', `⚠️ ${errorMsg}`);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, messages, addMessage, apiEndpoint, apiKey]
  );

  const sendQuickReply = useCallback(
    (text) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  return {
    // State
    isOpen,
    isMinimized,
    messages,
    input,
    isTyping,
    error,
    unreadCount,
    theme,
    // Refs
    inputRef,
    // Actions
    open,
    close,
    minimize,
    toggleTheme,
    clearHistory,
    setInput,
    sendMessage,
    sendQuickReply,
  };
}
