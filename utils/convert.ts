import { DisplayLine, Scene, XmlLine } from '@/app/types';
import { getSceneTitle } from './game';

function getLineText(line: DisplayLine, scenes: Scene[]): string {
  if (line.metadata?.sceneId && !line.text.trim()) {
    return getSceneTitle(scenes, line.metadata?.sceneId);
  }
  return line.text.trim();
}

/**
 * Convert a DisplayLine to an XmlLine by manually adding <ch> tags around character dialogue.
 */
export function convertDisplayLineToXmlLine(line: DisplayLine, scenes: Scene[]): XmlLine {
  const lineText = getLineText(line, scenes);

  if (line.type === 'character' || line.type === 'player') {
    return {
      text: `<ch name="${line.characterName}">${lineText}</ch>`,
      role: line.type === 'player' ? 'user' : 'assistant',
    };
  }

  return {
    ...line,
    text: lineText,
    role: 'assistant',
  };
}

export function convertDisplayLineToXmlLines(lines: DisplayLine[], scenes: Scene[]): XmlLine[] {
  return lines.map((line) => convertDisplayLineToXmlLine(line, scenes));
}

/**
 * Extracts dialogue and narration elements and returns a list of DisplayLine objects.
 * Anything outside of <ch> tags is treated as narration.
 */
export function convertXmlLineToDisplayLine(line: XmlLine): DisplayLine[] {
  const lines: DisplayLine[] = [];

  if (line.text.trim() !== '') {
    // Extract character lines
    const characterMatches = Array.from(line.text.matchAll(/<ch name="([^"]+)">([\s\S]*?)<\/ch>/g));

    // Extract player lines
    const playerMatches = Array.from(line.text.matchAll(/<player>([\s\S]*?)<\/player>/g));

    // Extract other XML tags and treat their content as narration
    const otherTagMatches = Array.from(
      line.text.matchAll(/<(?!ch|player|\/)[^>]+>([\s\S]*?)<\/[^>]+>/g),
    );

    // Collect all matches with their positions
    const allMatches: Array<DisplayLine & { index: number; endIndex: number }> = [];

    characterMatches.forEach((match) => {
      const characterName = match[1];
      const content = match[2].trim();

      // Check if character name contains "narrator" or "narration" (case-insensitive)
      const normalizedName = characterName.toLowerCase().trim();
      const isNarrator =
        normalizedName.includes('narrator') || normalizedName.includes('narration');

      allMatches.push({
        type: isNarrator ? 'narration' : 'character',
        index: match.index!,
        endIndex: match.index! + match[0].length,
        text: content,
        characterName: isNarrator ? undefined : characterName,
      });
    });

    playerMatches.forEach((match) => {
      allMatches.push({
        type: 'player',
        index: match.index!,
        endIndex: match.index! + match[0].length,
        text: match[1].trim(),
      });
    });

    otherTagMatches.forEach((match) => {
      allMatches.push({
        type: 'narration',
        index: match.index!,
        endIndex: match.index! + match[0].length,
        text: match[1].trim(),
      });
    });

    // Sort by position in text
    allMatches.sort((a, b) => a.index - b.index);

    // Process text, treating everything outside tags as narration
    let currentIndex = 0;

    allMatches.forEach((match) => {
      // Add narration before this match if there's text
      if (match.index > currentIndex) {
        const narrationText = line.text.slice(currentIndex, match.index).trim();
        if (narrationText) {
          lines.push({
            type: 'narration',
            text: narrationText,
          });
        }
      }

      // Add the character, player, or narration line
      if (match.type === 'character') {
        lines.push({
          type: 'character',
          text: match.text,
          characterName: match.characterName!,
        });
      } else if (match.type === 'player') {
        lines.push({
          type: 'player',
          text: match.text,
        });
      } else {
        lines.push({
          type: 'narration',
          text: match.text,
        });
      }

      currentIndex = match.endIndex;
    });

    // Add any remaining narration after the last match
    if (currentIndex < line.text.length) {
      const remainingText = line.text.slice(currentIndex).trim();
      if (remainingText) {
        lines.push({
          type: 'narration',
          text: remainingText,
        });
      }
    }
  }

  // If no matches found, treat the entire text as narration
  if (lines.length === 0) {
    lines.push({
      type: 'narration',
      text: line.text.trim(),
    });
  }

  // Add metadata to the last line
  lines[lines.length - 1].metadata = line.metadata;
  return lines;
}

export function convertXmlLinesToDisplayLines(lines: XmlLine[]): DisplayLine[] {
  return lines.flatMap(convertXmlLineToDisplayLine);
}
