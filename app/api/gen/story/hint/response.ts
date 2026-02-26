import { ApiLine, XmlLine } from '@/app/types';
import { HintApiInputType, HintApiOutputType } from '@/utils/api/types';
import { callAnthropicAPI } from '../../utils';
import { getSystemPrompt, getUserPrompt } from './prompt';

export async function generateHintNarration(input: HintApiInputType): Promise<HintApiOutputType> {
  try {
    const { lines: previousLines, triggerConditions, style, playerCharacterName } = input;
    const systemPrompt = getSystemPrompt();

    const apiLines: ApiLine[] = (
      previousLines.map((line) => {
        if (!line.text) {
          return undefined;
        }
        return {
          role: line.role,
          content: [
            {
              type: 'text',
              text: line.text,
            },
          ],
        };
      }) as ApiLine[]
    ).filter((line) => line !== undefined);

    const userPrompt = getUserPrompt({
      triggerConditions,
      style,
      playerCharacterName,
    });

    const text = await callAnthropicAPI(
      systemPrompt,
      [
        ...apiLines,
        {
          role: 'user' as const,
          content: userPrompt,
        },
      ] as ApiLine[],
      {
        temperature: 0.7, // Higher temperature for more creative hints
      },
    );

    console.log('\n\n--- Generated hint ---\n', text, '\n\n');

    // The hint response should be pure narration
    const lines: XmlLine[] = [
      {
        role: 'assistant',
        text: text.trim(),
        metadata: {
          shouldPause: true,
        },
      },
    ];

    return {
      lines,
    };
  } catch (error) {
    console.error('Error in generateHintNarration:', error);
    return {
      lines: [
        {
          role: 'assistant',
          text: 'You pause for a moment, considering your options. You could look around, investigate the area, or try to escape.',
          metadata: {
            shouldPause: true,
          },
        },
      ],
    };
  }
}
