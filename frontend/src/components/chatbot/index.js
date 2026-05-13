/**
 * Axiora AI Chatbot Widget — Public API
 *
 * Usage:
 *   import ChatbotWidget from '@/components/chatbot';
 *   import { useChatbot } from '@/components/chatbot';
 */

export { default } from './ChatbotWidget';
export { default as ChatbotWidget } from './ChatbotWidget';
export { default as ChatWindow } from './ChatWindow';
export { default as ChatHeader } from './ChatHeader';
export { default as ChatInput } from './ChatInput';
export { MessageList, TypingIndicator, BotAvatar } from './MessageList';
export { useChatbot } from './useChatbot';
export { parseMarkdown } from './markdownParser';
