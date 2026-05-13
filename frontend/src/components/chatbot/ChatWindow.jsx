import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import { MessageList } from './MessageList';
import ChatInput from './ChatInput';

// ─── Error Banner ─────────────────────────────────────────────────────────────
const ErrorBanner = memo(function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <motion.div
      className="chat-error-banner"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      role="alert"
      aria-live="assertive"
    >
      <span>⚠️ {message}</span>
      <button
        className="chat-error-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </motion.div>
  );
});

// ─── Window animation variants ────────────────────────────────────────────────
const windowVariants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 24,
    transformOrigin: 'bottom right',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 24,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

const bodyVariants = {
  open: {
    height: 'var(--chat-body-height)',
    opacity: 1,
    transition: { type: 'spring', stiffness: 380, damping: 32 },
  },
  minimized: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.22, ease: 'easeInOut' },
  },
};

// ─── ChatWindow ───────────────────────────────────────────────────────────────
const ChatWindow = memo(function ChatWindow({
  isOpen,
  isMinimized,
  theme,
  messages,
  input,
  isTyping,
  error,
  inputRef,
  position = 'bottom-right',
  onClose,
  onMinimize,
  onToggleTheme,
  onClearHistory,
  onInputChange,
  onSend,
  onQuickReply,
  onDismissError,
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 500;
  const origin = position === 'bottom-left' ? 'bottom left' : 'bottom right';

  const responsiveVariants = {
    hidden: {
      opacity: 0,
      scale: isMobile ? 1 : 0.88,
      y: isMobile ? 100 : 24,
      transformOrigin: origin,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: isMobile ? 400 : 340, damping: isMobile ? 35 : 28 },
    },
    exit: {
      opacity: 0,
      scale: isMobile ? 1 : 0.88,
      y: isMobile ? 100 : 24,
      transition: { duration: 0.18, ease: 'easeIn' },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="chatbot-window"
          className={`chat-window ${theme} ${isMobile ? 'full-screen' : ''}`}
          variants={responsiveVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="Axiora AI Chat"
          style={{ '--chat-body-height': '380px' }}
        >
          {/* Header */}
          <ChatHeader
            isMinimized={isMinimized}
            theme={theme}
            onClose={onClose}
            onMinimize={onMinimize}
            onClear={onClearHistory}
            onToggleTheme={onToggleTheme}
          />

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <ErrorBanner message={error} onDismiss={onDismissError} />
            )}
          </AnimatePresence>

          {/* Body — collapses when minimized */}
          <motion.div
            className="chat-body"
            variants={bodyVariants}
            animate={isMinimized ? 'minimized' : 'open'}
            initial={false}
            style={{ overflow: 'hidden' }}
          >
            {/* Messages */}
            <MessageList
              messages={messages}
              isTyping={isTyping}
              onQuickReply={onQuickReply}
            />

            {/* Input */}
            <ChatInput
              value={input}
              onChange={onInputChange}
              onSend={onSend}
              isTyping={isTyping}
              inputRef={inputRef}
              theme={theme}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default ChatWindow;
