import Button from '@/components/Button';
import { FullWidthHeader } from '@/components/Header';
import { useTooltip } from '@/components/Tooltip';
import User from '@/components/User';
import Visibility from '@/components/Visibility';
import { ArrowLeftIcon, ArrowsPointingOutIcon, ShareIcon } from '@heroicons/react/24/outline';
import { SavedAt } from '../../components/SavedAt';
import { useNavigationConfirmation } from '../../hooks/useNavigationConfirmation';
import { useEditorProject } from '../EditorContext';
import EditableTitle from './EditableTitle';

export function EditorHeader({
  setIsFullscreen,
  openShareModal,
}: {
  setIsFullscreen: (isFullscreen: boolean) => void;
  openShareModal: () => void;
}) {
  const { project, updateProject, isSaving, hasUnsavedChanges } = useEditorProject();
  const { showTooltip, hideTooltip } = useTooltip();
  const { navigateWithConfirmation } = useNavigationConfirmation({
    isSaving,
    hasUnsavedChanges,
  });

  const handleTitleChange = (newTitle: string) => {
    updateProject(
      {
        title: newTitle,
      },
      {
        message: 'updated title',
        context: JSON.stringify({
          title: newTitle,
        }),
      },
    );
  };

  return (
    <FullWidthHeader
      left={
        <div className="flex items-center gap-2">
          <Button variant="icon" onClick={() => navigateWithConfirmation('/landing?view=create')}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <EditableTitle
              title={project.title}
              placeholder="Untitled game"
              onSave={handleTitleChange}
            />
            <Visibility visibility={project.settings.visibility} />
          </div>
        </div>
      }
      right={
        <div className="flex gap-3 items-center justify-end max-w-md w-full pl-2">
          <SavedAt />

          <div className="hidden md:flex items-center gap-1">
            <Button onClick={openShareModal} className="flex items-center gap-1">
              <ShareIcon className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <Button
              variant="icon-filled"
              onMouseOver={() => showTooltip('Share your game')}
              onMouseLeave={() => hideTooltip()}
              onClick={openShareModal}
              className="flex items-center gap-1"
            >
              <ShareIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="icon-filled"
              onMouseOver={() => showTooltip('Preview your game')}
              onMouseLeave={() => hideTooltip()}
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </Button>
          </div>
          <User />
        </div>
      }
    />
  );
}
