import Button from '@/components/Button';
import { useAllProjects, useProjectLikes } from '@/utils/api/hooks';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { SortOption } from '../components/BrowseFilters';
import ProjectCard from '../components/ProjectCard';

const PROJECTS_PER_PAGE = 16;

interface BrowseContentProps {
  sortBy: SortOption;
  searchQuery: string;
  remixableOnly?: boolean;
  likedOnly?: boolean;
}

export default function BrowseContent({
  sortBy,
  searchQuery,
  remixableOnly,
  likedOnly,
}: BrowseContentProps) {
  const { data: projects = [] } = useAllProjects();
  const { allProjectLikes } = useProjectLikes();
  const [currentPage, setCurrentPage] = useState(1);

  // Clear search when navigating back to browse without query
  useEffect(() => {
    if (!searchQuery) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, searchQuery, remixableOnly, likedOnly]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    if (!projects) return [];
    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.settings.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.settings.genre?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply remixable filter
    if (remixableOnly) {
      filtered = filtered.filter((project) => project.settings.remixable);
    }

    // Apply liked filter
    if (likedOnly && allProjectLikes) {
      const likedProjectIds = new Set(allProjectLikes.map((p) => p.id));
      filtered = filtered.filter((project) => likedProjectIds.has(project.id));
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'popular':
        sorted.sort((a, b) => (b.totalLines || 0) - (a.totalLines || 0));
        break;
      case 'new-popular':
        // Recent projects (within last 30 days) sorted by popularity
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentProjects = sorted.filter((p) => (p.updatedAt || 0) > thirtyDaysAgo);
        const olderProjects = sorted.filter((p) => (p.updatedAt || 0) <= thirtyDaysAgo);
        recentProjects.sort((a, b) => (b.totalLines || 0) - (a.totalLines || 0));
        olderProjects.sort((a, b) => (b.totalLines || 0) - (a.totalLines || 0));
        return [...recentProjects, ...olderProjects];
      case 'recent':
        sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        break;
    }

    return sorted;
  }, [projects, searchQuery, sortBy, remixableOnly, likedOnly, allProjectLikes]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedProjects.length / PROJECTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
  const endIndex = startIndex + PROJECTS_PER_PAGE;
  const visibleProjects = filteredAndSortedProjects.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="flex flex-col gap-6"
    >
      {/* Projects grid */}
      {filteredAndSortedProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, delay: 0.1 }}
          className="text-center py-12 opacity-70"
        >
          <p>No games found matching your criteria.</p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button onClick={handlePrevPage} disabled={currentPage === 1}>
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handlePageClick(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentPage === pageNum ? 'bg-blue-500 dark:bg-blue-900 text-white' : ''
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
