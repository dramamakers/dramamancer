export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type NextLineResponse = (
  | {
      type: 'character';
      characterName: string;
    }
  | {
      type: 'player';
    }
  | {
      type: 'narration';
    }
) & {
  text: string;
  gameEnd?: boolean;
};

export type Job = {
  userId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: number;
  updatedAt: number;
  projectId?: number;
  projectTitle?: string;
  error?: string;
};
