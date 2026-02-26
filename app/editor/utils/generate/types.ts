import { EntityType } from '../entity';

export interface VideoGenerationResult {
  jobId: string;
  videoUrls?: string[];
  status: 'starting' | 'generating' | 'completed' | 'failed';
  error?: string;
}

export type GenerationType = 'image' | 'video';

export interface GenerationConfig {
  type: GenerationType;
  apiEndpoint: string;
  placeholderCount: number;
  defaultPrompt?: string;
  pollStrategy: 'websocket' | 'polling';
}

export interface GenerationRequest {
  prompt?: string;
  imageUrl?: string;
  entityType: EntityType;
  id?: string;
}

export interface GenerationResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  videoUrls?: string[];
  status?: string;
}
