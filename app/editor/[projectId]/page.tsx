'use client';

import { useAuth } from '@/components/Auth/AuthContext';
import Button from '@/components/Button';
import { ProjectProvider } from '@/components/Game/ProjectContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useGetProject } from '@/utils/api/hooks';
import { useParams } from 'next/navigation';
import Modals from '../components/Modals';
import ProjectEditor from './Editor';
import { EditorProjectProvider } from './EditorContext';

export default function Editor() {
  const params = useParams();
  const projectId = parseInt(params.projectId as string);
  const { data: project, loading, error } = useGetProject(projectId);
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>An error occurred while fetching the project: {error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Project not found.</p>
      </div>
    );
  }

  if (project.userId !== user?.userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>You can only edit your own projects.</p>
        <Button onClick={() => (window.location.href = '/landing?view=create')}>
          Go back to your projects
        </Button>
      </div>
    );
  }

  return (
    <ProjectProvider mode="edit" project={project}>
      <EditorProjectProvider>
        <ProjectEditor />
        <Modals />
      </EditorProjectProvider>
    </ProjectProvider>
  );
}
