import { Character } from '@/app/types';
import Button from '@/components/Button';
import {
  findBestCharacterMatch,
  getCharacterById,
  getPlaceSprite,
  getPlayerCharacter,
  getScene,
  getSprite,
} from '@/utils/game';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import Asset from '../Asset';
import LoadingSpinner from '../LoadingSpinner';
import { TooltipProvider } from '../Tooltip';
import Dialog from './Dialog';
import Line from './Dialog/components/Line';
import Profile from './Dialog/components/Profile';
import UserInput from './Dialog/components/UserInput';
import EventImage from './EventImage';
import { History } from './Panels/HistoryPanel';
import InfoPanel from './Panels/InfoPanel';
import { useProject } from './ProjectContext';
import { EndBreak } from './Screens/End';
import { SceneBreak } from './Screens/Scene';
import Start from './Screens/Start';
import ShareModal from './Share';
import Stage from './Stage';

export default function Game({ actions }: { actions?: React.ReactNode }) {
  const {
    project,
    currentPlaythrough,
    updatePlaythrough,
    storyState,
    playthroughToShare,
    sharePlaythrough,
    loading,
    isHistoryOpen,
    handleShowHistory,
    mode,
    outdated,
  } = useProject();
  const [showOutdatedWarning, setShowOutdatedWarning] = useState(mode === 'edit');
  const currentLine = storyState.currentLine;
  const status = currentLine.metadata?.status;

  // Current displays
  const scene = getScene(
    currentPlaythrough?.projectSnapshot ?? project,
    storyState.currentScene.uuid,
  );
  const currentBackgroundSprite = getPlaceSprite(
    currentPlaythrough?.projectSnapshot ?? project,
    scene.placeId,
  );
  const character: Character | null =
    currentLine.type === 'narration'
      ? null
      : currentLine.type === 'player'
        ? getPlayerCharacter(currentPlaythrough?.projectSnapshot ?? project)
        : currentLine.characterId
          ? getCharacterById(project, currentLine.characterId)
          : currentLine.characterName
            ? findBestCharacterMatch(project.cartridge.characters, currentLine.characterName)
            : null;

  // Keyboard navigation for left/right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPlaythrough || status === 'waiting-on-user') return;
      if (e.key === 'ArrowRight') {
        storyState.handleNext();
      } else if (e.key === 'ArrowLeft') {
        storyState.handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPlaythrough, status, storyState]);

  return (
    <TooltipProvider>
      <div className="@container/game rounded-lg relative h-full flex bg-black justify-center overflow-hidden select-none">
        {actions}
        {loading && (
          <div className="absolute inset-0 flex flex-col justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm select-none p-4">
            <LoadingSpinner />
          </div>
        )}
        <div className="relative w-full justify-center">
          {showOutdatedWarning && outdated && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={twMerge(
                'z-[5] absolute rounded-lg flex justify-between absolute top-0 m-2 items-center p-3 gap-3',
                mode === 'edit'
                  ? 'bg-slate-200 dark:bg-slate-800 text-black font-semibold shadow-lg'
                  : 'bg-white dark:bg-slate-900',
              )}
            >
              <p className="dark:text-white">
                <a className="underline!" onClick={() => updatePlaythrough({ action: 'clear' })}>
                  Restart
                </a>{' '}
                to see latest changes.
              </p>
              <Button variant="icon" onClick={() => setShowOutdatedWarning(false)}>
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
          <AnimatePresence>
            <motion.div
              key={currentBackgroundSprite?.imageUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={twMerge('w-full h-full object-cover absolute pointer-events-none')}
            >
              <Asset
                className="w-full h-full object-cover"
                alt="Scene background"
                imageUrl={currentBackgroundSprite?.imageUrl}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {currentPlaythrough ? (
          <>
            {status === 'game-over' ? (
              <EndBreak currentLine={currentLine} setShowHistory={() => handleShowHistory(true)} />
            ) : (
              currentLine.metadata?.sceneId !== undefined && (
                <SceneBreak handleNext={storyState.handleNext} currentLine={currentLine} />
              )
            )}
            {/* Clickable overlay for advancing story - positioned above background but below UI */}
            <div
              className={twMerge(
                'absolute inset-0 z-[1]',
                status !== 'waiting-on-user' ? 'cursor-pointer' : 'pointer-events-none',
              )}
              onClick={() => {
                if (status !== 'waiting-on-user') {
                  storyState.handleNext();
                }
              }}
            />
            <div className="absolute w-full bottom-0 @3xl:max-w-5xl z-[2]">
              <Dialog
                className={twMerge(currentLine.text === '' && 'opacity-50!')}
                storyState={storyState}
                onClick={() => {
                  if (status !== 'waiting-on-user') {
                    storyState.handleNext();
                  }
                }}
                bottomChildren={<UserInput />}
              >
                {character && <Profile sprite={getSprite(character)} className="w-50" />}
                <Line
                  line={currentLine}
                  speaker={character ?? undefined}
                  storyState={storyState}
                  backgroundImageUrl={currentBackgroundSprite?.imageUrl}
                />
              </Dialog>
            </div>
            <InfoPanel />
            <Stage />
            <EventImage storyState={storyState} />
          </>
        ) : (
          <Start />
        )}

        {isHistoryOpen && (
          <History
            selectedPlaythrough={currentPlaythrough}
            onClose={() => handleShowHistory(false)}
          />
        )}
        {playthroughToShare && (
          <ShareModal
            isOpen={!!playthroughToShare}
            onClose={() => sharePlaythrough(undefined)}
            playthrough={playthroughToShare}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
