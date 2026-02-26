import { getPlayerCharacter } from '@/utils/game';
import { AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import { useProject } from '../ProjectContext';
import Sprite from './components/Sprite';
import { useStage } from './hooks/useStage';

export default function Stage() {
  const { project, currentPlaythrough, storyState } = useProject();
  const { left, right, center } = useStage();
  const stageRef = useRef<HTMLDivElement>(null);

  const currentLine = storyState.currentLine;
  if (!currentLine.text) {
    return null; // do not render if current line is not fetched or so.
  }
  const currentSpeaker =
    currentLine.type === 'player'
      ? getPlayerCharacter(currentPlaythrough?.projectSnapshot ?? project).name
      : currentLine.characterName;

  if (!currentPlaythrough) {
    return null;
  }

  if (center && (!left || !right)) {
    return (
      <div
        ref={stageRef}
        className="pointer-events-none absolute bottom-0 flex justify-center items-center h-full w-full"
      >
        {/* Compact mode sprites (shown in narrow containers) */}
        <div className="relative bottom-[-70px]">
          <AnimatePresence mode="wait">
            {center && (
              <Sprite
                key={`center-${center.name}`}
                character={center}
                isActive={currentSpeaker === center.name}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      className="pointer-events-none absolute bottom-0 flex justify-center items-center h-full w-full"
    >
      {/* Compact mode sprites (shown in narrow containers) */}
      <div className="@2xl:hidden w-full relative bottom-[-70px]">
        <AnimatePresence mode="wait">
          {center && (
            <div className="w-full relative flex justify-center items-center">
              <Sprite
                key={`center-${center.name}`}
                character={center}
                isActive={currentSpeaker === center.name}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Wide mode sprites (shown in large containers) */}
      <div className="@2xl:flex hidden justify-between items-center h-full w-full max-w-4xl relative bottom-[-70px]">
        <AnimatePresence>
          {left && (
            <div className="w-1/2 relative flex justify-center items-center">
              <Sprite
                key={`left-${left.name}`}
                character={left}
                isActive={currentSpeaker === left.name}
              />
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {right && (
            <div className="w-1/2 relative flex justify-center items-center">
              <Sprite
                key={`right-${right.name}`}
                character={right}
                isActive={currentSpeaker === right.name}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
