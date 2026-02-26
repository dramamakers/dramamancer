import { QuickstartLine } from '@/app/types';
import Button from '@/components/Button';
import { isCartridgeOutOfDate } from '@/utils/playthrough';
import Image from 'next/image';
import React from 'react';
import { twMerge } from 'tailwind-merge';
import { useEditorProject } from '../../../EditorContext';
import { useChatContext } from '../ChatContext';
import ImageSelectAction from './ImageSelectAction';

interface BubbleProps {
  message: QuickstartLine;
  onIdeaToggle?: (ideaText: string) => void;
  onExampleClick?: (exampleText: string) => void;
  onSwitchToEditor?: () => void;
  currentInput?: string;
}

export default function Bubble({
  message,
  onIdeaToggle,
  onExampleClick,
  onSwitchToEditor,
  currentInput,
}: BubbleProps) {
  const { project } = useEditorProject();
  const {
    handleStartFromImage,
    handleRestoreCheckpoint,
    handleNewChat,
    switchToEditMode,
    state,
    isLoading,
  } = useChatContext();

  // Parse bullet points from text and return both the cleaned text and extracted ideas
  const parseBulletPoints = (text: string): { cleanedText: string; ideas: string[] } => {
    const bulletPointRegex = /^- (.+)$/gm;
    const matches = Array.from(text.matchAll(bulletPointRegex));

    if (matches.length === 0) {
      return { cleanedText: text, ideas: [] };
    }

    const ideas = matches.map((match) => match[1].trim());
    // Remove bullet points and clean up extra newlines
    const cleanedText = text
      .replace(bulletPointRegex, '')
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Collapse 3+ newlines to 2
      .replace(/^\s+|\s+$/g, ''); // Trim start/end whitespace

    return { cleanedText, ideas };
  };

  const formatText = (text: string) => {
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;

    // Parse <u>example</u> and <u action="...">text</u> tags for clickable items
    const linkRegex = /<u(?:\s+action="([^"]+)")?>(.*?)<\/u>/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(beforeText);
      }

      const action = match[1]; // action attribute value (if present)
      const linkText = match[2]; // text content

      // Determine handler based on action attribute
      let clickHandler: (() => void) | undefined;
      if (action === 'exit') {
        clickHandler = () => {
          if (
            window.confirm(
              "Are you sure? You won't be able to return to the create flow until you start a new game.",
            )
          ) {
            switchToEditMode();
          }
        };
      } else if (action === 'editor') {
        clickHandler = onSwitchToEditor;
      } else {
        clickHandler = () => onExampleClick?.(linkText);
      }

      parts.push(
        <span
          key={`link-${match.index}`}
          onClick={clickHandler}
          className="underline cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
        >
          {linkText}
        </span>,
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    // If no links found, just return the original text
    if (parts.length === 0) {
      parts.push(text);
    }

    // Apply other formatting (bold, italic) to string parts
    return parts.map((part, index) => {
      if (typeof part === 'string') {
        const formatted = part
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
          .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
          .replace(/\n/g, '<br/>'); // line breaks
        return <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      return part;
    });
  };

  // Extract all bullet points from message content
  const extractedIdeas: string[] = [];
  const renderContent = () => {
    return message.content
      .map((content, index) => {
        if (content.type === 'text') {
          if (!content.text || content.text.trim() === '') {
            return (
              <span key={index} className="whitespace-pre-wrap">
                (generate for me)
              </span>
            );
          }

          // Parse bullet points and add to extracted ideas
          const { cleanedText, ideas } = parseBulletPoints(content.text);
          extractedIdeas.push(...ideas);

          // If we extracted ideas, show the cleaned text, otherwise show original
          const textToDisplay = ideas.length > 0 ? cleanedText : content.text;

          // Don't render anything if the text is empty after removing bullet points
          if (!textToDisplay || textToDisplay.trim() === '') {
            return null;
          }

          return (
            <span key={index} className="whitespace-pre-wrap">
              {formatText(textToDisplay)}
            </span>
          );
        }
        if (content.type === 'image' && content.source) {
          return (
            <Image
              key={index}
              src={`data:${content.source.media_type};base64,${content.source.data}`}
              alt="Chat image"
              className="max-w-full rounded-lg mt-2"
              width={100}
              height={100}
            />
          );
        }
        return null;
      })
      .filter(Boolean);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-to-b from-blue-500/20 to-cyan-500/30 text-blue-700 dark:from-blue-400/20 dark:to-cyan-400/30 dark:text-blue-300 rounded-lg p-3 max-w-xs lg:max-w-md">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Render content first to populate extractedIdeas
  const content = renderContent();

  // Combine existing actions with extracted ideas
  const allActions = [
    ...(message.actions || []),
    ...extractedIdeas.map((idea, index) => ({
      type: 'idea-button' as const,
      label: idea,
      actionKey: `idea-extracted-${index}`,
    })),
  ];

  return (
    <div>
      <div className="flex justify-start items-start gap-2">
        <Image
          src="/featured/cat.png"
          alt="Assistant"
          width={32}
          height={32}
          className="rounded-full shrink-0"
        />
        <div className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-3 max-w-xs lg:max-w-md">
          {content}
        </div>
      </div>
      {allActions.length > 0 && (
        <div className="flex justify-start mt-2">
          <div className="flex flex-wrap gap-2">
            {allActions.map((action, index) => {
              if (action.type === 'button') {
                const handler = () => {
                  if (action.actionKey === 'start-from-image') {
                    handleStartFromImage();
                  } else if (action.actionKey === 'delete-and-retry') {
                    handleNewChat();
                  } else {
                    console.error(`Unknown action key: ${action.actionKey}`);
                  }
                };

                return (
                  <Button key={index} onClick={() => handler()} className="text-sm">
                    {action.label}
                  </Button>
                );
              }
              if (action.type === 'image-select') {
                // Disable image selection after user starts generating OR during loading
                const isDisabled = state.type !== 'awaiting-image' || isLoading;
                return <ImageSelectAction key={index} disabled={isDisabled} />;
              }
              if (action.type === 'idea-button') {
                // Determine if this idea is selected:
                // - If currentInput is provided (latest message), check if idea text is in input
                // - Otherwise, use the stored checked state (for older messages)
                const isSelected =
                  currentInput !== undefined
                    ? currentInput.includes(action.label)
                    : 'checked' in action
                      ? action.checked
                      : false;

                return (
                  <Button
                    key={index}
                    onClick={() => {
                      if (onIdeaToggle) {
                        onIdeaToggle(action.label);
                      }
                    }}
                    className={twMerge(
                      'ml-10 text-sm',
                      isSelected ? 'bg-blue-500 hover:bg-blue-600 text-white' : '',
                    )}
                  >
                    {action.label}
                  </Button>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
      {message.before && message.after && (
        <div className="flex justify-start mt-2 ml-10">
          <div className="flex gap-2">
            <Button
              onClick={() =>
                confirm(
                  'Are you sure you want to undo changes? This will revert your game to the previous state. Any unsaved changes will be lost.',
                ) && handleRestoreCheckpoint(message.before!)
              }
              disabled={!isCartridgeOutOfDate(project, message.before!)}
              className="text-sm"
            >
              ← Undo changes
            </Button>
            <Button
              onClick={() => {
                if (
                  !confirm(
                    'Are you sure you want to redo changes? This may overwrite your current game. Any unsaved changes will be lost.',
                  )
                ) {
                  return;
                }
                handleRestoreCheckpoint(message.after!);
              }}
              disabled={!isCartridgeOutOfDate(project, message.after!)}
              className="text-sm"
            >
              Redo changes →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
