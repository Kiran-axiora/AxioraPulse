import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatbot } from './useChatbot';
import useAuthStore from '../../hooks/useAuth';
import ChatWindow from './ChatWindow';
import './chatbot.css';

// ─── Chat Icon ────────────────────────────────────────────────────────────────
const ChatIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" width={26} height={26} aria-hidden="true">
    <path
      d="M4 6C4 4.34315 5.34315 3 7 3H21C22.6569 3 24 4.34315 24 6V17C24 18.6569 22.6569 20 21 20H15L10 25V20H7C5.34315 20 4 18.6569 4 17V6Z"
      fill="white"
      fillOpacity="0.95"
    />
    <circle cx="10" cy="11.5" r="1.5" fill="#FF4500" />
    <circle cx="14" cy="11.5" r="1.5" fill="#FF4500" />
    <circle cx="18" cy="11.5" r="1.5" fill="#FF4500" />
  </svg>
);

const CloseSmIcon = () => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Notification Badge ───────────────────────────────────────────────────────
const NotificationBadge = memo(function NotificationBadge({ count }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key="badge"
          className="chat-fab-badge"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          aria-label={`${count} unread message${count > 1 ? 's' : ''}`}
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
});

// ─── Pulse Ring ───────────────────────────────────────────────────────────────
const PulseRing = memo(function PulseRing({ active }) {
  if (!active) return null;
  return (
    <>
      <span className="fab-ring fab-ring-1" aria-hidden="true" />
      <span className="fab-ring fab-ring-2" aria-hidden="true" />
    </>
  );
});

// ─── ChatbotWidget (Root) ─────────────────────────────────────────────────────
/**
 * Drop-in chatbot widget.
 *
 * Props:
 *   apiEndpoint  {string}  – Your backend chat endpoint (default: '/api/chat')
 *   apiKey       {string}  – Optional Bearer token (use only server-side proxy!)
 *   position     {string}  – 'bottom-right' | 'bottom-left' (default: 'bottom-right')
 */
const ChatbotWidget = memo(function ChatbotWidget({
  apiEndpoint = '/api/chat',
  apiKey = '',
  position = 'bottom-right',
}) {
  const { user } = useAuthStore();
  
  const {
    isOpen,
    isMinimized,
    messages,
    input,
    isTyping,
    error,
    unreadCount,
    theme,
    inputRef,
    open,
    close,
    minimize,
    toggleTheme,
    clearHistory,
    setInput,
    sendMessage,
    sendQuickReply,
  } = useChatbot({ apiEndpoint, apiKey, userId: user?.id });

  const handleDismissError = useCallback(() => {
    // Remove the last bot error message
  }, []);

  const positionClass = position === 'bottom-left' ? 'fab-left' : 'fab-right';

  return (
    <div
      className={`chatbot-root ${positionClass}`}
      id="chatbot-widget"
      aria-label="Chat widget"
    >
      {/* ── Chat Window ── */}
      <ChatWindow
        isOpen={isOpen}
        isMinimized={isMinimized}
        theme={theme}
        messages={messages}
        input={input}
        isTyping={isTyping}
        error={error}
        inputRef={inputRef}
        onClose={close}
        onMinimize={minimize}
        onToggleTheme={toggleTheme}
        onClearHistory={clearHistory}
        onInputChange={setInput}
        onSend={sendMessage}
        onQuickReply={sendQuickReply}
        onDismissError={handleDismissError}
      />

      {/* ── Floating Action Button ── */}
      <div className="chat-fab-wrap">
        <PulseRing active={!isOpen && unreadCount > 0} />
        <NotificationBadge count={isOpen ? 0 : unreadCount} />

        <motion.button
          id="chatbot-fab"
          className="chat-fab"
          onClick={isOpen ? close : open}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          aria-expanded={isOpen}
          aria-controls="chatbot-window"
        >
          <motion.span
            key={isOpen ? 'close' : 'chat'}
            initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18 }}
          >
            {isOpen ? <CloseSmIcon /> : <ChatIcon />}
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
});

export default ChatbotWidget;
