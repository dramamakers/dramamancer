import { getCroppedSpriteStyle } from '@/app/constants';
import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import Button from '@/components/Button';
import { Cassette } from '@/components/CassetteCard';
import { useToastStore } from '@/store/toast';
import { getPlayerCharacter, getSprite, getThumbnailImageUrl } from '@/utils/game';
import { LinkIcon, PlayIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

export default function SharingModal() {
  const { activeModal, closeModal, project, updateProject } = useEditorProject();
  const { addToast } = useToastStore();
  const thumbnailImageUrl = getThumbnailImageUrl(project);

  if (!activeModal || activeModal.modal !== 'sharing') return null;
  const { settings, title, id } = project;
  const shareUrl = `${window.location.origin}/play/${id}`;
  const playerCharacter = getPlayerCharacter(project);
  const playerCharacterImageUrl = getSprite(playerCharacter).imageUrl;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[5]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="fixed inset-0 bg-black/50"
          onClick={closeModal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-[1]">
          <motion.div
            className="flex flex-col relative w-full max-w-xl pointer-events-auto"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
              duration: 0.4,
            }}
          >
            {/* Cassette */}
            <motion.div
              className="absolute z-[1] top-[10px] left-[10px] scale-180 filter drop-shadow-[0_0_36px_rgba(255,255,255,0.9)]"
              initial={{ y: -10, opacity: 0, rotate: -10 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: 'spring',
                damping: 20,
                stiffness: 300,
              }}
            >
              <Cassette imageUrl={thumbnailImageUrl} />
            </motion.div>

            {/* Background */}
            <motion.div
              className="flex-1 w-full rounded-lg w-2xl overflow-hidden text-right relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex flex-col gap-4 p-10 items-end relative min-h-[200px] bg-white dark:bg-slate-900">
                <Image
                  className="absolute inset-0 blur-sm scale-150 opacity-50"
                  src={thumbnailImageUrl}
                  alt="background"
                  fill
                  style={{
                    objectFit: 'cover',
                  }}
                />

                {/* Content */}
                <motion.div
                  className="flex flex-col max-w-[45%] gap-2 relative"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <p className="text-3xl font-bold">{title || 'Untitled game'}</p>
                    <p className="text-md">{settings.shortDescription}</p>
                  </motion.div>
                  <motion.p
                    className="opacity-80"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 0.5 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    Created with Dramamancer
                  </motion.p>
                </motion.div>
              </div>

              <div className="flex justify-between gap-4 p-4 bg-white dark:bg-slate-900 relative">
                {/* Authoring info */}
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  {playerCharacterImageUrl && (
                    <div className="relative h-10 w-10 rounded-full overflow-hidden">
                      <Image
                        src={playerCharacterImageUrl}
                        alt="avatar"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                        style={{
                          ...getCroppedSpriteStyle(getSprite(playerCharacter)),
                        }}
                        width={32}
                        height={32}
                      />
                    </div>
                  )}
                  <span className="flex gap-1">
                    By
                    <a href={`/users/${project.userId}`} className="underline!">
                      {project.userDisplayName || 'Anonymous'}
                    </a>
                  </span>
                </motion.div>

                {/* Share buttons */}
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <AnimatePresence>
                    {project.settings.visibility === 'public' ? (
                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            className="px-10 py-2 text-lg flex items-center gap-2"
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              addToast('Link copied to clipboard', 'success');
                            }}
                          >
                            Share
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            className="px-10 py-2 text-lg flex items-center gap-2"
                            onClick={() => {
                              window.open(shareUrl, '_blank');
                            }}
                          >
                            Play <PlayIcon className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    ) : (
                      <Button
                        className="px-10 py-2 text-lg flex items-center gap-2 bg-gradient-to-b from-purple-500/20 to-violet-500/30 text-purple-700 hover:from-purple-500/30 hover:to-violet-500/40 dark:from-purple-400/20 dark:to-violet-400/30 dark:text-purple-300"
                        onClick={() => {
                          updateProject((draft) => {
                            draft.settings.visibility = 'public';
                          });
                          addToast('Game published', 'success');
                        }}
                      >
                        Publish your game <RocketLaunchIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
