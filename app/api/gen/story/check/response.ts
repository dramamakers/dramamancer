import { ApiLine, XmlLine } from '@/app/types';
import { CheckApiInputType, CheckApiOutputType } from '@/utils/api/types';
import { callAnthropicAPI } from '../../utils';
import { getCheckPrompt } from './prompt';

export async function checkTriggers(input: CheckApiInputType): Promise<CheckApiOutputType> {
  const { possibleTriggers, lines } = input;
  const prompt = getCheckPrompt({ possibleTriggers });

  // Filter out empty lines and ensure all lines have non-empty text
  const validLines = lines.filter((line: XmlLine) => line.text && line.text.trim() !== '');

  if (validLines.length === 0) {
    console.log('No valid lines found, returning empty triggers');
    return { activatedTriggerIds: [] };
  }

  const previousLines: ApiLine[] = validLines.map((line: XmlLine) => ({
    role: 'user' as const,
    content: [
      {
        type: 'text',
        text: line.text.trim(),
      },
    ],
  }));

  const messages = [
    ...previousLines,
    {
      role: 'user' as const,
      content: [
        {
          type: 'text',
          text: 'Check if any triggers have been met based on the story state.',
        },
      ],
    },
  ] as ApiLine[];

  const text = await callAnthropicAPI(
    prompt,
    messages,
    { temperature: 0.1 }, // Lower temperature for more deterministic responses
  );

  // More robust parsing of the triggers section
  const triggersMatch = text.match(/TRIGGERS:\s*(.*?)(?:\n|$)/);
  if (!triggersMatch) {
    console.error('Could not find TRIGGERS section in response:', text);
    return { activatedTriggerIds: [] };
  }

  const triggersSection = triggersMatch[1].trim();
  const activatedTriggerKeys =
    triggersSection === 'NONE' || triggersSection === ''
      ? []
      : triggersSection
          .split(',')
          .map((t: string) => parseInt(t.trim()))
          .filter((t: number) => !isNaN(t));

  console.log('Parsed triggers keys:', activatedTriggerKeys);

  // Convert activated trigger indices to trigger IDs
  const activatedTriggerIds = activatedTriggerKeys.map((t: number) => {
    const trigger = Object.values(possibleTriggers)[t];
    return trigger.uuid;
  });

  console.log('Activated trigger IDs:', activatedTriggerIds);
  return { activatedTriggerIds };
}
