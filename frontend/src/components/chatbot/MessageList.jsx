import { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseMarkdown } from './markdownParser';

// ─── Timestamp Helper ───────────────────────────────────────────────────────
function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ─── Typing Indicator ───────────────────────────────────────────────────────
export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2 mb-3"
    >
      <BotAvatar size="sm" />
      <div className="chat-bubble bot-bubble typing-bubble">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '160ms' }} />
        <span className="typing-dot" style={{ animationDelay: '320ms' }} />
      </div>
    </motion.div>
  );
});

// ─── Bot Avatar ─────────────────────────────────────────────────────────────
export const BotAvatar = memo(function BotAvatar({ size = 'md' }) {
  const sz = size === 'sm' ? 28 : 36;
  return (
    <div
      className="bot-avatar flex-shrink-0"
      style={{ width: sz, height: sz, borderRadius: '50%' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width={sz} height={sz}>
        <circle cx="18" cy="18" r="18" fill="url(#botGrad)" />
        <rect x="11" y="10" width="14" height="10" rx="3" fill="white" fillOpacity="0.9" />
        <circle cx="15" cy="15" r="2" fill="#FF4500" />
        <circle cx="21" cy="15" r="2" fill="#FF4500" />
        <path d="M14 22 Q18 26 22 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <rect x="16" y="8" width="4" height="3" rx="1" fill="white" fillOpacity="0.6" />
        <defs>
          <linearGradient id="botGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF4500" />
            <stop offset="1" stopColor="#FFB800" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});

// ─── Message Bubble ─────────────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({ message, onQuickReply }) {
  const isBot = message.role === 'bot';
  const html = isBot ? parseMarkdown(message.content) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex items-end gap-2 mb-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {isBot && <BotAvatar size="sm" />}

      <div className={`flex flex-col gap-1 max-w-[78%] ${isBot ? '' : 'items-end'}`}>
        <div
          className={`chat-bubble ${isBot ? 'bot-bubble' : 'user-bubble'}`}
          aria-label={`${isBot ? 'Bot' : 'You'}: ${message.content}`}
        >
          {isBot ? (
            <div
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          )}
        </div>

        <span className="text-[10px] opacity-40 px-1 font-ui tabular-nums">
          {formatTime(message.timestamp)}
        </span>

        {/* Quick Replies */}
        {isBot && message.quickReplies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => onQuickReply?.(qr)}
                className="quick-reply-btn"
                aria-label={`Quick reply: ${qr}`}
              >
                {qr}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ─── Message List ────────────────────────────────────────────────────────────
export const MessageList = memo(function MessageList({ messages, isTyping, onQuickReply }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      className="chat-messages-area"
      role="log"
      aria-live="polite"
      aria-label="Conversation messages"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onQuickReply={onQuickReply} />
        ))}
        {isTyping && <TypingIndicator key="typing" />}
      </AnimatePresence>
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
});
