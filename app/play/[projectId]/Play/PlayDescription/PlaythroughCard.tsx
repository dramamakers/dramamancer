import LazyImage from '@/app/editor/components/LazyImage';
import { Playthrough } from '@/app/types';
import { useAuth } from '@/components/Auth/AuthContext';
import Button from '@/components/Button';
import Dialog from '@/components/Game/Dialog';
import Line from '@/components/Game/Dialog/components/Line';
import Sprite from '@/components/Game/Stage/components/Sprite';
import { formatNumber, formatSceneTitle, formatTimeAgo } from '@/utils/format';
import { getCharacterById, getScene, getSceneSprite, getSceneTitle } from '@/utils/game';
import { ChatBubbleOvalLeftIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

const ViewButton = memo(function ViewButton({
  readOnly,
  onClick,
}: {
  readOnly: boolean;
  onClick: () => void;
}) {
  return (
    <div className="absolute flex inset-0 items-center justify-center z-[2] bg-black/50 transition-all duration-200 opacity-0 group-hover:opacity-100">
      <Button onClick={onClick}>{readOnly ? 'View (Read-only)' : 'Play'}</Button>
    </div>
  );
});

const PlaythroughCard = memo(function PlaythroughCard({
  playthrough,
  currentPlaythrough,
}: {
  playthrough: Playthrough;
  currentPlaythrough?: Playthrough;
}) {
  const { user } = useAuth();
  const { projectId, currentLineIdx, lines, updatedAt } = playthrough;
  const router = useRouter();
  const readOnly = playthrough.userId !== user?.userId;
  const project = playthrough.projectSnapshot;

  const currentLine = lines[currentLineIdx];
  const speakerCharacter = currentLine?.characterId
    ? getCharacterById(project, currentLine.characterId)
    : null;
  const backgroundImage =
    getSceneSprite(project, playthrough.currentSceneId)?.imageUrl || '/placeholder.png';
  const displayLine = {
    ...currentLine,
    text: currentLine?.metadata?.sceneId
      ? getSceneTitle(project.cartridge.scenes, currentLine.metadata?.sceneId)
      : currentLine?.text,
  };

  const goToPlaythrough = useCallback(() => {
    router.push(`/play/${projectId}?playthroughId=${playthrough.id}`);
  }, [router, projectId, playthrough.id]);
  const lastUpdatedText = useMemo(() => formatTimeAgo(updatedAt), [updatedAt]);
  const projectTitle = project.title || 'Untitled game';
  const playthroughTitle = playthrough.title || 'Untitled playthrough';

  return (
    <div className="flex flex-col gap-2">
      <div
        className={twMerge(
          'flex gap-2 group rounded-lg! overflow-hidden! relative border border-slate-200 dark:border-slate-700 w-full aspect-3/4 justify-center items-end',
          currentPlaythrough?.id === playthrough.id && 'pointer-events-none',
        )}
      >
        {/* Playing indicator */}
        {currentPlaythrough?.id === playthrough.id && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-lg z-[3]">
            <p className="text-white rounded-md p-1 px-3 bg-black">Playing</p>
          </div>
        )}

        <div className="flex items-center gap-2 absolute top-2 right-2 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 z-[2] text-sm text-slate-600 dark:text-slate-400">
          <p className="flex items-center gap-[2px]">
            <ChatBubbleOvalLeftIcon className="w-4 h-4" />{' '}
            {formatNumber(playthrough.lines.length || 0)}
          </p>
          {playthrough.totalLikes && playthrough.totalLikes > 0 ? (
            <p className="flex items-center gap-[2px]">
              <HeartIcon className="w-4 h-4" />
              {formatNumber(playthrough.totalLikes || 0)}
            </p>
          ) : undefined}
        </div>

        {/* Background image */}
        <LazyImage
          src={backgroundImage || '/placeholder.png'}
          alt={formatSceneTitle(getScene(project, playthrough.currentSceneId)?.title) || 'Untitled'}
          fill
          className="rounded-lg overflow-hidden"
          onClick={goToPlaythrough}
        />

        {/* Character sprites */}
        {speakerCharacter && (
          <div className="absolute inset-0 flex justify-center items-center">
            <Sprite key={speakerCharacter.uuid} character={speakerCharacter} isActive={true} />
          </div>
        )}

        {/* Dialog box */}
        <Dialog className="absolute h-50 z-[2] text-sm">
          <Line line={displayLine} speaker={speakerCharacter ?? undefined} readOnly={true} />
        </Dialog>

        {/* View button */}
        <ViewButton readOnly={readOnly} onClick={goToPlaythrough} />
      </div>

      {/* Playthrough info */}
      <div className="flex flex-col">
        <p className="text-sm font-medium">
          {playthroughTitle || 'Untitled playthrough'} by{' '}
          <a href={`/users/${playthrough.userId}`} className="text-blue-500">
            {playthrough.userDisplayName || 'Anonymous'}
          </a>{' '}
          <span className="opacity-50">
            on {projectTitle} by{' '}
            <a href={`/users/${project.userId}`} className="text-blue-500">
              {project.userDisplayName || 'Anonymous'}
            </a>
          </span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 opacity-80">
          {playthrough.lines.length} lines
          <br />
          Last updated {lastUpdatedText}
        </p>
      </div>
    </div>
  );
});

export default PlaythroughCard;
