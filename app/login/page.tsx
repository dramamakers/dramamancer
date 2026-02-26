'use client';

import { useAuth } from '@/components/Auth/AuthContext';
import { useLoginModal } from '@/components/Auth/LoginModalProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginRoute() {
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (user) {
        // Already logged in; go back to previous page
        router.back();
        return;
      }
      await openLoginModal();
      if (cancelled) return;
      // Public version: no login modal; redirect to landing or back
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/landing');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [openLoginModal, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <LoadingSpinner />
    </div>
  );
}
