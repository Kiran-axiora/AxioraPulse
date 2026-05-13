import { memo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

// ─── Send Icon ───────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={16}
    height={16}
    aria-hidden="true"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ─── ChatInput ───────────────────────────────────────────────────────────────
const ChatInput = memo(function ChatInput({
  value,
  onChange,
  onSend,
  isTyping,
  inputRef,
  theme,
}) {
  // Always call useRef unconditionally (Rules of Hooks)
  const internalRef = useRef(null);
  const textareaRef = inputRef ?? internalRef;

  const handleKeyDown = useCallback(
    (e) => {
      // Shift+Enter → newline, plain Enter → send
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !isTyping) onSend();
      }
    },
    [value, isTyping, onSend]
  );

  const handleInput = useCallback(
    (e) => {
      onChange(e.target.value);
      // Auto-grow textarea (max ~5 rows)
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    },
    [onChange]
  );

  const handlePaste = useCallback((e) => {
    // Small delay to let the value update before resizing
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
    }, 0);
  }, [textareaRef]);

  const canSend = value.trim().length > 0 && !isTyping;

  return (
    <div className={`chat-input-area ${theme}`} role="form" aria-label="Send a message">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          id="chatbot-input"
          className="chat-textarea"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Type a message… (Shift+Enter for new line)"
          rows={1}
          disabled={isTyping}
          aria-label="Message input"
          aria-multiline="true"
          autoComplete="off"
          spellCheck="true"
        />
        <motion.button
          id="chatbot-send-btn"
          className={`chat-send-btn ${canSend ? 'active' : 'inactive'}`}
          onClick={() => onSend()}
          disabled={!canSend}
          whileTap={{ scale: canSend ? 0.88 : 1 }}
          whileHover={{ scale: canSend ? 1.06 : 1 }}
          aria-label="Send message"
          title="Send (Enter)"
          transition={{ duration: 0.12 }}
        >
          <SendIcon />
        </motion.button>
      </div>
      <p className="chat-input-hint">
        Powered by <span className="font-ui font-semibold">Axiora </span>
      </p>
    </div>
  );
});

export default ChatInput;
