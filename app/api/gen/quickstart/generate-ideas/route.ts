/**
 * API route for generating story ideas from an image or text prompt.
 */

import { withLLMApi } from '../../utils';
import { generateIdeas } from './response';

export interface GenerateIdeasInput {
  image: { data: string; mediaType: string; preview: string } | null;
  textPrompt: string;
}

export interface GenerateIdeasOutput {
  ideas: Array<{ id: string; description: string; probability: number }>;
}

export async function POST(request: Request) {
  const body = await request.json();
  return withLLMApi<GenerateIdeasInput, GenerateIdeasOutput>(
    generateIdeas,
    'quickstart/generate-ideas',
  )(body, request);
}
