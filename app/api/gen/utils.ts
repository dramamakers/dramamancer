import { ApiLine } from '@/app/types';
import { NextResponse } from 'next/server';

export interface ApiOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Helper to get request ID from headers (set by middleware)
export function getRequestId(request?: Request): string {
  if (!request) return 'no-req-id';
  return request.headers.get('x-request-id') || 'no-req-id';
}

const DEFAULT_API_OPTIONS: ApiOptions = {
  model: 'claude-sonnet-4-20250514',
  temperature: 0.8,
  maxTokens: 1000,
};

/**
 * Make a request to the Anthropic API
 */
export async function callAnthropicAPI(
  systemPrompt: string,
  messages: Array<ApiLine>,
  options: ApiOptions = {},
) {
  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    throw new Error('Anthropic API key is not configured');
  }

  const { model, temperature, maxTokens } = { ...DEFAULT_API_OPTIONS, ...options };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    } as HeadersInit,
    body: JSON.stringify({
      model,
      messages,
      system: systemPrompt,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Anthropic API error (${response.status})`;
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = `${errorMessage}: ${errorText}`;
      }
    } catch {
      // If parsing fails, use the raw error text
      errorMessage = `${errorMessage}: ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data) {
    throw new Error('Empty response from API');
  }

  if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
    console.error('Unexpected API response structure:', JSON.stringify(data));
    throw new Error('Invalid API response structure: content array missing or empty');
  }

  const contentItem = data.content[0];
  if (!contentItem || typeof contentItem.text !== 'string') {
    console.error('Unexpected content item structure:', JSON.stringify(contentItem));
    throw new Error('Invalid content item: text field missing or not a string');
  }

  return contentItem.text;
}

/**
 * Wraps a function in a NextResponse for LLM operations
 */
export function withLLMApi<T, R>(
  fn: (input: T) => Promise<R>,
  routeName?: string,
): (input: T, request?: Request) => Promise<NextResponse<R | { error: string }>> {
  return async (input: T, request?: Request) => {
    const reqId = getRequestId(request);
    const route = routeName || 'LLM-API';

    try {
      console.log(`[${reqId}] ✅ ${route}: Processing request`);
      const response: R = await fn(input);
      console.log(`[${reqId}] ✅ ${route}: Completed successfully`);
      return NextResponse.json(response);
    } catch (error) {
      console.error(`[${reqId}] ❌ ${route} Error:`, error);
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({ error: 'Request was cancelled' }, { status: 499 });
      }

      // Properly serialize error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  };
}
