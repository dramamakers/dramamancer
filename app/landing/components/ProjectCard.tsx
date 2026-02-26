import { Project } from '@/app/types';
import { formatNumber } from '@/utils/format';
import { getThumbnailImageUrl } from '@/utils/game';
import { useLocalTranslator } from '@/utils/hooks/useLocalTranslator';
import { ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import LazyImage from '../../editor/components/LazyImage';

export default function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();

  const onClick = () => {
    router.push(`/play/${project.id}`);
  };

  const {
    translatedTexts: [title, shortDescription],
  } = useLocalTranslator({
    texts: [project.title, project.settings.shortDescription],
  });

  return (
    <div className="flex flex-col gap-2">
      <a
        className="relative w-full aspect-[3/2] overflow-hidden rounded-lg cursor-pointer hover:brightness-105 transition-all duration-300"
        href={`/play/${project.id}`}
      >
        {project.settings.visibility === 'private' ? (
          <div className="flex items-center gap-2 absolute top-2 left-2 bg-slate-500 text-white rounded-lg px-2 py-1 z-[1] text-sm">
            <p className="flex items-center gap-[2px]">Draft</p>
          </div>
        ) : project.settings.visibility === 'unlisted' ? (
          <div className="flex items-center gap-2 absolute top-2 left-2 bg-slate-500 text-white rounded-lg px-2 py-1 z-[1] text-sm">
            <p className="flex items-center gap-[2px]">Unlisted</p>
          </div>
        ) : undefined}

        <div className="flex items-center gap-2 absolute top-2 right-2 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 z-[1] text-sm text-slate-600 dark:text-slate-400">
          <p className="flex items-center gap-[2px]">
            <ChatBubbleOvalLeftIcon className="w-4 h-4" /> {formatNumber(project.totalLines || 0)}
          </p>
          {project.totalLikes && project.totalLikes > 0 ? (
            <p className="flex items-center gap-[2px]">
              <HeartIcon className="w-4 h-4" />
              {formatNumber(project.totalLikes)}
            </p>
          ) : undefined}
        </div>
        <LazyImage
          src={getThumbnailImageUrl(project)}
          width={300}
          height={300}
          onClick={onClick}
          className="rounded-lg overflow-hidden pointer-events-none"
          alt={project.title}
        />
      </a>
      <div>
        <h1 className="cursor-pointer font-medium truncate" onClick={onClick} title={project.title}>
          {title || 'Untitled game'}
        </h1>
        <div className="text-sm text-slate-500">
          <p className="truncate" title={shortDescription || ''}>
            {shortDescription}
          </p>
          <p>{project.settings.genre}</p>
          <a
            href={`/users/${encodeURIComponent(project.userId)}`}
            className="truncate text-slate-500!"
          >
            {project.userDisplayName || 'Anonymous'}
          </a>
        </div>
      </div>
    </div>
  );
}
