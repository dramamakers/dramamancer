'use client';
import { useProject } from '@/components/Game/ProjectContext';
import { formatNumber, formatTimeAgo } from '@/utils/format';
import { useLocalTranslator } from '@/utils/hooks/useLocalTranslator';
import { BookOpenIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function Description() {
  const { project } = useProject();
  const {
    translatedTexts: [title, longDescription],
  } = useLocalTranslator({
    texts: [
      project.title || 'Untitled game',
      project.settings.longDescription || 'No description provided',
    ],
  });

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="flex justify-between leading-tight">
          <div>
            <h1 className="font-medium text-lg">{title}</h1>
            <p>
              by{' '}
              <a href={`/users/${project.userId}`} className="underline">
                {project.userDisplayName || 'Anonymous'}
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <p>
              <span className="opacity-50">Created:</span> {formatTimeAgo(project?.createdAt)}
            </p>
            <p>
              <span className="opacity-50">Last updated:</span> {formatTimeAgo(project?.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 opacity-80">
          <p className="flex items-center gap-1">
            <BookOpenIcon className="w-4 h-4" />
            {project.settings.genre || 'No genre'}
          </p>
          <p className="flex items-center gap-1">
            <ChatBubbleOvalLeftIcon className="w-4 h-4" />
            {formatNumber(project.totalLines || 0)} lines generated
          </p>
          {project.totalLikes ? (
            <p className="flex items-center gap-1">
              <HeartSolidIcon className="w-4 h-4" />
              {formatNumber(project.totalLikes || 0)} like{project.totalLikes === 1 ? '' : 's'}
            </p>
          ) : undefined}
        </div>
      </div>
      {project.settings.longDescription && (
        <div>
          <p className="opacity-75">Description</p>
          <div>
            <p className="whitespace-pre-wrap">{longDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
}
