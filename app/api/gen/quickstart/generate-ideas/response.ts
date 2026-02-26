import { ApiLine } from '@/app/types';
import { callAnthropicAPI } from '../../utils';
import { getSystemPrompt, getUserPrompt } from './prompt';
import { GenerateIdeasInput, GenerateIdeasOutput } from './route';

export async function generateIdeas(input: GenerateIdeasInput): Promise<GenerateIdeasOutput> {
  const { image, textPrompt } = input;

  const systemPrompt = getSystemPrompt();
  const userPrompt = getUserPrompt(!!image, textPrompt);

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
    maxTokens: 1024,
    temperature: 0.9,
  });

  // Parse the JSON response
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;
    const result = JSON.parse(jsonText.trim());

    return {
      ideas: result.ideas || [],
    };
  } catch (error) {
    console.error('Failed to parse ideas JSON:', error);
    console.error('Response text:', responseText);
    throw new Error('Failed to generate valid story ideas');
  }
}
