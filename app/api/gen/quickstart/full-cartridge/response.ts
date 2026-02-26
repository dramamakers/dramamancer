import { ApiLine } from '@/app/types';
import { sanitizeCartridge } from '@/utils/validate';
import { callAnthropicAPI } from '../../utils';
import { getSystemPrompt, getUserPrompt } from './prompt';
import { FullCartridgeInput, FullCartridgeOutput } from './route';

export async function generateFullCartridge(
  input: FullCartridgeInput,
): Promise<FullCartridgeOutput> {
  const { image, textPrompt, selectedIdeaIds } = input;

  const systemPrompt = getSystemPrompt();
  const userPrompt = getUserPrompt(!!image, textPrompt, selectedIdeaIds);

  const messages: ApiLine[] = [
    {
      role: 'user',
      content: image
        ? [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType as 'image/jpeg' | 'image/png' | 'image/gif',
                data: image.data,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ]
        : [
            {
              type: 'text',
              text: userPrompt,
            },
          ],
    },
  ];

  const responseText = await callAnthropicAPI(systemPrompt, messages, {
    maxTokens: 2048, // Reduced to keep responses smaller
    temperature: 0.9,
  });

  // Parse the JSON response
  try {
    // First, try to extract JSON from code fences (in case model still uses them)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Clean up the text
    jsonText = jsonText.trim();

    // Try to find the JSON object boundaries if there's extra text
    const startIdx = jsonText.indexOf('{');
    const lastIdx = jsonText.lastIndexOf('}');
    if (startIdx !== -1 && lastIdx !== -1 && lastIdx > startIdx) {
      jsonText = jsonText.substring(startIdx, lastIdx + 1);
    }

    const result = JSON.parse(jsonText);

    // Validate required fields
    if (!result.cartridge || !result.cartridge.characters || !result.cartridge.scenes) {
      throw new Error('Missing required cartridge fields');
    }

    // Ensure settings exist and have required fields
    const settings = result.settings || {
      playerId: result.cartridge.characters[0]?.uuid || 'char-1',
      startingSceneId: result.cartridge.scenes[0]?.uuid || 'scene-1',
      shortDescription: result.message || 'A quickstart game',
      genre: 'Adventure',
      visibility: 'private' as const,
      remixable: true,
    };

    // Sanitize the cartridge to fix any AI generation issues with trigger UUIDs
    const sanitizedCartridge = sanitizeCartridge(result.cartridge);

    // Add settings to cartridge if not already there
    return {
      cartridge: sanitizedCartridge,
      message: result.message || 'I created a game for you!',
      title: result.title || 'My Game',
      settings,
    };
  } catch (error) {
    console.error('Failed to parse cartridge JSON:', error);
    console.error('Response text (first 500 chars):', responseText.substring(0, 500));
    console.error(
      'Response text (last 500 chars):',
      responseText.substring(responseText.length - 500),
    );
    throw new Error(
      `Failed to generate valid game cartridge: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
