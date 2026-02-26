import { DisplayLine, Playthrough } from '@/app/types';
import Button from '@/components/Button';
import { getScene } from '@/utils/game';
import Modal from '../../../Modal';
import { useProject } from '../../ProjectContext';
import HistoryLine from './HistoryLine';

export const formatScript = (lines: DisplayLine[]) => {
  // Given hint lines are now wrapped in {{ double brackets }}
  // unwrap them for history
  return lines.map((line) => {
    if (line.type === 'hint') {
      return {
        ...line,
        text: line.text.replace(/{{/g, '').replace(/}}/g, ''),
      };
    }
    return line;
  });
};

export function History({
  selectedPlaythrough,
  onClose,
}: {
  selectedPlaythrough?: Playthrough | null;
  onClose: () => void;
}) {
  const { storyState, updatePlaythrough, currentPlaythrough } = useProject();
  const project = selectedPlaythrough?.projectSnapshot;
  if (!selectedPlaythrough || !project) return null;
  const displayLines = formatScript(selectedPlaythrough.lines) || selectedPlaythrough.lines;

  const handleLineIdxClick = (lineIdx: number) => {
    if (!selectedPlaythrough) return;
    storyState.setCurrentLineIdx(lineIdx);
    onClose();
  };

  const handleDownload = () => {
    // Download as plaintext, script format
    const text = displayLines
      .map((line) => {
        if (line.metadata?.sceneId) {
          const sceneName = getScene(project, line.metadata.sceneId)?.title;
          return `--- scene: ${sceneName} ---`;
        }

        if (line.type === 'character') {
          return `${line.characterName}: ${line.text}`;
        }
        if (line.type === 'narration') {
          return line.text;
        }
        return `${line.type}: ${line.text}`;
      })
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}.txt`;
    a.click();
  };

  return (
    <Modal
      onClose={onClose}
      title="History"
      actions={<Button onClick={handleDownload}>Download</Button>}
    >
      {displayLines.length > 0 ? (
        <>
          {displayLines.map((line, index) => {
            const prev = index > 0 ? displayLines[index - 1] : undefined;
            const isContinuation =
              !!prev &&
              (line.type === 'character' || line.type === 'player') &&
              prev.type === line.type &&
              ((line.type === 'character' &&
                prev.characterName?.toLowerCase() === line.characterName?.toLowerCase()) ||
                line.type === 'player');
            return (
              <div
                key={index}
                onClick={() => {
                  if (selectedPlaythrough.id === currentPlaythrough?.id) {
                    handleLineIdxClick(index);
                  } else {
                    updatePlaythrough({
                      action: 'load',
                      playthrough: {
                        ...selectedPlaythrough,
                        currentLineIdx: index,
                      },
                    });
                  }
                }}
                className="cursor-pointer hover:opacity-60 flex flex-col gap-3 py-3"
              >
                <HistoryLine
                  line={line}
                  {...project.cartridge}
                  isContinuation={isContinuation}
                  lineIndex={index}
                />
              </div>
            );
          })}
        </>
      ) : (
        <>No history yet.</>
      )}
    </Modal>
  );
}
