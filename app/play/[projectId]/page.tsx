'use client';
import Footer from '@/app/landing/components/Footer';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TooltipProvider } from '@/components/Tooltip';
import { useGetProject } from '@/utils/api/hooks';
import { useParams } from 'next/navigation';
import { ProjectProvider } from '../../../components/Game/ProjectContext';
import PlayContent from './Play';

export default function Play() {
  const params = useParams();
  const projectId = parseInt(params.projectId as string);
  const { data: project, error, loading } = useGetProject(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    if (error === 'Not authenticated') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-2">
          <p>You must be logged in to view this project.</p>
          <Button onClick={() => window.dispatchEvent(new Event('open-login-modal'))}>Login</Button>
        </div>
      );
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <ProjectProvider mode="play" project={project}>
      <TooltipProvider>
        <PlayContent />
        <Footer />
      </TooltipProvider>
    </ProjectProvider>
  );
}
