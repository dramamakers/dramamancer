import { DisplayLine, Playthrough, Project, Visibility } from '@/app/types';

export type PlaythroughUpdateProps =
  | {
      action: 'clear';
    }
  | {
      action: 'create';
      playthrough?: Partial<Playthrough>;
    }
  | {
      action: 'updateSnapshot';
      playthroughId: number;
      updates: {
        updateFn: (project: Project) => Project;
      };
    }
  | {
      action: 'progress';
      playthroughId: number;
      updates: {
        currentLineIdx: number;
        currentSceneId: string;
        lines?: DisplayLine[];
      };
    }
  | {
      action: 'settings';
      playthroughId: number;
      updates: Partial<{
        title: string;
        visibility: Visibility;
      }>;
    }
  | {
      action: 'load';
      playthrough: Playthrough;
    }
  | {
      action: 'delete';
      playthroughId: number;
    }
  | {
      action: 'duplicate';
      updates?: Partial<Playthrough>;
    };

export type InternalStoryState = {
  lines: DisplayLine[];
  currentLineIdx: number;
  currentSceneId: string;
  error: string | null;
  currentPrompt: string | null;
};
