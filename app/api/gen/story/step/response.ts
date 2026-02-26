import { ApiLine, END_SCENE_ID, XmlLine } from '@/app/types';
import { StepApiInputType, StepApiOutputType } from '@/utils/api/types';
import { convertDisplayLineToXmlLines } from '@/utils/convert';
import { getScene } from '@/utils/game';
import { getSceneTransitionLines } from '@/utils/lines';
import { callAnthropicAPI } from '../../utils';
import { parseXmlFormat } from './parse';
import { getSystemPrompt, getUserPrompt } from './prompt';

export async function generateNextLines(input: StepApiInputType): Promise<StepApiOutputType> {
  try {
    const { project, playthrough, triggers } = input;
    const { scenes } = project.cartridge;
    const { lines: displayLines, currentSceneId } = playthrough;
    const previousLines = convertDisplayLineToXmlLines(displayLines, scenes);
    const scene = getScene({ cartridge: { scenes } }, currentSceneId);

    // Get the first goToSceneId; prioritize action triggers over fallback triggers
    let eventTrigger = triggers.find((t) => t.goToSceneId !== undefined && t.type === 'action');
    if (!eventTrigger) {
      eventTrigger = triggers.find((t) => t.goToSceneId !== undefined);
    }
    if (!eventTrigger) {
      eventTrigger = triggers[0];
    }
    const { endingName, goToSceneId } = eventTrigger || {};
    const triggerNarratives = triggers.map((t) => t.narrative);
    const systemPrompt = getSystemPrompt({
      project,
      scene,
      goToSceneId,
    });

    const apiLines: ApiLine[] = previousLines.map((line) => ({
      role: line.role,
      content: [
        {
          type: 'text',
          text: `PLAN: ${line.metadata?.plan}\nLINE: ${line.text}\nPAUSE: ${line.metadata?.shouldPause}`,
        },
      ],
    }));

    const text = await callAnthropicAPI(
      systemPrompt,
      [
        ...apiLines,
        {
          role: 'user' as const,
          content: getUserPrompt({
            project,
            scene,
            goToSceneId,
            triggerNarratives,
            previousLines,
          }),
        },
      ] as ApiLine[],
      {
        temperature: 0.5,
      },
    );
    console.log(
      '\n\n--- Generated line ---\n',
      previousLines[previousLines.length - 1].text,
      text,
      '\n\n',
    );

    // Parse the response into PLAN:/LINE:/PAUSE:/END: sections
    const { plan, lineContent, shouldPause } = parseXmlFormat(text);

    // Store the response in XML format
    const lines: XmlLine[] = [
      {
        role: 'assistant',
        text: lineContent,
        metadata: {
          plan,
          shouldPause,
        },
      },
    ];

    if (lines.length === 0) {
      throw new Error('No lines generated');
    }

    // Handle end/scene transitions
    if (goToSceneId === END_SCENE_ID) {
      lines.push({
        role: 'assistant',
        text: `END: ${endingName || 'Game Over'}`,
        metadata: { shouldEnd: true, endingName },
      });
    } else if (goToSceneId !== undefined) {
      const newScene = getScene({ cartridge: { scenes } }, goToSceneId);
      const sceneTransitionLines = await getSceneTransitionLines({
        newScene,
      });
      sceneTransitionLines.forEach((line) => {
        lines.push({
          role: 'assistant',
          text: line.text,
          metadata: line.metadata,
        });
      });
    }

    return {
      lines,
    };
  } catch (error) {
    console.error('Error in generateNextLines:', error);
    return {
      lines: [],
    };
  }
}
