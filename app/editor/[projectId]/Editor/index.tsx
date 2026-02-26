'use client';
import Button from '@/components/Button';
import Game from '@/components/Game';
import { FullWidthHeader } from '@/components/Header';
import { useTooltip } from '@/components/Tooltip';
import { useProjectMutations } from '@/utils/api/hooks';
import {
  ArrowsPointingOutIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  TrashIcon,
  WrenchIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ToggleSwitcher from '@/components/ToggleSwitcher';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Menu } from '../../../../components/Menu';
import { useEditorProject } from '../EditorContext';
import { CharactersList } from './Characters';
import ChatView from './Chat';
import { ChatProvider, useChatContext } from './Chat/ChatContext';
import ChatHistory from './Chat/components/ChatHistory';
import { deleteChat } from './Chat/utils/utils';
import { EditorHeader } from './EditorHeader';
import { PlacesList } from './Places';
import PlaythroughsList from './Playthroughs';
import { ScenesList } from './Scenes';
import { SettingsList } from './Settings';
import { StyleList } from './Style';
import TableOfContents from './TableOfContents';

type EditorView = 'editor' | 'chat';

// Toolbar component that uses chat context
function EditorToolbar({
  currentView,
  toggleView,
  projectId,
}: {
  currentView: EditorView;
  toggleView: (newView: EditorView) => void;
  projectId: number;
}) {
  const { showTooltip, hideTooltip } = useTooltip();
  const { currentChatId, handleNewChat, handleLoadChat, isLoading } = useChatContext();

  const handleDeleteChat = useCallback(async () => {
    if (!currentChatId) return;
    if (!confirm('Delete this chat? This cannot be undone.')) return;

    const success = await deleteChat(currentChatId);
    if (success) {
      handleNewChat();
    }
  }, [currentChatId, handleNewChat]);

  return (
    <div className="w-full flex gap-2 justify-between border-b border-slate-300 dark:border-slate-700 p-4 shrink-0">
      <div className="flex items-center gap-2">
        {/* Editor/Chat Switcher */}
        <ToggleSwitcher
          options={[
            { value: 'editor', label: 'Editor', icon: <WrenchIcon className="w-4 h-4" /> },
            { value: 'chat', label: 'Chat', icon: <ChatBubbleLeftIcon className="w-4 h-4" /> },
          ]}
          value={currentView}
          onChange={toggleView}
        />
      </div>

      {/* Right side - Chat actions (only in chat mode) */}
      {currentView === 'chat' && (
        <div className="flex items-center gap-1">
          {currentChatId !== null && (
            <Button
              variant="icon"
              onClick={() => {
                hideTooltip();
                handleNewChat();
              }}
              onMouseOver={() => showTooltip('Create a new chat')}
              onMouseOut={hideTooltip}
              disabled={isLoading}
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          )}
          <ChatHistory
            projectId={projectId}
            currentChatId={currentChatId}
            onLoadChat={handleLoadChat}
            onDeleteChat={handleNewChat}
            tooltipText="Check previous chats"
            disabled={isLoading}
          />
          <Button
            variant="icon"
            onClick={handleDeleteChat}
            onMouseOver={() => showTooltip('Delete current chat')}
            onMouseOut={hideTooltip}
            disabled={isLoading}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProjectEditor() {
  const { project, openModal, updateProject } = useEditorProject();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { deleteProject } = useProjectMutations();
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<EditorView>(
    searchParams.get('view') === 'chat' ? 'chat' : 'editor',
  );

  const toggleView = (newView: EditorView) => {
    setCurrentView(newView);
    // Update URL without navigation
    const url = new URL(window.location.href);
    if (newView === 'chat') {
      url.searchParams.set('view', 'chat');
    } else {
      url.searchParams.delete('view');
    }
    window.history.pushState({}, '', url);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950">
      <EditorHeader setIsFullscreen={setIsFullscreen} openShareModal={() => openModal('sharing')} />

      <div className="flex">
        {/* Table of contents */}
        <div className="p-4 hidden w-auto min-w-50 xl:flex overflow-y-auto z-[0] [scrollbar-width:none]">
          <TableOfContents
            isOpen={isMenuOpen}
            close={() => setIsMenuOpen(false)}
            openEditorView={() => setCurrentView('editor')}
          />
        </div>

        {/* Left hand side */}
        <div className="flex flex-col w-full relative overflow-hidden h-[calc(100vh-73px)]">
          <ChatProvider project={project} updateProject={updateProject}>
            {/* Shared toolbar with Editor/Chat switcher */}
            <EditorToolbar
              currentView={currentView}
              toggleView={toggleView}
              projectId={project.id}
            />

            {currentView === 'chat' ? (
              <div className="flex-1 overflow-hidden">
                <ChatView onSwitchToEditor={() => setCurrentView('editor')} />
              </div>
            ) : (
              <>
                {/* Scrollable editor */}
                <div className="p-4 overflow-y-auto w-full flex-1">
                  <div className="w-full flex flex-col gap-8 mb-20 max-w-5xl mx-auto">
                    <StyleList />
                    <CharactersList />
                    <PlacesList />
                    <ScenesList />
                    <SettingsList />
                    <PlaythroughsList />
                    <div className="flex flex-col gap-4 text-center">
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => {
                            openModal('config');
                          }}
                        >
                          Open game cartridge (advanced)
                        </Button>
                      </div>
                      <Button
                        variant="link"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this project?')) {
                            deleteProject(project.id);
                            window.location.href = '/landing?view=create';
                          }
                        }}
                      >
                        Delete project
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </ChatProvider>
        </div>

        {/* Right hand side, live demo */}
        <div className="hidden md:block p-4 min-w-md max-w-lg w-full relative">
          <div className="flex flex-col gap-4 h-full justify-between">
            <div className="w-full h-full bg-slate-200 rounded-lg">
              <Game
                actions={
                  <div className="absolute top-0 right-0 p-2 z-[2]">
                    <Button variant="icon-filled" onClick={() => setIsFullscreen(true)}>
                      <ArrowsPointingOutIcon className="w-6 h-6" />
                    </Button>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>

      <Menu />

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <div className="absolute inset-0 z-[3]">
            <FullWidthHeader
              left={
                <div className="flex items-center gap-2">
                  <h1 className="text-lg">{project?.title || 'Untitled game'}</h1>
                  <span className="text-sm text-slate-500 bg-slate-300 dark:bg-slate-800 px-2 py-1 rounded">
                    Preview
                  </span>
                </div>
              }
              right={
                <Button variant="icon" onClick={() => setIsFullscreen(false)}>
                  <XMarkIcon className="w-5 h-5" />
                </Button>
              }
              className="bg-slate-100 dark:bg-slate-950"
            />

            {/* Game area */}
            <div className="flex-1 overflow-hidden pointer-events-auto p-4 bg-slate-200 dark:bg-slate-950 h-[calc(100%-60px)]">
              <Game />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
