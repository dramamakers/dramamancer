'use client';
import { Playthrough } from '@/app/types';
import Button from '@/components/Button';
import { History } from '@/components/Game/Panels/HistoryPanel';
import { useProject } from '@/components/Game/ProjectContext';
import { playthroughHasEnded } from '@/components/Game/utils/utils';
import { useMenu } from '@/components/Menu/MenuContext';
import { downloadFile } from '@/utils/files';
import { formatTimeAgo } from '@/utils/format';
import { getSceneTitle } from '@/utils/game';
import { isGameOutOfDate } from '@/utils/playthrough';
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  EllipsisVerticalIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useEditorProject } from '../../EditorContext';

function PlaythroughRow({
  playthrough,
  setSelectedPlaythrough,
}: {
  playthrough: Playthrough;
  setSelectedPlaythrough: (playthrough: Playthrough) => void;
}) {
  const { projectSnapshot, updatedAt, currentSceneId } = playthrough;
  const ended = playthroughHasEnded(playthrough.lines);
  const { updatePlaythrough } = useProject();
  const { project } = useEditorProject();
  const { showMenu } = useMenu();

  return (
    <tr key={playthrough.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col max-w-xs">
          <span className="truncate">
            {getSceneTitle(projectSnapshot.cartridge.scenes, currentSceneId)}
          </span>
          <span className="text-slate-600 dark:text-slate-400 text-sm">
            {ended ? 'Ended' : 'In progress'} • {playthrough.lines.length} lines
          </span>
        </div>
      </td>
      <td className="px-6 text-slate-600 dark:text-slate-400 text-sm py-4 whitespace-nowrap">
        {formatTimeAgo(playthrough.updatedAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {!isGameOutOfDate(project, playthrough) ? (
          <span className="text-green-600 dark:text-green-400">Latest version</span>
        ) : (
          <div className="flex flex-col">
            <span>{formatTimeAgo(updatedAt)}</span>
            <span className="text-slate-600 dark:text-slate-400">Outdated version</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Button
          variant="icon"
          className="text-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            showMenu(e, [
              {
                label: 'Continue',
                value: 'resume',
                Icon: PlayIcon,
                onSelect: () =>
                  updatePlaythrough({
                    action: 'load',
                    playthrough: playthrough,
                  }),
              },
              {
                label: 'View history',
                value: 'history',
                Icon: BookOpenIcon,
                onSelect: () => setSelectedPlaythrough(playthrough),
              },
              {
                label: 'Download cartridge',
                value: 'download-cartridge',
                Icon: ArrowDownTrayIcon,
                onSelect: () =>
                  downloadFile(
                    JSON.parse(
                      JSON.stringify({
                        title: project?.title,
                        scenes: projectSnapshot.cartridge.scenes,
                        characters: projectSnapshot.cartridge.characters,
                        style: projectSnapshot.cartridge.style,
                      }),
                    ),
                    `cartridge-${project?.title}-${playthrough.id}.json`,
                  ),
              },
            ]);
          }}
        >
          <EllipsisVerticalIcon className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}

export default function PlaythroughsList() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const { playthroughs } = useProject();
  const [selectedPlaythrough, setSelectedPlaythrough] = useState<Playthrough | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setIsAtTop(target.scrollTop === 0);
    setIsAtBottom(target.scrollTop + target.clientHeight >= target.scrollHeight);
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg">
      <div>
        <h1 id="characters">Playthroughs</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          View your own past playthroughs of your game, across all versions.
        </p>
      </div>
      <div
        className={twMerge(
          'max-h-100 pb-10 overflow-y-auto [scrollbar-width:none]',
          !isAtTop &&
            !isAtBottom &&
            '[mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)] [webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]',
          !isAtTop &&
            isAtBottom &&
            '[mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_100%)] [webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_100%)]',
          isAtTop &&
            !isAtBottom &&
            '[mask-image:linear-gradient(to_bottom,black_0%,black_85%,transparent_100%)] [webkit-mask-image:linear-gradient(to_bottom,black_0%,black_85%,transparent_100%)]',
          isAtTop && isAtBottom && 'mask-none',
        )}
        onScroll={handleScroll}
      >
        {playthroughs.length === 0 ? (
          <div className="text-slate-500 text-sm flex flex-col gap-2 items-center justify-center relative">
            <p className="absolute text-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600">
              Start playtesting your game to collect playthroughs.
            </p>
            <div className="flex flex-col gap-2 w-full">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 bg-slate-200 dark:bg-slate-900 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full divide-y-2 divide-slate-200 dark:divide-slate-950 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium text-left text-sm">
              <tr>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3">Last updated</th>
                <th className="px-6 py-3">Game version</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-950 text-sm text-slate-900 dark:text-slate-100">
              {playthroughs.map((playthrough) => (
                <PlaythroughRow
                  key={playthrough.id}
                  playthrough={playthrough}
                  setSelectedPlaythrough={setSelectedPlaythrough}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedPlaythrough && (
        <History
          selectedPlaythrough={selectedPlaythrough}
          onClose={() => setSelectedPlaythrough(null)}
        />
      )}
    </div>
  );
}
