import { useAuth } from '@/components/Auth/AuthContext';
import Button from '@/components/Button';
import { useProject } from '@/components/Game/ProjectContext';
import { FullWidthHeader } from '@/components/Header';
import { useTooltip } from '@/components/Tooltip/TooltipContext';
import User from '@/components/User';
import Visibility from '@/components/Visibility';
import { useProjectLikes, useProjectMutations } from '@/utils/api/hooks';
import { formatTimeAgo } from '@/utils/format';
import { useLocalTranslator } from '@/utils/hooks/useLocalTranslator';
import { ArrowLeftIcon, HeartIcon, PencilIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function PlayHeader() {
  const { project, currentPlaythrough, readOnly } = useProject();
  const { showTooltip, hideTooltip } = useTooltip();
  const router = useRouter();
  const { user } = useAuth();
  const { remixProject, loading } = useProjectMutations();
  const { isProjectLiked, toggleProjectLike } = useProjectLikes();
  const {
    translatedTexts: [title],
  } = useLocalTranslator({ texts: [project.title] });
  const isLiked = isProjectLiked(project.id);

  if (!project) {
    return null;
  }

  return (
    <FullWidthHeader
      variant="2/3"
      left={
        <div className="flex gap-2 items-center">
          <Button
            variant="icon"
            onClick={() => {
              router.push('/landing');
            }}
            className="hover:bg-slate-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <h1 className="font-medium">{title || 'Untitled game'}</h1>
          <Visibility visibility={project.settings.visibility} />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            by{' '}
            <a href={`/users/${encodeURIComponent(project.userId)}`} className="underline">
              {project.userDisplayName || 'Anonymous'}
            </a>
          </p>
        </div>
      }
      right={
        <div className="flex md:w-fit w-full items-center justify-center md:justify-end gap-2">
          {user && (
            <>
              {project.userId === user?.userId ? (
                <Button
                  variant="icon"
                  className="flex items-center gap-2 px-3"
                  onClick={() => router.push(`/editor/${project.id}`)}
                >
                  Edit game <PencilIcon className="w-4 h-4" />
                </Button>
              ) : project.settings.remixable ? (
                <Button
                  variant="icon"
                  className="flex items-center gap-2 px-3"
                  disabled={loading}
                  onClick={async () => {
                    try {
                      const result = await remixProject(project.id);
                      if (result?.id) {
                        router.push(`/editor/${result.id}`);
                      }
                    } catch (error) {
                      console.error('Failed to remix project:', error);
                    }
                  }}
                  onMouseEnter={() => showTooltip('Make a copy of this game to edit')}
                  onMouseLeave={() => hideTooltip()}
                >
                  Remix this game
                  <PencilIcon className="w-4 h-4" />
                </Button>
              ) : null}
              <Button
                variant="icon"
                onClick={() => toggleProjectLike(project.id)}
                onMouseEnter={() => showTooltip(isLiked ? 'Unlike this game' : 'Like this game')}
                onMouseLeave={() => hideTooltip()}
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-5 h-5" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
              </Button>
            </>
          )}
          <User />
        </div>
      }
      className="bg-white dark:bg-slate-950"
    >
      {currentPlaythrough && (
        <>
          {!readOnly ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your playthrough was last saved {formatTimeAgo(currentPlaythrough.updatedAt)}.
            </p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Viewing a playthrough by {currentPlaythrough.userDisplayName || 'Anonymous'} last
              saved {formatTimeAgo(currentPlaythrough.updatedAt)}.
            </p>
          )}
        </>
      )}
    </FullWidthHeader>
  );
}
