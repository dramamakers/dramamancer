'use client';

import PlaythroughCard from '@/app/play/[projectId]/Play/PlayDescription/PlaythroughCard';
import { useAuth } from '@/components/Auth/AuthContext';
import { useLazyOwnedPlaythroughs } from '@/utils/api/hooks';
import { useLazyLoad } from '@/utils/hooks/useLazyLoad';
import { useEffect } from 'react';

export default function MyPlaythroughsPage() {
  const { user: authUser } = useAuth();
  const userId = authUser?.userId || '';
  const { fetchMore } = useLazyOwnedPlaythroughs();

  const {
    data: visiblePlaythroughs,
    loading,
    hasMoreData,
    sentinelRef,
    loadInitial,
  } = useLazyLoad({
    pageSize: 10,
    fetchMore,
  });

  // Load initial data when user is available
  useEffect(() => {
    if (userId) {
      loadInitial();
    }
  }, [userId, loadInitial]);

  return (
    <div>
      <div className="flex flex-col gap-2 w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">My playthroughs</h2>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiblePlaythroughs.map((pt) => (
            <PlaythroughCard key={pt.id} playthrough={pt} />
          ))}
        </div>

        {/* Lazy loading sentinel */}
        {hasMoreData && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            {loading && <div className="text-slate-500">Loading more playthroughs...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
