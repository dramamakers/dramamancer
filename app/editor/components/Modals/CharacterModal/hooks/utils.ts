import { Character, DisplayLine } from '@/app/types';

export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return base64;
}

/**
 * Public version: no cutout/upload API. Returns the source URL as-is.
 * Users provide images via URL or file upload.
 */
export async function generateCutoutImage(sourceImageUrl: string): Promise<{
  cutoutUrl: string;
  sourceUrl: string;
  dataUrl: string;
}> {
  return {
    cutoutUrl: sourceImageUrl,
    sourceUrl: sourceImageUrl,
    dataUrl: '',
  };
}

export const getPreviewLine = (character: Character): DisplayLine => {
  return {
    type: 'character',
    text: 'Hello! This is a preview of how your character will appear in-game.',
    characterName: character.name,
  };
};
