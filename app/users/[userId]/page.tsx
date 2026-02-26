'use client';

import Footer from '@/app/landing/components/Footer';
import ProjectCard from '@/app/landing/components/ProjectCard';
import ProjectCardPlaceholder from '@/app/landing/components/ProjectCardPlaceholder';
import PlaythroughCard from '@/app/play/[projectId]/Play/PlayDescription/PlaythroughCard';
import { Project } from '@/app/types';
import Button from '@/components/Button';
import { FullWidthHeader } from '@/components/Header';
import User from '@/components/User';
import { apiClient } from '@/utils/api';
import { useLazyUserPlaythroughs } from '@/utils/api/hooks';
import { useLazyLoad } from '@/utils/hooks/useLazyLoad';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UserPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;
  const router = useRouter();
  const [visibleLimit, setVisibleLimit] = useState(8);
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    imageUrl: string | null;
    allowed: boolean;
    email: string | null;
  } | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and projects
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [profile, projects] = await Promise.all([
          apiClient.getUserProfile(userId),
          apiClient.getPublicProjectsForUser(userId),
        ]);
        setUserProfile(profile);
        setUserProjects(projects);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Use lazy loading for playthroughs
  const { fetchMore: fetchMorePlaythroughs } = useLazyUserPlaythroughs(userId || '');
  const {
    data: allPlaythroughs,
    loading: playthroughsLoading,
    hasMoreData: hasMorePlaythroughs,
    loadMore: loadMorePlaythroughs,
    loadInitial: loadInitialPlaythroughs,
  } = useLazyLoad({
    pageSize: 20, // Load more data per request
    fetchMore: fetchMorePlaythroughs,
  });

  // Load initial playthroughs when user is available
  useEffect(() => {
    if (userId) {
      loadInitialPlaythroughs();
    }
  }, [userId, loadInitialPlaythroughs]);

  // Get visible playthroughs based on limit
  const visiblePlaythroughs = allPlaythroughs.slice(0, visibleLimit);

  if (!userId) return null;

  const handleLoadMore = async () => {
    if (visibleLimit >= allPlaythroughs.length && hasMorePlaythroughs) {
      await loadMorePlaythroughs();
    }
    setVisibleLimit((prev) => prev + 8);
  };

  return (
    <>
      <FullWidthHeader
        left={
          <div className="flex gap-2 items-center">
            <Image
              src="/llama.png"
              alt="Dramamancer"
              width={40}
              height={40}
              className="cursor-pointer"
              onClick={() => router.push('/')}
            />
            <h1>Dramamancer</h1>
          </div>
        }
        right={<User />}
      />
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between">
          <div className="flex flex-col text-center items-center gap-4 w-full justify-center">
            <div className="flex flex-col gap-1 items-center">
              {loading ? (
                <span className="w-50 h-7 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              ) : (
                <p className="text-xl font-semibold">{userProfile?.displayName}</p>
              )}
              {userId && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ID: {userId.slice(0, 8)}…
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Projects */}
        {loading && (
          <section>
            <h2 className="text-lg font-medium">Projects</h2>
            <div className="flex flex-col gap-2 grid grid-cols-3 3xl:grid-cols-4 5xl:grid-cols-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={`placeholder-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ProjectCardPlaceholder />
                </motion.div>
              ))}
            </div>
          </section>
        )}
        {!loading && userProjects.length > 0 && (
          <section>
            <h2 className="text-lg font-medium">Projects</h2>
            <div className="flex flex-col gap-2 grid grid-cols-3 3xl:grid-cols-4 5xl:grid-cols-5">
              {userProjects.map((p, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Playthroughs */}
        {!loading && visiblePlaythroughs.length > 0 && (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-medium">Playthroughs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visiblePlaythroughs.map((pt) => (
                  <PlaythroughCard key={pt.id} playthrough={pt} />
                ))}
              </div>
            </div>
            {hasMorePlaythroughs && (
              <Button
                onClick={handleLoadMore}
                disabled={playthroughsLoading}
                variant="primary"
                className="w-full"
              >
                {playthroughsLoading ? 'Loading...' : 'Load more'}
              </Button>
            )}
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
