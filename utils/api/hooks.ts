'use client';

import { LogResult } from '@/app/editor/utils/log';
import { EditableProject, Playthrough, Project, User } from '@/app/types';
import { useAuth } from '@/components/Auth/AuthContext';
import { useLikesStore } from '@/store/likes';
import { getLanguageShort, translateTexts } from '@/utils/hooks/useLocalTranslator';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '.';

// Hook for fetching data with loading and error states
function useApiQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  cacheKey?: string,
): { data: T | undefined; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const queryFnRef = useRef(queryFn);

  // Keep queryFn ref updated
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFnRef.current();
      setData(result);
      if (cacheKey) {
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    // Only fetch once unless dependencies or cacheKey change
    if (hasFetchedRef.current) {
      hasFetchedRef.current = false;
    }

    // Try to load from cache first
    if (cacheKey) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
          hasFetchedRef.current = true;
          return;
        }
      } catch (err) {
        // Ignore cache errors, will fetch fresh data
      }
    }

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, cacheKey]);

  return { data, loading, error, refetch: fetchData };
}

// ===== PROJECT HOOKS =====

// Query hooks
export function useGetProject(id: number) {
  return useApiQuery(() => apiClient.getProject(id), [id]);
}

export function useAllProjects() {
  return useApiQuery(() => apiClient.getAllProjects(), []);
}

export function useLazyAllProjects(pageSize: number = 20) {
  const fetchMore = useCallback(async (offset: number, limit: number) => {
    return apiClient.getAllProjects(limit, offset);
  }, []);

  return { fetchMore };
}

export function useOwnedProjects() {
  return useApiQuery(() => apiClient.getOwnedProjects(), []);
}

export function useOwnedPlaythroughs(limit?: number) {
  return useApiQuery(() => apiClient.getOwnedPlaythroughs(limit), [limit]);
}

export function useLazyOwnedPlaythroughs(pageSize: number = 10) {
  const fetchMore = useCallback(async (offset: number, limit: number) => {
    return apiClient.getOwnedPlaythroughs(limit, offset);
  }, []);

  return { fetchMore };
}

export function useRecentlyPlayedProjects(limit?: number) {
  const { user } = useAuth();
  const userId = user?.userId || null;

  return useApiQuery(
    () => (userId ? apiClient.getRecentlyPlayedProjects(limit) : Promise.resolve([])),
    [limit, userId],
    userId ? `recentlyPlayedProjects-${userId}-${limit || 'default'}` : undefined,
  );
}

// Utility to clear recently played projects cache
export function clearRecentlyPlayedCache() {
  try {
    // Clear all recentlyPlayedProjects cache keys (including user-specific ones)
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('recentlyPlayedProjects-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (err) {
    // Ignore errors
  }
}

// Related projects by genre
export function useRelatedProjects(currentProjectId: number, genre: string) {
  return useApiQuery(async () => {
    const allProjects = await apiClient.getAllProjects();
    const eligibleProjects = allProjects
      .filter(
        (project) => project.id !== currentProjectId && project.settings.visibility === 'public',
      )
      .sort((a, b) => (b.totalLines || 0) - (a.totalLines || 0));

    // First, try to find projects with the same genre
    const sameGenreProjects = eligibleProjects
      .filter((project) => project.settings.genre === genre)
      .slice(0, 3);

    // If we have fewer than 3 projects in the same genre,
    // fill the remaining slots with popular projects from other genres
    if (sameGenreProjects.length < 3) {
      const otherGenreProjects = eligibleProjects
        .filter(
          (project) =>
            project.settings.genre !== genre &&
            !sameGenreProjects.some((sameProject) => sameProject.id === project.id),
        )
        .slice(0, 3 - sameGenreProjects.length);

      return [...sameGenreProjects, ...otherGenreProjects];
    }

    return sameGenreProjects;
  }, [currentProjectId, genre]);
}

export function useProjectMutations() {
  const [loading, setLoading] = useState(false);

  const createProject = useCallback(
    async (project?: Partial<EditableProject>): Promise<{ id: number }> => {
      try {
        setLoading(true);
        return await apiClient.createProject(project || {});
      } catch (err) {
        console.error('createProject error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteProject = useCallback(async (projectId: number): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await apiClient.deleteProject(projectId);
      return result.success;
    } catch (err) {
      console.error('deleteProject error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remixProject = useCallback(
    async (projectId: number): Promise<{ id: number } | undefined> => {
      try {
        setLoading(true);
        const result = await apiClient.remixProject(projectId);
        return result;
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateProject = useCallback(
    async (projectId: number, project: Partial<Project>): Promise<{ id: number } | undefined> => {
      try {
        setLoading(true);
        return await apiClient.updateProject(projectId, project);
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createProject,
    deleteProject,
    remixProject,
    updateProject,
    loading,
  };
}

// ===== USER HOOKS =====

export function useLazyUserPlaythroughs(userId: string, pageSize: number = 10) {
  const fetchMore = useCallback(
    async (offset: number, limit: number) => {
      return apiClient.getPublicPlaythroughsForUser(userId, limit, offset);
    },
    [userId],
  );

  return { fetchMore };
}

// ===== PLAYTHROUGH HOOKS =====

export function usePlaythroughsForProject(projectId: number | undefined, limit?: number) {
  if (projectId === undefined) {
    return { data: [], loading: false, error: null, refetch: () => {} };
  }
  return useApiQuery(
    () => apiClient.getPlaythroughsForProject(projectId, limit),
    [projectId, limit],
  );
}

export function usePublicPlaythroughsForProject(projectId: number, limit?: number) {
  return useApiQuery(
    () => apiClient.getPublicPlaythroughsForProject(projectId, limit),
    [projectId, limit],
  );
}

export function useLazyPublicPlaythroughsForProject(projectId: number, pageSize: number = 10) {
  const fetchMore = useCallback(
    async (offset: number, limit: number) => {
      return apiClient.getPublicPlaythroughsForProject(projectId, limit, offset, true);
    },
    [projectId],
  );

  return { fetchMore };
}

export function useLazyPlaythroughsForProject(projectId: number, pageSize: number = 10) {
  const fetchMore = useCallback(
    async (offset: number, limit: number) => {
      return apiClient.getPlaythroughsForProject(projectId, limit, offset);
    },
    [projectId],
  );

  return { fetchMore };
}

// Per-playthrough viewer (like management)
export function usePlaythroughViewer(playthroughId: number, initialLikeCount?: number) {
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount ?? 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);

  // Initialize liked state by fetching the current user's liked playthrough IDs
  useEffect(() => {
    let cancelled = false;
    const initLiked = async () => {
      try {
        const ids = await apiClient.getPlaythroughLikes();
        if (!cancelled) setLiked(ids.includes(playthroughId));
      } catch {
        if (!cancelled) setLiked(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initLiked();
    return () => {
      cancelled = true;
    };
  }, [playthroughId]);

  // Load like count (always revalidate on mount), but show initialLikeCount immediately
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const { totalLikes } = await apiClient.getPlaythroughLikeCount(playthroughId);
        if (!cancelled) setLikeCount(totalLikes);
      } catch {
        // ignore
      }
    };
    fetchCount();
    return () => {
      cancelled = true;
    };
  }, [playthroughId]);

  const refreshLikeCount = useCallback(async () => {
    try {
      const { totalLikes } = await apiClient.getPlaythroughLikeCount(playthroughId);
      setLikeCount(totalLikes);
      return totalLikes;
    } catch {
      return undefined;
    }
  }, [playthroughId]);

  const togglePlaythroughLike = useCallback(async () => {
    if (toggling) return;
    setToggling(true);

    const wasLiked = liked;
    const optimisticCount = wasLiked ? Math.max(0, likeCount - 1) : likeCount + 1;

    // Optimistic local update
    setLiked(!wasLiked);
    setLikeCount(optimisticCount);

    try {
      if (wasLiked) {
        await apiClient.removePlaythroughLike(playthroughId);
      } else {
        await apiClient.addPlaythroughLike(playthroughId);
      }
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount(likeCount);
    } finally {
      setToggling(false);
      // Re-validate count in background to sync with DB
      void refreshLikeCount();
    }
  }, [liked, likeCount, playthroughId, refreshLikeCount, toggling]);

  return { liked, likeCount, loading, toggling, togglePlaythroughLike, refreshLikeCount };
}

// Playthrough management hook - combines create, update, delete
export function usePlaythroughMutations() {
  const [loading, setLoading] = useState(false);

  const createPlaythrough = useCallback(
    async (data: Partial<Playthrough>): Promise<Playthrough | undefined> => {
      try {
        setLoading(true);
        const playthrough = await apiClient.createPlaythrough(data);

        // translate the initial line
        const textsToTranslate = playthrough.lines.map((line) => line.text);
        if (textsToTranslate.length > 0) {
          const translatedLines = await translateTexts(textsToTranslate, getLanguageShort());
          playthrough.lines.forEach((line, index) => {
            line.text = translatedLines[index];
          });
        }
        return playthrough;
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updatePlaythrough = useCallback(
    async (id: number, update: Partial<Playthrough>): Promise<void> => {
      try {
        setLoading(true);
        await apiClient.updatePlaythrough(id, update);
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createPlaythrough,
    updatePlaythrough,
    loading,
  };
}

// ===== PROJECT LIKE HOOKS =====

export function useProjectLikes() {
  const { user } = useAuth();
  const userId = user?.userId || null;

  const { data: allProjectLikes, refetch: refetchProjectLikes } = useApiQuery(
    () => (userId ? apiClient.getProjectLikes() : Promise.resolve([])),
    [userId],
  );

  const isProjectLiked = useCallback(
    (projectId: number) => {
      return allProjectLikes?.some((likedProject) => likedProject.id === projectId) || false;
    },
    [allProjectLikes],
  );

  const toggleProjectLike = useCallback(
    async (projectId: number) => {
      if (isProjectLiked(projectId)) {
        await apiClient.removeProjectLike(projectId);
      } else {
        await apiClient.addProjectLike(projectId);
      }
      refetchProjectLikes();
    },
    [isProjectLiked, refetchProjectLikes],
  );

  return { isProjectLiked, allProjectLikes, refetchProjectLikes, toggleProjectLike };
}

// ===== LIKE HOOKS =====

export function useLineLikes(currentPlaythrough: Playthrough | undefined | null) {
  const { lineLikes, loading, error, setLineLikes, setLoading, setError } = useLikesStore();
  const playthroughId = currentPlaythrough?.id ?? -1;
  const currentLineLikes = lineLikes[playthroughId] ?? { liked: [], disliked: [] };

  // Fetch initial data when playthrough changes
  useEffect(() => {
    if (!currentPlaythrough?.id) return;
    const fetchLikes = async () => {
      try {
        setLoading(true);
        setError(null);

        const lineLikesData = await apiClient.getLineLikes(currentPlaythrough.id);
        setLineLikes(currentPlaythrough.id, lineLikesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [currentPlaythrough?.id, setLineLikes, setLoading, setError]);

  const setLineLike = useCallback(
    async (lineId: number, isLiked: boolean): Promise<boolean | undefined> => {
      if (!currentPlaythrough?.id) return undefined;

      try {
        setLoading(true);
        setError(null);

        await apiClient.setLineLike(currentPlaythrough.id, lineId, isLiked);

        // Update the store to reflect the change immediately
        const newLiked = isLiked
          ? [...currentLineLikes.liked.filter((id) => id !== lineId), lineId]
          : currentLineLikes.liked.filter((id) => id !== lineId);

        const newDisliked = !isLiked
          ? [...currentLineLikes.disliked.filter((id) => id !== lineId), lineId]
          : currentLineLikes.disliked.filter((id) => id !== lineId);

        setLineLikes(currentPlaythrough.id, { liked: newLiked, disliked: newDisliked });
        return isLiked;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [currentPlaythrough?.id, currentLineLikes, setLineLikes, setLoading, setError],
  );

  const removeLineLike = useCallback(
    async (lineId: number): Promise<boolean | undefined> => {
      if (!currentPlaythrough?.id) return undefined;

      try {
        setLoading(true);
        setError(null);

        await apiClient.removeLineLike(currentPlaythrough.id, lineId);

        // Update the store to reflect the change immediately
        const newLiked = currentLineLikes.liked.filter((id) => id !== lineId);
        const newDisliked = currentLineLikes.disliked.filter((id) => id !== lineId);

        setLineLikes(currentPlaythrough.id, { liked: newLiked, disliked: newDisliked });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [currentPlaythrough?.id, currentLineLikes, setLineLikes, setLoading, setError],
  );

  return {
    setLineLike,
    removeLineLike,
    lineLikes: currentLineLikes,
    loading,
    error,
  };
}

// ===== CHAT HOOKS =====

export function useChatList(projectId: number) {
  return useApiQuery(() => apiClient.getChatList(projectId), [projectId]);
}

// ===== TRACE LOG HOOKS =====

export function useTraceLogger() {
  const sessionIdRef = useRef<string | null>(null);
  const debounceTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = debounceTimeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return sessionIdRef.current;
  }, []);

  const log = useCallback(
    async (projectId: number, logData: LogResult | string) => {
      try {
        const action = typeof logData === 'string' ? logData : logData.message;
        const context = typeof logData === 'string' ? '' : logData.context;
        await apiClient.createTraceLog({
          projectId,
          action,
          context,
          sessionId: getSessionId(),
        });
      } catch (error) {
        // Silently fail - we don't want logging to break the app
        console.warn('Failed to log action:', error);
      }
    },
    [getSessionId],
  );

  return {
    log,
    sessionId: getSessionId(),
  };
}
