import Button from '@/components/Button';
import { getPlace, getPlayerCharacter, getScene } from '@/utils/game';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useProject } from '../../ProjectContext';
import RulesInfo from './RulesInfo';

export default function InfoPanel() {
  const { project, currentPlaythrough, storyState, mode } = useProject();
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine if there are any visible rules
  const hasVisibleRules = useMemo(() => {
    const triggerStates = storyState.currentTriggerManager?.getAllTriggerStates() || {};
    const entries = Object.values(triggerStates);

    if (entries.length === 0) return false;

    // Check if any rules would be visible based on the filtering logic
    return entries.some((triggerState) => {
      if (mode === 'edit') return true;
      return triggerState.consumed || triggerState.trigger.type === 'fallback';
    });
  }, [storyState.currentTriggerManager, mode]);

  const getAreaName = () => {
    if (!currentPlaythrough) return '';
    if (currentPlaythrough.projectSnapshot && currentPlaythrough.currentSceneId) {
      const scene = getScene(currentPlaythrough.projectSnapshot, currentPlaythrough.currentSceneId);

      if (scene.placeId) {
        return getPlace(currentPlaythrough.projectSnapshot, scene.placeId).name;
      }
      return scene.title;
    }
  };

  const areaName = getAreaName();
  const player = getPlayerCharacter(currentPlaythrough?.projectSnapshot || project);

  return (
    <div
      className={twMerge(
        'p-3 m-3 absolute top-0 left-0 z-[2] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg transition-[height] duration-300 ease-in-out overflow-hidden max-w-[80%] w-fit',
        isHovered ? 'h-fit overflow-y-auto' : 'max-h-35',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <p>
          You are <b>{player.name}</b> in{' '}
          <AnimatePresence mode="wait">
            <motion.b
              key={areaName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {areaName}
            </motion.b>
          </AnimatePresence>
        </p>
        {hasVisibleRules && (
          <Button
            variant="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand rules' : 'Collapse rules'}
          >
            {isCollapsed ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronUpIcon className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
      {!isCollapsed && hasVisibleRules && <RulesInfo isHovered={isHovered} />}
    </div>
  );
}
