import { END_SCENE_ID, Playthrough, Project } from '@/app/types';

export function getAllEndings(project: Project) {
  const allEndings = Array.from(
    new Set(
      project.cartridge.scenes.flatMap((scene) => {
        const endingNames = [];
        for (const trigger of scene.triggers) {
          if (trigger.goToSceneId === END_SCENE_ID) {
            endingNames.push(trigger.endingName?.trim() || 'Default Ending');
          }
        }
        return endingNames;
      }),
    ),
  ) as string[];

  return allEndings;
}

export function getCompletionInfo(playthroughs: Playthrough[], project: Project) {
  // Get all unique ending names from the project
  const allEndings = getAllEndings(project);

  // Get endings that have been reached
  const reachedEndingNames = new Set(
    playthroughs
      .map((playthrough) => {
        const lastLine = playthrough.lines[playthrough.lines.length - 1];
        if (!lastLine) {
          return undefined;
        }

        if (lastLine.metadata?.shouldEnd) {
          return lastLine.metadata?.endingName || 'Default Ending';
        }
        return undefined;
      })
      .filter((endingName) => endingName !== undefined && allEndings.includes(endingName)),
  );

  // Create record of ending name -> completion status
  const endingCompletions: Record<string, boolean> = {};
  allEndings.forEach((ending) => {
    endingCompletions[ending] = reachedEndingNames.has(ending);
  });

  // New completion: based on unique activatedTriggerIds fired vs total triggers in the project
  const allTriggerIds = Array.from(
    new Set(project.cartridge.scenes.flatMap((scene) => scene.triggers.map((t) => t.uuid))),
  );

  const firedTriggerIds = new Set<string>();
  for (const playthrough of playthroughs) {
    for (const line of playthrough.lines) {
      const ids = line.metadata?.activatedTriggerIds || [];
      for (const id of ids) {
        // Only count triggers that exist in the project definition
        if (allTriggerIds.includes(id)) firedTriggerIds.add(id);
      }
    }
  }

  const completedCount = firedTriggerIds.size;
  const totalCount = allTriggerIds.length;

  return {
    endingCompletions,
    reachedEndings: Array.from(reachedEndingNames),
    totalEndings: allEndings,
    seenTriggerIds: Array.from(firedTriggerIds),
    completionPercentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
  };
}
