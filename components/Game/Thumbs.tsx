import { Playthrough } from '@/app/types';
import { useLineLikes } from '@/utils/api/hooks';
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import {
  HandThumbDownIcon as HandThumbDownSolidIcon,
  HandThumbUpIcon as HandThumbUpSolidIcon,
} from '@heroicons/react/24/solid';
import { twMerge } from 'tailwind-merge';
import Button from '../Button';
import { useTooltip } from '../Tooltip';

export default function Thumbs({
  selectedPlaythrough,
  lineIndex,
  readOnly = false,
}: {
  selectedPlaythrough: Playthrough | undefined;
  lineIndex: number | undefined;
  readOnly?: boolean;
}) {
  const { showTooltip, hideTooltip } = useTooltip();
  const { setLineLike, removeLineLike, lineLikes } = useLineLikes(selectedPlaythrough);
  const isLiked = lineIndex !== undefined ? lineLikes.liked.includes(lineIndex) : false;
  const isDisliked = lineIndex !== undefined ? lineLikes.disliked.includes(lineIndex) : false;

  return (
    <>
      <Button
        variant="icon"
        className={twMerge('h-fit opacity-50', isLiked && 'opacity-100!')}
        onMouseOver={() =>
          showTooltip(
            readOnly ? 'Read-only mode' : isLiked ? 'Unlike this line' : 'I like this line',
          )
        }
        onMouseOut={hideTooltip}
        onClick={
          readOnly
            ? undefined
            : async (ev) => {
                ev.stopPropagation();
                hideTooltip();
                if (isLiked) {
                  await removeLineLike(lineIndex!);
                } else {
                  await setLineLike(lineIndex!, true);
                }
              }
        }
      >
        {isLiked ? (
          <HandThumbUpSolidIcon className="w-4 h-4" />
        ) : (
          <HandThumbUpIcon className="w-4 h-4" />
        )}
      </Button>
      <Button
        variant="icon"
        className={twMerge('h-fit opacity-50', isDisliked && 'opacity-100!')}
        onMouseOver={() =>
          showTooltip(
            readOnly
              ? 'Read-only mode'
              : isDisliked
                ? 'Undislike this line'
                : 'I dislike this line',
          )
        }
        onMouseOut={hideTooltip}
        onClick={
          readOnly
            ? undefined
            : async (ev) => {
                ev.stopPropagation();
                hideTooltip();
                if (isDisliked) {
                  await removeLineLike(lineIndex!);
                } else {
                  await setLineLike(lineIndex!, false);
                }
              }
        }
      >
        {isDisliked ? (
          <HandThumbDownSolidIcon className="w-4 h-4" />
        ) : (
          <HandThumbDownIcon className="w-4 h-4" />
        )}
      </Button>
    </>
  );
}
