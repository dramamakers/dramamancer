import { getCroppedSpriteStyle } from '@/app/constants';
import { Character } from '@/app/types';
import FeatheredScroll from '@/components/FeatheredScroll';
import { useTooltip } from '@/components/Tooltip';
import { getPlayerCharacter, getSprite } from '@/utils/game';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import { useProject } from '../../ProjectContext';

function CharacterCard({ character, hidden = false }: { character: Character; hidden?: boolean }) {
  const { showTooltip, hideTooltip } = useTooltip();
  const sprite = getSprite(character);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-500"
        onMouseOver={() => {
          if (hidden) {
            showTooltip(`Unlock ${character.name} by meeting them in-game.`);
          }
        }}
        onMouseOut={hideTooltip}
      >
        <Image
          src={sprite.imageUrl || '/placeholder.png'}
          alt={character.name || 'Character'}
          width={100}
          height={100}
          style={{
            ...(sprite.imageUrl
              ? getCroppedSpriteStyle(getSprite(character))
              : {
                  height: '100%',
                }),
          }}
          className={twMerge(hidden && 'blur-xs scale-120 opacity-30')}
        />
      </div>
      <p className="text-sm truncate w-20 text-center">{hidden ? '???' : character.name}</p>
    </div>
  );
}

export default function CharacterPreviews() {
  const { playthroughs, project } = useProject();
  const playerCharacter = getPlayerCharacter(project);
  const allOtherCharacters = project.cartridge.characters.filter(
    (character) => character.uuid !== playerCharacter.uuid,
  );
  const charactersSeen = allOtherCharacters.filter((character) => {
    return playthroughs.some((playthrough) =>
      playthrough.lines.some((line) => line.characterName === character.name),
    );
  });

  return (
    <div className="flex gap-10  flex-row items-center justify-center">
      <div className="flex flex-col items-center">
        <p>You are:</p>
        <CharacterCard character={playerCharacter} />
      </div>
      {allOtherCharacters.length > 1 && (
        <div className="flex flex-col text-center w-1/2 @2xl:w-full max-w-1/2">
          <p>You will meet:</p>
          <FeatheredScroll
            className={twMerge(
              'w-full flex gap-1',
              allOtherCharacters.length < 3 && 'justify-center',
            )}
          >
            {allOtherCharacters.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                hidden={!charactersSeen.includes(character)}
              />
            ))}
          </FeatheredScroll>
        </div>
      )}
    </div>
  );
}
