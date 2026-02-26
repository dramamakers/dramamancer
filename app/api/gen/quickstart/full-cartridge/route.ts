/**
 * API route for generating a full cartridge from an image or text prompt.
 */

import { Cartridge, QuickstartImageData } from '@/app/types';
import { withLLMApi } from '../../utils';
import { generateFullCartridge } from './response';

export interface FullCartridgeInput {
  image: QuickstartImageData | null;
  textPrompt: string;
  selectedIdeaIds: string[];
}

export interface FullCartridgeOutput {
  cartridge: Cartridge;
  message: string;
  title: string;
  settings: {
    playerId: string;
    startingSceneId: string;
    shortDescription: string;
    genre: string;
    visibility: 'public' | 'unlisted' | 'private';
    remixable: boolean;
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  return withLLMApi<FullCartridgeInput, FullCartridgeOutput>(
    generateFullCartridge,
    'quickstart/full-cartridge',
  )(body, request);
}
