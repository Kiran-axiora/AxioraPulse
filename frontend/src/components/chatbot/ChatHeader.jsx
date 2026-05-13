import { memo } from 'react';
import { motion } from 'framer-motion';
import { BotAvatar } from './MessageList';

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const MinimizeIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MaximizeIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ClearIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" /><line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" /><line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
  </svg>
);

// ─── Online Status Dot ────────────────────────────────────────────────────────
const OnlineDot = () => (
  <span className="online-dot" aria-label="Online" role="status" title="Online">
    <span className="online-dot-inner" />
  </span>
);

// ─── ChatHeader ───────────────────────────────────────────────────────────────
const ChatHeader = memo(function ChatHeader({
  isMinimized,
  theme,
  onMinimize,
  onClose,
  onClear,
  onToggleTheme,
}) {
  return (
    <div className="chat-header" role="banner" aria-label="Chat header">
      {/* Left: Avatar + Info */}
      <div className="chat-header-left">
        <div className="chat-header-avatar-wrap">
          <BotAvatar size="md" />
          <OnlineDot />
        </div>
        <div className="chat-header-info">
          <span className="chat-header-name">Axiora Pulse</span>
          <span className="chat-header-status">
            <span className="status-pulse" aria-hidden="true" />
            Online · Always ready
          </span>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="chat-header-controls" role="toolbar" aria-label="Chat controls">
        {/* Close */}
        <motion.button
          id="chatbot-close-btn"
          className="header-ctrl-btn close-btn"
          onClick={onClose}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close chat"
          title="Close"
        >
          <CloseIcon />
        </motion.button>
      </div>
    </div>
  );
});

export default ChatHeader;
