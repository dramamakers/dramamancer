import { Playthrough, Project } from '@/app/types';
import { isGameOutOfDate } from '@/utils/playthrough';
import { useMemo } from 'react';

export function useOutdated({
  project,
  currentPlaythrough,
  readOnly,
}: {
  project: Project;
  currentPlaythrough?: Playthrough;
  readOnly: boolean;
}) {
  const playingOnAnOlderVersion = useMemo(() => {
    if (readOnly || !currentPlaythrough) {
      return false;
    }

    return isGameOutOfDate(project, currentPlaythrough);
  }, [currentPlaythrough?.projectSnapshot, project, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    outdated: playingOnAnOlderVersion,
  };
}
