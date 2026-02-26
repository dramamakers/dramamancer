import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

interface NavigationConfirmationOptions {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  confirmMessage?: string;
}

export function useNavigationConfirmation({
  isSaving,
  hasUnsavedChanges,
  confirmMessage = 'You have unsaved changes. Are you sure you want to leave?',
}: NavigationConfirmationOptions) {
  const router = useRouter();

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving || hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = confirmMessage;
        return confirmMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSaving, hasUnsavedChanges, confirmMessage]);

  // Create a navigation function that shows confirmation when needed
  const navigateWithConfirmation = useCallback(
    (href: string) => {
      if (isSaving || hasUnsavedChanges) {
        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) {
          return false;
        }
      }
      router.push(href);
      return true;
    },
    [router, isSaving, hasUnsavedChanges, confirmMessage],
  );

  // Create a back navigation function that shows confirmation when needed
  const goBackWithConfirmation = useCallback(() => {
    if (isSaving || hasUnsavedChanges) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        return false;
      }
    }
    router.back();
    return true;
  }, [router, isSaving, hasUnsavedChanges, confirmMessage]);

  return {
    navigateWithConfirmation,
    goBackWithConfirmation,
  };
}
