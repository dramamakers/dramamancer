import { getCroppedSpriteStyle } from '@/app/constants';
import { Character, DisplayLine, Scene, Sprite } from '@/app/types';
import { getSceneTitle, getSprite } from '@/utils/game';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

function HistoryEventImage({ eventImageUrl }: { eventImageUrl?: string }) {
  if (!eventImageUrl) return null;
  return (
    <div className="w-full my-2">
      <Image
        src={eventImageUrl ?? ''}
        alt="Event scene"
        width={400}
        height={300}
        className="w-full max-w-md mx-auto rounded-lg shadow-md object-cover"
        style={{ aspectRatio: '4/3' }}
        unoptimized
      />
    </div>
  );
}

export default function HistoryLine({
  line,
  scenes,
  characters,
  isContinuation = false,
}: {
  line: DisplayLine;
  scenes: Scene[];
  characters: Character[];
  isContinuation?: boolean;
  lineIndex?: number;
}) {
  if (line.metadata?.sceneId !== null && line.metadata?.sceneId !== undefined) {
    const sceneTitle = getSceneTitle(scenes, line.metadata.sceneId);
    return <div>─── {sceneTitle} ───</div>;
  }

  const eventImageUrl = line.metadata?.eventImageUrl;

  if (line.type === 'character' || line.type === 'player') {
    let character: Character | undefined;
    const characterName: string | undefined = line.characterName;
    if (line.type === 'character') {
      character = characters.find(
        (c: Character) => c.name.toLowerCase() === line.characterName?.toLowerCase(),
      );
    } else if (line.type === 'player') {
      character = characters[0];
    }

    let sprite: Sprite | undefined;
    try {
      sprite = getSprite(character!);
    } catch (error) {
      console.error(`Error getting character sprite for ${character?.name}:`, error);
      sprite = undefined;
    }

    return (
      <>
        <div
          className={twMerge(
            'flex items-start gap-3',
            line.type === 'player' &&
              'bg-slate-100 dark:bg-slate-900 p-3 rounded-lg group relative',
          )}
        >
          {!isContinuation && sprite?.imageUrl && (
            <div className="w-20 h-20 flex-shrink-0 rounded object-cover overflow-hidden relative">
              <Image
                src={sprite.imageUrl}
                alt={character!.name}
                width={80}
                height={80}
                style={{
                  ...getCroppedSpriteStyle(sprite),
                }}
                loading="eager"
                priority
                unoptimized
              />
            </div>
          )}
          {isContinuation && sprite?.imageUrl && <div style={{ visibility: 'hidden' as const }} />}
          <div>
            {!isContinuation && (
              <div>
                {character?.name || characterName || 'Unknown'}{' '}
                {line.type === 'player' ? '(Player)' : ''}
              </div>
            )}
            <div>{line.text}</div>
          </div>
        </div>
        <HistoryEventImage eventImageUrl={eventImageUrl} />
      </>
    );
  } else {
    return (
      <>
        <div>{line.text}</div>
        <HistoryEventImage eventImageUrl={eventImageUrl} />
      </>
    );
  }
}
