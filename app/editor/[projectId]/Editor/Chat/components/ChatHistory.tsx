'use client';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useTooltip } from '@/components/Tooltip';
import { useChatList } from '@/utils/api/hooks';
import { ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { deleteChat } from '../utils/utils';

interface ChatHistoryProps {
  projectId: number;
  currentChatId: number | null;
  onLoadChat: (chatId: number) => void;
  onDeleteChat?: (chatId: number) => void;
  tooltipText?: string;
  disabled?: boolean;
}

export interface ChatHistoryHandle {
  refresh: () => void;
}

const ChatHistory = ({
  projectId,
  currentChatId,
  onLoadChat,
  onDeleteChat,
  tooltipText = 'View older chats',
  disabled = false,
}: ChatHistoryProps) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<number | null>(null);
  const { data: chatList = [], refetch } = useChatList(projectId);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleChatClick = (chatId: number) => {
    onLoadChat(chatId);
    setIsModalOpen(false);
  };

  const handleDeleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this chat? This cannot be undone.')) {
      return;
    }

    const success = await deleteChat(chatId);
    if (success) {
      // Refresh the chat list
      refetch();

      // If we deleted the current chat, notify parent
      if (chatId === currentChatId && onDeleteChat) {
        onDeleteChat(chatId);
      }
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    refetch();
  };

  return (
    <>
      <Button
        variant="icon"
        onClick={handleOpenModal}
        onMouseOver={() => {
          showTooltip(tooltipText);
        }}
        onMouseOut={hideTooltip}
        disabled={disabled}
      >
        <ClockIcon className="w-4 h-4" />
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chat History"
        subtitle={`${chatList.length} chat${chatList.length !== 1 ? 's' : ''} for this project`}
        size="sm"
      >
        <div className="flex flex-col gap-2">
          {chatList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No chats yet</div>
          ) : (
            chatList.map((chat) => {
              const isCurrent = chat.id === currentChatId;
              const isHovered = hoveredChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  <button
                    onClick={() => !isCurrent && handleChatClick(chat.id)}
                    disabled={isCurrent}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg border transition-colors
                      ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-default'
                          : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex flex-col items-start gap-1 flex-1 min-w-0 pr-8">
                      <span className="text-sm text-slate-600 dark:text-slate-300 truncate w-full text-left">
                        {chat.lastMessage}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Updated {formatDate(chat.updatedAt)} • Chat {chat.id}
                        {isCurrent && ' • (Current chat)'}
                      </span>
                    </div>
                  </button>

                  {isHovered && (
                    <Button
                      variant="icon"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete chat"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </>
  );
};

ChatHistory.displayName = 'ChatHistory';

export default ChatHistory;
