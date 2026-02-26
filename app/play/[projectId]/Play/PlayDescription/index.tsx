import ProjectCard from '@/app/landing/components/ProjectCard';
import { Playthrough } from '@/app/types';
import { useAuth } from '@/components/Auth/AuthContext';
import Button from '@/components/Button';
import FeatheredScroll from '@/components/FeatheredScroll';
import { useProject } from '@/components/Game/ProjectContext';
import {
  useLazyPlaythroughsForProject,
  useLazyPublicPlaythroughsForProject,
  useRelatedProjects,
} from '@/utils/api/hooks';
import { useCallback, useEffect, useState } from 'react';
import Info from './Info';
import PlaythroughCard from './PlaythroughCard';

export default function PublicPlaythroughsList() {
  const { project, currentPlaythrough } = useProject();
  const projectId = project.id;
  const { user } = useAuth();
  const { fetchMore: fetchMoreOwned } = useLazyPlaythroughsForProject(projectId);
  const { fetchMore: fetchMoreCommunity } = useLazyPublicPlaythroughsForProject(projectId);
  const genre = project.settings.genre;
  const { data: relatedProjects } = useRelatedProjects(project.id, genre);

  const [ownedPlaythroughs, setOwnedPlaythroughs] = useState<Playthrough[]>([]);
  const [communityPlaythroughs, setCommunityPlaythroughs] = useState<Playthrough[]>([]);
  const [loadingOwned, setLoadingOwned] = useState(false);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [hasMoreOwned, setHasMoreOwned] = useState(true);
  const [hasMoreCommunity, setHasMoreCommunity] = useState(true);
  const pageSize = 20;

  // Load initial owned playthroughs
  useEffect(() => {
    if (!projectId || !user) return;
    const loadInitial = async () => {
      setLoadingOwned(true);
      try {
        const data = await fetchMoreOwned(0, pageSize);
        setOwnedPlaythroughs(data);
        setHasMoreOwned(data.length >= pageSize);
      } catch (error) {
        console.error('Error loading owned playthroughs:', error);
      } finally {
        setLoadingOwned(false);
      }
    };
    loadInitial();
  }, [projectId, user, fetchMoreOwned]);

  // Load initial community playthroughs
  useEffect(() => {
    if (!projectId) return;
    const loadInitial = async () => {
      setLoadingCommunity(true);
      try {
        const data = await fetchMoreCommunity(0, pageSize);
        setCommunityPlaythroughs(data);
        setHasMoreCommunity(data.length >= pageSize);
      } catch (error) {
        console.error('Error loading community playthroughs:', error);
      } finally {
        setLoadingCommunity(false);
      }
    };
    loadInitial();
  }, [projectId, fetchMoreCommunity]);

  // Load more owned handler
  const handleLoadMoreOwned = useCallback(async () => {
    if (loadingOwned || !hasMoreOwned) return;
    setLoadingOwned(true);
    try {
      const newData = await fetchMoreOwned(ownedPlaythroughs.length, pageSize);
      if (newData.length < pageSize) {
        setHasMoreOwned(false);
      }
      // Deduplicate by id
      setOwnedPlaythroughs((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNewData = newData.filter((item) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewData];
      });
    } catch (error) {
      console.error('Error loading more owned playthroughs:', error);
    } finally {
      setLoadingOwned(false);
    }
  }, [loadingOwned, hasMoreOwned, ownedPlaythroughs.length, fetchMoreOwned]);

  // Load more community handler
  const handleLoadMoreCommunity = useCallback(async () => {
    if (loadingCommunity || !hasMoreCommunity) return;
    setLoadingCommunity(true);
    try {
      const newData = await fetchMoreCommunity(communityPlaythroughs.length, pageSize);
      if (newData.length < pageSize) {
        setHasMoreCommunity(false);
      }
      // Deduplicate by id
      setCommunityPlaythroughs((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNewData = newData.filter((item) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewData];
      });
    } catch (error) {
      console.error('Error loading more community playthroughs:', error);
    } finally {
      setLoadingCommunity(false);
    }
  }, [loadingCommunity, hasMoreCommunity, communityPlaythroughs.length, fetchMoreCommunity]);

  return (
    <>
      <div className="bg-slate-200/80 dark:bg-slate-800/80 rounded-lg p-4">
        <Info />
      </div>

      {user && (
        <div className="flex flex-col gap-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg p-4">
          <p className="opacity-80">Your playthroughs</p>
          {ownedPlaythroughs && ownedPlaythroughs.length > 0 ? (
            <FeatheredScroll>
              {ownedPlaythroughs.map((playthrough) => (
                <div className="w-60 flex-shrink-0" key={`${playthrough.id}_card`}>
                  <PlaythroughCard
                    playthrough={playthrough}
                    currentPlaythrough={currentPlaythrough}
                  />
                </div>
              ))}
              {hasMoreOwned && (
                <div className="w-60 flex-shrink-0 flex items-center justify-center">
                  <Button onClick={handleLoadMoreOwned} disabled={loadingOwned}>
                    Load more
                  </Button>
                </div>
              )}
            </FeatheredScroll>
          ) : (
            <p className="opacity-50">Play the game to view or resume your playthroughs here.</p>
          )}
        </div>
      )}

      {communityPlaythroughs && communityPlaythroughs.length > 0 && (
        <div className="flex flex-col gap-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg p-4">
          <p className="opacity-80">Community playthroughs</p>
          <FeatheredScroll>
            {communityPlaythroughs.map((playthrough) => (
              <div className="w-60 flex-shrink-0" key={playthrough.id}>
                <PlaythroughCard
                  playthrough={playthrough}
                  currentPlaythrough={currentPlaythrough}
                />
              </div>
            ))}
            {hasMoreCommunity && (
              <div className="w-60 flex-shrink-0 flex items-center justify-center">
                <Button onClick={handleLoadMoreCommunity} disabled={loadingCommunity}>
                  Load more
                </Button>
              </div>
            )}
          </FeatheredScroll>
        </div>
      )}

      <div className="flex flex-col gap-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg p-4">
        <p className="opacity-80">Explore more stories</p>
        {relatedProjects && relatedProjects.length > 0 && (
          <div className="flex flex-col gap-2">
            <FeatheredScroll>
              {relatedProjects.map((project) => (
                <div key={project.id} className="w-60 flex-shrink-0">
                  <ProjectCard project={project} />
                </div>
              ))}
            </FeatheredScroll>
          </div>
        )}
      </div>
    </>
  );
}
