'use client';
import { Project } from '@/app/types';
import { createContext, ReactNode, useContext } from 'react';
import { useChat } from './hooks/useChat';

type ChatContextType = ReturnType<typeof useChat>;

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({
  children,
  project,
  updateProject,
}: {
  children: ReactNode;
  project: Project;
  updateProject: (updates: Partial<Project> | ((draft: Project) => void)) => void;
}) {
  const chat = useChat(project, updateProject);
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
