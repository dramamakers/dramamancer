import { END_SCENE_ID, Scene } from '@/app/types';
import { useTooltip } from '@/components/Tooltip';
import { getSceneTitle } from '@/utils/game';
import { useLocalTranslator } from '@/utils/hooks/useLocalTranslator';
import { useEffect, useMemo, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useProject } from '../../ProjectContext';
import { TriggerState } from '../../hooks/TriggerManager';

export default function RulesInfo({ isHovered }: { isHovered: boolean }) {
  const { currentPlaythrough, storyState, mode } = useProject();
  const project = currentPlaythrough?.projectSnapshot;
  const scenes = project?.cartridge.scenes || [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [recentlyConsumedItems, setRecentlyConsumedItems] = useState<Set<string>>(new Set());
  const [isOverflowing, setIsOverflowing] = useState(false);
  const previousConsumedStateRef = useRef<Record<string, boolean>>({});

  // Sort trigger entries and detect consumption changes in a single operation
  const { sortedTriggerEntries, newlyConsumedItems } = useMemo(() => {
    const entries = Object.entries(storyState.currentTriggerManager?.getAllTriggerStates() || {});
    const sorted = entries.sort(([, a], [, b]) => {
      if (a.consumed !== b.consumed) {
        return -(Number(a.consumed) - Number(b.consumed));
      }
      return -(Number(a.trigger.type === 'fallback') - Number(b.trigger.type === 'fallback'));
    });

    // Check for consumption changes
    const currentConsumedState: Record<string, boolean> = {};
    const previousConsumedState = previousConsumedStateRef.current;
    const newlyConsumed = new Set<string>();

    sorted.forEach(([triggerId, triggerState]) => {
      currentConsumedState[triggerId] = triggerState.consumed;

      // If this trigger is now consumed but wasn't before, it's newly consumed
      if (triggerState.consumed && !previousConsumedState[triggerId]) {
        newlyConsumed.add(triggerId);
      }
    });

    // Update ref for next comparison
    previousConsumedStateRef.current = currentConsumedState;

    return { sortedTriggerEntries: sorted, newlyConsumedItems: newlyConsumed };
  }, [storyState.currentTriggerManager]);

  // Update recently consumed items state only when there are actual changes
  useEffect(() => {
    if (newlyConsumedItems.size > 0) {
      setRecentlyConsumedItems(newlyConsumedItems as Set<string>);
    }
  }, [newlyConsumedItems]);

  // Clear highlights after timeout
  useEffect(() => {
    if (recentlyConsumedItems.size > 0) {
      const timeout = setTimeout(() => {
        setRecentlyConsumedItems(new Set());
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [recentlyConsumedItems]);

  // Check for overflow to conditionally show mask
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        const { scrollHeight } = scrollRef.current;
        setIsOverflowing(scrollHeight > 70); // Hardcoded assuming max height is 70px
      }
    };

    checkOverflow();

    // Check overflow when content changes
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [sortedTriggerEntries, isHovered]);

  return (
    <>
      <div
        ref={scrollRef}
        className={twMerge(
          'space-y-1 transition-all duration-300 ease-in-out [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          !isHovered &&
            isOverflowing &&
            'max-h-25 [mask-image:linear-gradient(to_top,transparent,black_50px,black_calc(100%-50px),black_100%)]',
        )}
      >
        {sortedTriggerEntries.length === 0 && (
          <p className="text-sm text-gray-600">No rules for this scene.</p>
        )}
        {sortedTriggerEntries.map(([triggerId, triggerState]) => {
          const isRecentlyConsumed = recentlyConsumedItems.has(triggerId);
          const shouldHighlight = isRecentlyConsumed;

          if (
            mode !== 'edit' &&
            !triggerState.consumed &&
            triggerState.trigger.type !== 'fallback'
          ) {
            return null;
          }

          return (
            <div
              key={triggerId}
              className={twMerge(
                'transform transition-all duration-300 ease-in-out',
                shouldHighlight && 'text-blue-800 dark:text-blue-200',
              )}
            >
              <RuleContent triggerState={triggerState} scenes={scenes} />
            </div>
          );
        })}
      </div>
    </>
  );
}

function RuleContent({ triggerState, scenes }: { triggerState: TriggerState; scenes: Scene[] }) {
  const { mode } = useProject();
  const { consumed, turnsLeft, trigger, depsSatisfied } = triggerState as TriggerState;
  const {
    translatedTexts: [condition, sceneTitle],
  } = useLocalTranslator({
    texts: [
      trigger.type === 'fallback' ? '' : trigger.condition,
      getSceneTitle(scenes, trigger.goToSceneId, trigger.endingName),
    ],
  });
  const { showTooltip, hideTooltip } = useTooltip();

  if (trigger.type === 'action' && !condition) {
    return null;
  }

  const getTooltipText = () => {
    let text = '';
    if (trigger.type === 'fallback') {
      text = `After ${turnsLeft} turn${turnsLeft === 1 ? '' : 's'}, `;
    } else {
      text = `If "${condition}", `;
    }

    if (trigger.goToSceneId) {
      if (trigger.goToSceneId === END_SCENE_ID) {
        text += `end the game`;
      } else {
        text += `go to ${sceneTitle}`;
      }
    } else {
      if (consumed || mode === 'edit') {
        text += `${trigger.narrative}`;
      } else {
        text += `??? will happen`;
      }
    }

    return text;
  };

  return (
    <div className="flex items-start">
      <p
        className={twMerge(
          'flex w-full items-center gap-1 text-sm transition-all duration-200',
          consumed ? 'line-through opacity-60' : !depsSatisfied ? 'opacity-50' : '',
        )}
        onMouseOver={() => showTooltip(getTooltipText())}
        onMouseOut={hideTooltip}
      >
        <span className="truncate w-1/2 @2xl:w-fit">
          {trigger.type === 'fallback'
            ? `(${turnsLeft} turn${turnsLeft === 1 ? '' : 's'})`
            : condition}
        </span>
        {trigger.goToSceneId && (
          <span>{trigger.goToSceneId === END_SCENE_ID ? '→ end' : `→ go to (scene)`}</span>
        )}
        <span>{!depsSatisfied && '🔒'}</span>
      </p>
    </div>
  );
}
