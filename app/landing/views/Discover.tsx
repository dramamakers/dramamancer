import { getDefaultProject } from '@/app/constants';
import { useAuth } from '@/components/Auth/AuthContext';
import Button from '@/components/Button';
import FeatheredScroll from '@/components/FeatheredScroll';
import { useAllProjects, useProjectMutations, useRecentlyPlayedProjects } from '@/utils/api/hooks';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ByGenre from '../components/ByGenre';
import ProjectCard from '../components/ProjectCard';
import { sortProjects } from '../sorter';

const PROJECTS_LIMIT = 8;

export default function DiscoverContent() {
  const { data: projects = [], loading: projectsLoading } = useAllProjects();
  const { data: recentlyPlayedProjects = [] } = useRecentlyPlayedProjects();
  const { createProject } = useProjectMutations();
  const { user } = useAuth();
  const [isCreatingQuickstart, setIsCreatingQuickstart] = useState(false);
  const sortedProjects = sortProjects(projects);

  const teamProjectIds = [178, 176, 335, 127, 24, 26];
  const featuredProjectIds = [242, 238, 300, 271, 326];
  const featuredProjects = projects.filter((project) => featuredProjectIds.includes(project.id));
  const teamProjects = projects.filter((project) => teamProjectIds.includes(project.id));

  // Else, show recommended grid
  const { byGenre, byRecency } = sortedProjects;

  const handleQuickstart = async () => {
    if (!user) {
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }

    try {
      setIsCreatingQuickstart(true);
      const defaultProject = getDefaultProject(user.userId);
      const newProject = await createProject({
        title: '',
        cartridge: defaultProject.cartridge,
        settings: defaultProject.settings,
      });
      if (newProject?.id) {
        window.location.href = `/editor/${newProject.id}?view=chat`;
      }
    } catch (err) {
      console.error('Failed to create quickstart project:', err);
    } finally {
      setIsCreatingQuickstart(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Create new game section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2 rounded-lg p-6 py-10 relative overflow-hidden group"
      >
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="object-cover absolute inset-0 w-full h-full -z-10"
        >
          <source src="/cat_banner.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay angled 30deg for text readability */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,_#3b82f6_0%,_#60a5fa_33%,_#60a5fa60_60%,_transparent_70%)] dark:bg-[linear-gradient(120deg,_#1e1b4b_0%,_#312e81_33%,_#312e8160_60%,_transparent_70%)]" />

        <div className="max-w-md gap-4 flex flex-col relative">
          <div>
            <h1>What game would you like to make?</h1>
            <p>Describe your ideas and watch them come to life.</p>
          </div>
          <Button onClick={handleQuickstart} disabled={isCreatingQuickstart}>
            Create a game
          </Button>
        </div>
      </motion.div>

      {recentlyPlayedProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-2"
        >
          <h1>Continue playing</h1>
          <FeatheredScroll>
            {recentlyPlayedProjects.map((project) => (
              <div className="w-50 flex-shrink-0" key={project.id}>
                <ProjectCard project={project} />
              </div>
            ))}
          </FeatheredScroll>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col gap-2"
      >
        <h1>Featured games</h1>
        <FeatheredScroll>
          {featuredProjects.map((project) => (
            <div className="w-50 flex-shrink-0" key={project.id}>
              <ProjectCard project={project} />
            </div>
          ))}
        </FeatheredScroll>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col gap-2"
      >
        <h1>From the team</h1>
        <FeatheredScroll>
          {teamProjects.map((project) => (
            <div className="w-50 flex-shrink-0" key={project.id}>
              <ProjectCard project={project} />
            </div>
          ))}
        </FeatheredScroll>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col gap-2"
      >
        <h1>By genre</h1>
        {projectsLoading ? (
          <div className="flex flex-col gap-2">
            <div className="h-6 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="w-50 h-35 bg-slate-300 dark:bg-slate-700 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : (
          <ByGenre byGenre={byGenre} />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col gap-2"
      >
        <h1>Recent games</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {byRecency.slice(0, PROJECTS_LIMIT).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('view', 'browse');
            window.location.href = `?${params.toString()}`;
          }}
        >
          See all games
        </Button>
      </motion.div>
    </div>
  );
}
