/**
 * API route for generating helpful hint narration for players.
 * Returns narration lines that suggest next steps without spoiling triggers.
 */

import { HintApiInputType, HintApiOutputType } from '@/utils/api/types';
import { withLLMApi } from '../../utils';
import { generateHintNarration } from './response';

export async function POST(request: Request) {
  const body = await request.json();
  return withLLMApi<HintApiInputType, HintApiOutputType>(generateHintNarration, 'story/hint')(
    body,
    request,
  );
}
