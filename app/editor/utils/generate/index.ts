/**
 * Public version: no image or video generation.
 * Images are added via URL or file upload only.
 */
import { useCallback, useState } from 'react';
import { EntityType } from '../entity';

export function useImageGeneration() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleImageGeneration = useCallback(
    async (_params: { id?: string; entityType: EntityType; prompt: string }) => {
      setStatus('idle');
      return undefined;
    },
    [],
  );

  const handleVideoGeneration = useCallback(
    async (_params: {
      id: string;
      entityType: EntityType;
      imageUrl: string;
      prompt?: string;
    }) => {
      setStatus('idle');
      return null;
    },
    [],
  );

  return {
    status,
    handleImageGeneration,
    handleVideoGeneration,
    isGenerating: false,
  };
}
