'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Preview() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since previews are now project-specific
    router.push('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}
