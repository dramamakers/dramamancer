import Button from '@/components/Button';
import { getPlayerCharacter } from '@/utils/game';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useProject } from '../../ProjectContext';

export default function UserInput() {
  const [userInput, setUserInput] = useState('');
  const { currentPlaythrough, readOnly, storyState } = useProject();
  const { redoFromLine } = storyState;
  const { projectSnapshot } = currentPlaythrough || {};

  if (!projectSnapshot) {
    return null;
  }

  const { currentLine, handleUserInput } = storyState;
  const playerCharacter = getPlayerCharacter(projectSnapshot);
  const isStaleInput = currentLine.metadata?.status !== 'waiting-on-user';

  return (
    <>
      {/* User input */}
      <AnimatePresence mode="wait">
        {currentLine.metadata?.shouldPause && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 50 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.15,
              ease: [0.4, 0.0, 0.2, 1],
              height: { duration: 0.1 },
            }}
            className={twMerge(
              'mt-2 overflow-hidden rounded-lg flex gap-2 items-center',
              readOnly && 'cursor-not-allowed pointer-events-none',
            )}
          >
            <div className="flex items-center justify-end w-full h-fit">
              <textarea
                className={twMerge(
                  'rounded-lg bg-white/70! dark:bg-slate-900/70! backdrop-blur-sm pr-14 select-none h-full w-full resize-none p-3 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:italic [scrollbar-width:none]',
                  readOnly
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : isStaleInput
                      ? 'opacity-50 cursor-pointer'
                      : '',
                )}
                value={userInput}
                maxLength={120}
                disabled={readOnly}
                onClick={() => {
                  if (currentPlaythrough && isStaleInput && confirm('Create a new timeline?')) {
                    redoFromLine();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (userInput.trim() !== '' && !readOnly && !isStaleInput) {
                      handleUserInput(userInput);
                      setUserInput('');
                    }
                  }
                }}
                onChange={(e) => setUserInput(e.target.value)}
                rows={1}
                placeholder={
                  readOnly
                    ? 'This is a view-only playthrough'
                    : currentLine.metadata?.status !== 'waiting-on-user'
                      ? 'Click to make a new timeline'
                      : `(Act) or speak as ${playerCharacter.name}`
                }
              />
              <Button
                variant="icon"
                className={twMerge(
                  'absolute hover:bg-black/10 active:bg-black/20 mr-1',
                  readOnly && 'opacity-50 pointer-events-none',
                )}
                disabled={readOnly || isStaleInput}
                onClick={() => {
                  if (!readOnly) {
                    handleUserInput(userInput);
                    setUserInput('');
                  }
                }}
              >
                <ArrowRightIcon className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
