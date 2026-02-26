'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Editor() {
  const router = useRouter();

  useEffect(() => {
    router.push('/landing?view=create');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Redirecting to editor...</div>
    </div>
  );
}
