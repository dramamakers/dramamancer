'use client';
import Button from '@/components/Button';
import { PencilIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useChatContext } from './ChatContext';
import Bubble from './components/Bubble';
import InitialSuggestions from './components/InitialSuggestions';
import { InitialSuggestion } from './suggestions';

interface ChatViewProps {
  onSwitchToEditor?: () => void;
}

type SelectedMode = 'create' | 'edit';

export default function ChatView({ onSwitchToEditor }: ChatViewProps) {
  const {
    state,
    messages,
    isLoading,
    error,
    setError,
    sendMessage,
    currentChatId,
    handleImageUpload,
  } = useChatContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const lastUserMessageRef = useRef<string>('');

  // Current mode is derived from state type
  const currentMode: SelectedMode = state.type === 'editing' ? 'edit' : 'create';

  const handleSendMessage = useCallback(() => {
    if (isLoading) return;

    const trimmedInput = input.trim();
    lastUserMessageRef.current = trimmedInput || '';

    // Send message with the current mode
    // The sendMessage function will handle the mode-based logic
    sendMessage(trimmedInput, currentMode);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, sendMessage, currentMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleRetry = useCallback(() => {
    if (lastUserMessageRef.current && !isLoading) {
      setError(null);
      sendMessage(lastUserMessageRef.current, currentMode);
    }
  }, [isLoading, sendMessage, setError, currentMode]);

  // Handle idea toggle - append/remove from input field
  const handleIdeaToggle = useCallback(
    (ideaText: string) => {
      const currentInput = input;
      // Check if the idea text is already in the input
      if (currentInput.includes(ideaText)) {
        // Remove it
        const newInput = currentInput.replace(ideaText, '').trim();
        setInput(newInput);
      } else {
        // Append it
        const separator = currentInput.trim() ? '\n' : '';
        setInput(currentInput + separator + ideaText);
      }
    },
    [input],
  );

  // Handle example click - populate input field
  const handleExampleClick = useCallback(
    (exampleText: string) => {
      if (isLoading) return;
      setInput(exampleText);
    },
    [isLoading],
  );

  // Handle initial suggestion click - fill input and image
  const handleSuggestionClick = useCallback(
    (suggestion: InitialSuggestion) => {
      if (isLoading) return;
      // Replace input with suggestion text
      setInput(suggestion.text);
      // Only replace image if:
      // - No image exists (null or empty preview), OR
      // - Current image is from a suggestion (not user's own image)
      const hasUserImage = state.image?.preview && !state.image.fromSuggestionId;
      if (!hasUserImage) {
        handleImageUpload({
          data: '',
          mediaType: '',
          preview: suggestion.imageUrl,
          url: suggestion.imageUrl,
          fromSuggestionId: suggestion.id,
        });
      }
    },
    [isLoading, state.image, handleImageUpload],
  );

  // Scroll to the bottom when new messages appear or loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className={twMerge('flex gap-4 justify-between px-4 pb-4 w-full h-full overflow-hidden')}>
      <div className="w-full flex flex-col h-full">
        <div className="h-full w-full flex flex-col gap-4 overflow-y-auto [scrollbar-width:none]">
          <motion.div
            key={currentChatId || 'new'}
            className="flex flex-col gap-4 animate-in fade-in duration-300 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {messages.map((message, index) => {
              // Only the latest message with ideas should be reactive
              const isLatestMessageWithIdeas =
                index === messages.length - 1 ||
                !messages
                  .slice(index + 1)
                  .some((m) => m.actions?.some((a) => a.type === 'idea-button'));

              return (
                <Bubble
                  key={index}
                  message={message}
                  onIdeaToggle={handleIdeaToggle}
                  onExampleClick={handleExampleClick}
                  onSwitchToEditor={onSwitchToEditor}
                  currentInput={isLatestMessageWithIdeas ? input : undefined}
                />
              );
            })}
            {isLoading && (
              <div className="flex justify-start items-start gap-2">
                <Image
                  src="/featured/cat.png"
                  alt="Assistant"
                  width={32}
                  height={32}
                  className="rounded-full shrink-0"
                />
                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-3 max-w-xs animate-pulse">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                  </div>
                  <div className="flex gap-2">
                    {lastUserMessageRef.current && (
                      <Button
                        onClick={handleRetry}
                        disabled={isLoading}
                        className="text-sm py-1 px-3"
                      >
                        Retry
                      </Button>
                    )}
                    <button
                      onClick={() => setError(null)}
                      className="text-red-500 hover:text-red-700 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          <div ref={messagesEndRef} />
        </div>
        {/* Initial suggestions - only show in awaiting-image state */}
        {state.type === 'awaiting-image' && (
          <div className="mb-2">
            <InitialSuggestions onSuggestionClick={handleSuggestionClick} />
          </div>
        )}

        {/* Input area */}
        <div className="relative w-full">
          <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                currentMode === 'create'
                  ? 'Describe your game idea...'
                  : "Describe what you'd like to change..."
              }
              disabled={isLoading}
              className="w-full p-3 resize-none focus:outline-none text-slate-900 dark:text-slate-100 bg-transparent!"
              rows={3}
            />

            {/* Bottom bar with mode selector and send button - inside input area */}
            <div className="px-2 pb-2 flex justify-between items-center">
              {/* Mode indicator (left) */}
              <div
                className={twMerge(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm',
                  currentMode === 'create'
                    ? 'bg-gradient-to-b from-blue-500/20 to-cyan-500/30 text-blue-700 dark:from-blue-400/20 dark:to-cyan-400/30 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
                )}
              >
                {currentMode === 'create' ? (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    <span>Create</span>
                  </>
                ) : (
                  <>
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit</span>
                  </>
                )}
              </div>

              {/* Send button (right) */}
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className={twMerge(
                  'flex gap-1 px-2 py-1 rounded-md text-sm transition-colors',
                  'text-slate-400 dark:text-slate-500 cursor-pointer',
                  'hover:text-slate-600 dark:hover:text-slate-300',
                  isLoading && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span className="text-xs mt-[5px]">↵</span>
                <span>enter to submit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
