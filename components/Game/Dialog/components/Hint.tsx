import { StoryState } from '@/app/types';
import { useHintColors } from '@/utils/color';
import { useMemo } from 'react';

type HintTextPart = { type: 'text' | 'action'; content: string };

const parseHintText = (text: string): HintTextPart[] => {
  const parts: HintTextPart[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text' as const,
        content: text.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: 'action' as const,
      content: match[1],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text' as const,
      content: text.slice(lastIndex),
    });
  }

  return parts;
};

export default function HintText({
  text,
  storyState,
  backgroundImageUrl,
}: {
  text: string;
  storyState?: StoryState;
  backgroundImageUrl?: string;
}) {
  const { hintBackgroundColor, hintTextColor } = useHintColors(backgroundImageUrl ?? '');
  const parts = useMemo(() => parseHintText(text), [text]);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'action') {
          return (
            <button
              key={index}
              disabled={
                !storyState || storyState.currentLine.metadata?.status !== 'waiting-on-user'
              }
              onClick={() => storyState && storyState.handleUserInput(`(${part.content})`)}
              className="inline px-2 rounded cursor-pointer hover:brightness-95 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              style={{
                backgroundColor:
                  hintBackgroundColor ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? '#333333'
                    : '#f0f0f0'),
                color:
                  hintTextColor ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? '#f0f0f0'
                    : '#333333'),
              }}
            >
              → {part.content}
            </button>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </>
  );
}
