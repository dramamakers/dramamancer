'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { HELP_LINK } from '../constants';
import BrowseFilters, { SortOption } from './components/BrowseFilters';
import Footer from './components/Footer';
import Header from './components/Header';
import WelcomeModal from './components/WelcomeModal';
import BrowseContent from './views/Browse';
import CreateContent from './views/Create';
import DiscoverContent from './views/Discover';

type ViewType = 'discover' | 'create' | 'browse';

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get view from URL params, default to 'discover'
  const view = (searchParams.get('view') as ViewType) || 'discover';

  // Shared filter state
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'popular',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [remixableOnly, setRemixableOnly] = useState(false);
  const [likedOnly, setLikedOnly] = useState(false);

  const setView = (newView: ViewType) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', newView);

    // Clear filters when going to discover
    if (newView === 'discover') {
      setSearchQuery('');
      setSortBy('popular');
      setRemixableOnly(false);
      setLikedOnly(false);
      params.delete('sort');
    }

    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    // Navigate to browse when changing sort
    if (view !== 'browse') {
      const params = new URLSearchParams(searchParams);
      params.set('view', 'browse');
      params.set('sort', newSort);
      router.push(`?${params.toString()}`);
    }
  };

  const handleSearchChange = (newQuery: string) => {
    setSearchQuery(newQuery);
    // Navigate to browse when searching
    if (newQuery && view !== 'browse') {
      const params = new URLSearchParams(searchParams);
      params.set('view', 'browse');
      params.set('sort', sortBy);
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-screen"
    >
      {/* Welcome Modal */}
      <AnimatePresence>
        <WelcomeModal />
      </AnimatePresence>

      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-violet-400/15 via-fuchsia-400/10 to-pink-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-tr from-cyan-400/12 via-blue-400/8 to-indigo-500/12 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-gradient-to-tl from-emerald-400/10 via-teal-400/8 to-cyan-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-gradient-to-bl from-orange-400/8 via-amber-400/6 to-yellow-400/8 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <Header
        right={
          <div className="w-full justify-center flex gap-4 py-2 text-lg">
            <button
              className={twMerge('cursor-pointer opacity-50', view === 'discover' && 'opacity-100')}
              onClick={() => setView('discover')}
            >
              Discover
            </button>
            <button
              className={twMerge('cursor-pointer opacity-50', view === 'browse' && 'opacity-100')}
              onClick={() => setView('browse')}
            >
              Browse
            </button>
            <button
              className={twMerge('cursor-pointer opacity-50', view === 'create' && 'opacity-100')}
              onClick={() => setView('create')}
            >
              Create
            </button>
            <button
              className={twMerge('cursor-pointer opacity-50')}
              onClick={() => window.open(HELP_LINK, '_blank')}
            >
              Help
            </button>
          </div>
        }
      />

      {/* Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 py-8 flex flex-col gap-8">
        {view === 'create' ? (
          <CreateContent />
        ) : (
          <>
            <BrowseFilters
              sortBy={view === 'discover' ? undefined : sortBy}
              searchQuery={searchQuery}
              remixableOnly={remixableOnly}
              likedOnly={likedOnly}
              onSortChange={handleSortChange}
              onSearchChange={handleSearchChange}
              onRemixableChange={setRemixableOnly}
              onLikedChange={setLikedOnly}
              hideTags={view === 'discover'}
            />
            {view === 'discover' ? (
              <DiscoverContent />
            ) : (
              <BrowseContent
                sortBy={sortBy}
                searchQuery={searchQuery}
                remixableOnly={remixableOnly}
                likedOnly={likedOnly}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </motion.div>
  );
}
