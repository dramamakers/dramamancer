import { CheckApiInputType, CheckApiOutputType } from '@/utils/api/types';
import { withLLMApi } from '../../utils';
import { checkTriggers } from './response';

export async function POST(request: Request) {
  const body = await request.json();
  return withLLMApi<CheckApiInputType, CheckApiOutputType>(checkTriggers, 'story/check')(
    body,
    request,
  );
}
