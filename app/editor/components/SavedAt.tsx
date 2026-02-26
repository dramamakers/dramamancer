import { useEditorProject } from '@/app/editor/[projectId]/EditorContext';
import { formatTimeAgo } from '@/utils/format';
import { twMerge } from 'tailwind-merge';

export function SavedAt({ variant = 'lg' }: { variant?: 'sm' | 'lg' }) {
  const { isSaving, project, saveError, hasUnsavedChanges } = useEditorProject();
  return (
    <div
      title={saveError ? saveError : undefined}
      className={twMerge(saveError && 'text-red-600', isSaving && 'text-yellow-600')}
    >
      {isSaving ? (
        'Saving...'
      ) : saveError ? (
        'Error saving'
      ) : hasUnsavedChanges ? (
        <span className="text-yellow-600">Unsaved changes</span>
      ) : (
        <>
          Saved
          <span className={twMerge(variant === 'sm' && 'hidden lg:inline')}>
            {' '}
            {formatTimeAgo(project.updatedAt)}
          </span>
        </>
      )}
    </div>
  );
}
