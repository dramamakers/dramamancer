import { DisplayLine } from '@/app/types';

export function playthroughHasEnded(lines: DisplayLine[]) {
  if (!lines || lines.length === 0) return false;
  const lastLine = lines[lines.length - 1];
  return lastLine.metadata?.shouldEnd || false;
}
