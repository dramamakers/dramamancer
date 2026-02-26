import { EntityType, getEntityTypeByUuid } from '../entity';
import { GenerationConfig, GenerationType } from './types';

export const getImageAspectRatio = (type: EntityType): string => {
  switch (type) {
    case EntityType.TRIGGER:
      return '--ar 4:3';
    case EntityType.SCENE:
      return '--ar 3:2';
    case EntityType.PROJECT:
      return '--ar 3:2';
    case EntityType.CHARACTER:
      return '--ar 3:4';
    case EntityType.PLACE:
      return '--ar 4:3';
    default:
      return '--ar 1:1';
  }
};

export const getConstantParameters = (type: EntityType): string => {
  const aspectRatio = getImageAspectRatio(type);
  return `--stylize 350 ${aspectRatio}`;
};

export const parseStyleParameters = (prompt: string) => {
  return {
    sref: prompt.match(/--sref\s+([^-]+)(?=\s*--|$)/)?.[1],
    stylize: prompt.match(/--stylize\s+(\d+)/)?.[1],
    ar: prompt.match(/--ar\s+(\d+:\d+)/)?.[1],
    v: prompt.match(/--v\s+([\d.]+)/)?.[1],
    sv: prompt.match(/--sv\s+(\d+)/)?.[1],
    profile: prompt.match(/--profile\s+([^-\s]+)/)?.[1],
  };
};

export const buildPromptWithStyles = (prompt: string, id?: string): string => {
  const existingParams = parseStyleParameters(prompt);
  const type = getEntityTypeByUuid(id);
  const constantParams = getConstantParameters(type);

  const styleParams = [
    existingParams.sref ? `--sref ${existingParams.sref}` : '',
    existingParams.stylize ? `--stylize ${existingParams.stylize}` : '',
    existingParams.ar ? `--ar ${existingParams.ar}` : '',
    existingParams.v ? `--v ${existingParams.v}` : '',
    existingParams.sv ? `--sv ${existingParams.sv}` : '',
    existingParams.profile ? `--profile ${existingParams.profile}` : '',
    constantParams,
  ]
    .filter(Boolean)
    .join(' ');

  return `${prompt.trim()} ${styleParams}`;
};

export const GENERATION_CONFIGS: Record<GenerationType, GenerationConfig> = {
  image: {
    type: 'image',
    apiEndpoint: '/api/gen/image',
    placeholderCount: 4,
    pollStrategy: 'websocket',
  },
  video: {
    type: 'video',
    apiEndpoint: '/api/gen/video',
    placeholderCount: 4,
    defaultPrompt: 'animated scene,',
    pollStrategy: 'polling',
  },
};

import { GeneratedAsset } from '@/store/generate';

/**
 * Checks if an asset matches the expected aspect ratio.
 * Uses dimensions when available, falls back to prompt parsing.
 */
export const matchesAspectRatio = (asset: GeneratedAsset, expectedAr: string): boolean => {
  // Parse expected aspect ratio (e.g., "3:4" -> { w: 3, h: 4 })
  const [expectedW, expectedH] = expectedAr.split(':').map(Number);
  if (!expectedW || !expectedH) return false;

  // Use dimensions if available
  if (asset.width && asset.height) {
    const assetRatio = asset.width / asset.height;
    const expectedRatio = expectedW / expectedH;
    // Allow small tolerance for floating point comparison
    return Math.abs(assetRatio - expectedRatio) < 0.01;
  }

  // Fall back to prompt parsing
  const assetAr = parseStyleParameters(asset.prompt).ar;
  return assetAr === expectedAr;
};

/**
 * Handles API error responses by extracting meaningful error messages
 */
export const handleApiError = async (res: Response): Promise<string> => {
  let errorMessage = `API error: ${res.status} ${res.statusText}`;
  try {
    const errorData = await res.json();
    if (errorData.error) {
      errorMessage = errorData.error;
    }
  } catch (parseError) {
    console.warn('Could not parse error response:', parseError);
  }
  return errorMessage;
};

/**
 * Creates placeholder items for generation results
 */
export const createPlaceholders = (
  count: number,
  baseItem: Partial<GeneratedAsset>,
): GeneratedAsset[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...baseItem,
    imageIndex: i,
  })) as GeneratedAsset[];
};

/**
 * Handles generation errors with consistent toast messaging
 */
export const handleGenerationError = (
  addToast: (message: string, type: 'error' | 'success', duration?: number) => void,
  error: unknown,
  generationType: string,
): string => {
  const errorMessage =
    error instanceof Error ? error.message : `${generationType} generation failed`;
  addToast(`${generationType} generation failed: ${errorMessage}`, 'error');
  return errorMessage;
};

/**
 * Creates error placeholders when generation fails
 */
export const createErrorPlaceholders = (
  type: 'image' | 'video',
  prompt: string,
  errorMessage: string,
  jobIdPrefix: string = 'error',
  id?: string,
  additionalFields?: Partial<GeneratedAsset>,
): GeneratedAsset[] => {
  const errorId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return createPlaceholders(4, {
    id,
    type,
    prompt,
    loading: 'failed',
    jobId: `${jobIdPrefix}-${errorId}`,
    error: errorMessage,
    ...additionalFields,
  });
};
