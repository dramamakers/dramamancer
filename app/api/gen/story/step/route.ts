/**
 * API route for generating the next lines of the story.
 * Returns both the lines and whether to pause for user input.
 */

import { StepApiInputType, StepApiOutputType } from '@/utils/api/types';
import { withLLMApi } from '../../utils';
import { generateNextLines } from './response';

export async function POST(request: Request) {
  const body = await request.json();
  return withLLMApi<StepApiInputType, StepApiOutputType>(generateNextLines, 'story/step')(
    body,
    request,
  );
}
