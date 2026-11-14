import React, { useState, useEffect } from 'react';
import { aiApi } from '../../api/aiApi';
import { AIChatHeader } from './AIChatHeader';
import { AIMessageList } from './AIMessageList';
import { AIChatInput } from './AIChatInput';
import { AIErrorState } from './AIErrorState';

export const AIAssistantPanel = ({ isOpen, onClose, currentQueueId = null }) => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const data = await aiApi.sendMessage({
        message: text,
        conversationId,
        queueId: currentQueueId,
      });

      if (data?.success) {
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
        if (data.metadata?.isConfigured !== undefined) {
          setIsConfigured(data.metadata.isConfigured);
        }

        const assistantMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          metadata: data.metadata,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(data?.message || 'Failed to get response from AI Copilot');
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to communicate with AI Copilot. Please check your network connection.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="QueuePro AI Assistant"
      className="fixed bottom-4 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-[430px] h-[calc(100vh-6rem)] sm:h-[620px] max-h-[700px] rounded-3xl bg-[#050606]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80 flex flex-col z-50 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <AIChatHeader
        onNewConversation={handleNewConversation}
        onClose={onClose}
        isConfigured={isConfigured}
      />

      {/* Error banner if present */}
      <AIErrorState error={error} onRetry={() => error && handleSend(messages[messages.length - 1]?.content || '')} />

      {/* Message Area */}
      <AIMessageList
        messages={messages}
        isLoading={isLoading}
        onSelectPrompt={handleSend}
      />

      {/* Input Footer */}
      <AIChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
};
