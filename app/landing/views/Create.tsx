import { getDefaultProject } from '@/app/constants';
import LazyImage from '@/app/editor/components/LazyImage';
import ProjectTablePlaceholder from '@/app/landing/components/ProjectTablePlaceholder';
import { useAuth } from '@/components/Auth/AuthContext';
import Button from '@/components/Button';
import { assets } from '@/components/constants';
import { useMenu } from '@/components/Menu/MenuContext';
import Visibility from '@/components/Visibility';
import { useOwnedProjects, useProjectMutations } from '@/utils/api/hooks';
import { formatNumber, formatTimeAgo } from '@/utils/format';
import { getThumbnailImageUrl } from '@/utils/game';
import {
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import SearchBar from '../components/Searchbar';

function Cell({ children, noPadding }: { children: React.ReactNode; noPadding?: boolean }) {
  return (
    <td
      className={twMerge(
        'border-b border-slate-200 dark:border-slate-700 px-4',
        noPadding && 'px-0',
      )}
    >
      {children}
    </td>
  );
}

export default function CreateContent() {
  const { data: projects, loading: projectsLoading, refetch } = useOwnedProjects();
  const { showMenu } = useMenu();
  const { remixProject, deleteProject, createProject, loading } = useProjectMutations();
  const { user } = useAuth();
  const [isCreatingQuickstart, setIsCreatingQuickstart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    let filtered = projects;

    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.settings.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.settings.genre?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  }, [projects, searchQuery]);

  const handleMenuClick = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    showMenu(e, [
      {
        label: 'Edit',
        value: 'edit',
        Icon: PencilIcon,
        onSelect: () => (window.location.href = `/editor/${projectId}`),
      },
      {
        label: 'Duplicate',
        value: 'duplicate',
        onSelect: async () => {
          await remixProject(projectId);
          refetch();
        },
        Icon: DocumentDuplicateIcon,
        disabled: loading,
      },
      {
        label: 'Delete',
        value: 'delete',
        onSelect: async () => {
          if (confirm('Are you sure you want to delete this project?')) {
            await deleteProject(projectId);
            refetch();
          }
        },
        Icon: TrashIcon,
        disabled: loading,
      },
    ]);
  };

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
      <div className="flex justify-end">
        <SearchBar className="w-1/2" onSearch={setSearchQuery} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2 items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-4 py-10 relative overflow-hidden group"
      >
        <div className="max-w-lg w-full mx-auto gap-4 flex flex-col relative">
          <div className="flex items-center gap-2 justify-between">
            <div>
              <h1>What game would you like to make?</h1>
              <p>Describe your ideas and watch them come to life.</p>
            </div>
            <Image
              src={assets.hero.penIcon}
              alt="Pen icon"
              width={80}
              height={80}
              className="group-hover:rotate-5 transition-all duration-300"
            />
          </div>
          <Button
            className="w-full flex justify-center items-center gap-2"
            onClick={handleQuickstart}
            disabled={isCreatingQuickstart}
          >
            {isCreatingQuickstart ? 'Creating...' : 'Create a new game'}
            <SparklesIcon className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
            <th className="text-left py-3 px-4 font-normal">Project</th>
            <th className="text-left py-3 px-4 w-1/3"></th>
            <th className="text-left py-3 px-4 font-normal">Created</th>
            <th className="text-left py-3 px-4 font-normal">Updated</th>
            <th className="text-left py-3 px-4 font-normal!">Lines</th>
            <th className="text-left py-3 px-4 font-normal">Visibility</th>
            <th className="text-left py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {projectsLoading ? (
            <ProjectTablePlaceholder />
          ) : (
            filteredProjects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800 h-20! overflow-hidden"
              >
                <Cell noPadding>
                  <div
                    className="min-w-30 relative h-30 overflow-hidden rounded-l-lg cursor-pointer"
                    onClick={() => (window.location.href = `/play/${project.id}`)}
                  >
                    <LazyImage
                      src={getThumbnailImageUrl(project)}
                      alt={project.title}
                      width={40}
                      height={40}
                    />
                  </div>
                </Cell>
                <Cell>{project.title || <span className="opacity-50">Untitled game</span>}</Cell>
                <Cell>{formatTimeAgo(project.createdAt)}</Cell>
                <Cell>{formatTimeAgo(project.updatedAt)}</Cell>
                <Cell>{formatNumber(project.totalLines || 0)}</Cell>
                <Cell>
                  <Visibility visibility={project.settings.visibility} />
                </Cell>
                <Cell>
                  <Button variant="icon-filled" onClick={(e) => handleMenuClick(e, project.id)}>
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </Button>
                </Cell>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {!projectsLoading && filteredProjects.length === 0 && (
        <div className="flex justify-center items-center w-full py-4">
          {user ? (
            <p className="text-slate-500">No projects found.</p>
          ) : (
            <Button onClick={() => window.dispatchEvent(new Event('open-login-modal'))}>
              Login to create games
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
