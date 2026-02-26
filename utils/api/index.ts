import { QuickstartInput, QuickstartOutput } from '@/app/api/gen/quickstart/edit/route';
import {
  ActionTrigger,
  DisplayLine,
  EditableProject,
  Playthrough,
  Project,
  QuickstartCartridge,
  Scene,
  Settings,
  Trigger,
  Visibility,
  XmlLine
} from '@/app/types';
import { convertDisplayLineToXmlLines, convertXmlLinesToDisplayLines } from '../convert';

const BASE_DB_URL = '/api/data';
const BASE_GEN_URL = '/api/gen';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);

        // Extract the most detailed error message available
        if (errorData.error && typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.message && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (errorText) {
          // If we have text but couldn't parse a useful message, include it
          errorMessage = `${errorMessage} - ${errorText}`;
        }
      } catch (parseError) {
        // If we can't parse the response, try to get the raw text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText}`;
          }
        } catch {
          // If everything fails, just use the basic HTTP error
        }
      }

      // Note: We don't automatically trigger login modal here anymore
      // as it was showing on public pages. Auth errors should be handled
      // contextually by the calling components/hooks.

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ===== PROJECT METHODS =====

  getProject = async (id: number): Promise<Project> => {
    return this.request<Project>(`${BASE_DB_URL}/projects/${id}`);
  };

  getAllProjects = async (limit?: number, offset?: number): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<Project[]>(`${BASE_DB_URL}/projects${queryString}`);
  };

  getOwnedProjects = async (): Promise<Project[]> => {
    return this.request<Project[]>(`${BASE_DB_URL}/projects/owned`);
  };

  getRecentlyPlayedProjects = async (limit?: number): Promise<Project[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<Project[]>(`${BASE_DB_URL}/projects/recent${params}`);
  };

  createProject = async (data: Partial<EditableProject> = {}): Promise<{ id: number }> => {
    try {
      const result = await this.request<{ id: number }>(`${BASE_DB_URL}/projects`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result;
    } catch (error) {
      console.error('createProject error:', error);
      throw error;
    }
  };

  updateProject = async (id: number, update: Partial<Project>): Promise<{ id: number }> => {
    return this.request<{ id: number }>(`${BASE_DB_URL}/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  };

  updateCartridge = async (
    id: number,
    cartridge: Project['cartridge'],
  ): Promise<{ id: number }> => {
    return this.request<{ id: number }>(`${BASE_DB_URL}/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ cartridge }),
    });
  };

  remixProject = async (id: number): Promise<{ id: number }> => {
    return this.request<{ id: number }>(`${BASE_DB_URL}/projects/${id}/remix`, {
      method: 'POST',
    });
  };

  deleteProject = async (id: number): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(`${BASE_DB_URL}/projects/${id}`, {
      method: 'DELETE',
    });
  };

  // ===== USER METHODS =====

  getUserProfile = async (
    userId: string,
  ): Promise<{
    displayName: string;
    imageUrl: string | null;
    allowed: boolean;
    email: string | null;
  } | null> => {
    return this.request<{
      displayName: string;
      imageUrl: string | null;
      allowed: boolean;
      email: string | null;
    } | null>(`${BASE_DB_URL}/users/${encodeURIComponent(userId)}`);
  };

  getPublicProjectsForUser = async (userId: string): Promise<Project[]> => {
    return this.request<Project[]>(
      `${BASE_DB_URL}/projects/user/${encodeURIComponent(userId)}/public`,
    );
  };

  getPublicPlaythroughsForUser = async (
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Playthrough[]> => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (offset) params.set('offset', offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<Playthrough[]>(
      `${BASE_DB_URL}/playthroughs/user/${encodeURIComponent(userId)}/public${queryString}`,
    );
  };

  getOwnedPlaythroughs = async (limit?: number, offset?: number): Promise<Playthrough[]> => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (offset) params.set('offset', offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<Playthrough[]>(`${BASE_DB_URL}/playthroughs/user${queryString}`);
  };

  updateUser = async (
    userId: string,
    userUpdates: {
      imageUrl?: string | null;
      email?: string | null;
    },
  ): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(
      `${BASE_DB_URL}/users/${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(userUpdates),
      },
    );
  };

  // ===== PLAYTHROUGH METHODS =====

  getPlaythrough = async (id: number): Promise<Playthrough> => {
    return this.request<Playthrough>(`${BASE_DB_URL}/playthroughs/${id}`);
  };

  getPlaythroughsForProject = async (
    projectId: number,
    limit?: number,
    offset?: number,
  ): Promise<Playthrough[]> => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (offset) params.set('offset', offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<Playthrough[]>(`${BASE_DB_URL}/playthroughs/project/${projectId}${queryString}`);
  };

  getPublicPlaythroughsForProject = async (
    projectId: number,
    limit?: number,
    offset?: number,
    excludeSelf?: boolean,
  ): Promise<Playthrough[]> => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (offset) params.set('offset', offset.toString());
    if (excludeSelf) params.set('excludeSelf', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<Playthrough[]>(
      `${BASE_DB_URL}/playthroughs/project/${projectId}/public${queryString}`,
    );
  };

  createPlaythrough = async (data: Partial<Playthrough>): Promise<Playthrough> => {
    try {
      const result = await this.request<Playthrough>(`${BASE_DB_URL}/playthroughs`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result;
    } catch (error) {
      console.error('createPlaythrough error:', error);
      throw error;
    }
  };

  updatePlaythrough = async (id: number, update: Partial<Playthrough>): Promise<{ id: number }> => {
    return this.request<{ id: number }>(`${BASE_DB_URL}/playthroughs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  };

  deletePlaythrough = async (id: number): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(`${BASE_DB_URL}/playthroughs/${id}`, {
      method: 'DELETE',
    });
  };

  // ===== PLAYTHROUGH LIKE METHODS =====

  getPlaythroughLikes = async (): Promise<number[]> => {
    return this.request<number[]>(`${BASE_DB_URL}/playthroughlikes`);
  };

  addPlaythroughLike = async (playthroughId: number): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(`${BASE_DB_URL}/playthroughlikes`, {
      method: 'POST',
      body: JSON.stringify({ playthroughId }),
    });
  };

  removePlaythroughLike = async (playthroughId: number): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(
      `${BASE_DB_URL}/playthroughlikes?playthroughId=${playthroughId}`,
      {
        method: 'DELETE',
      },
    );
  };

  getPlaythroughLikeCount = async (playthroughId: number): Promise<{ totalLikes: number }> => {
    return this.request<{ totalLikes: number }>(
      `${BASE_DB_URL}/playthroughlikes/playthrough/${playthroughId}`,
    );
  };

  // ===== STORY GENERATION METHODS =====

  checkTriggers = async ({
    scenes,
    possibleTriggers,
    lines,
  }: {
    scenes: Scene[];
    possibleTriggers: Record<string, ActionTrigger>;
    lines: DisplayLine[];
  }): Promise<string[]> => {
    const xmlLines: XmlLine[] = convertDisplayLineToXmlLines(lines, scenes);
    const result = await this.request<{ activatedTriggerIds: string[] }>(
      `${BASE_GEN_URL}/story/check`,
      {
        method: 'POST',
        body: JSON.stringify({
          possibleTriggers,
          lines: xmlLines,
        }),
      },
    );
    return result.activatedTriggerIds;
  };

  getHint = async ({
    lines,
    scenes,
    triggerConditions,
    style,
    playerCharacterName,
  }: {
    lines: DisplayLine[];
    scenes: Scene[];
    triggerConditions: string[];
    style: string;
    playerCharacterName: string;
  }): Promise<{ lines: DisplayLine[] }> => {
    const xmlLines: XmlLine[] = convertDisplayLineToXmlLines(lines, scenes);
    const result = await this.request<{ lines: XmlLine[] }>(`${BASE_GEN_URL}/story/hint`, {
      method: 'POST',
      body: JSON.stringify({
        lines: xmlLines,
        triggerConditions,
        style,
        playerCharacterName,
      }),
    });
    return {
      lines: [
        {
          type: 'hint',
          text: result.lines.map((line) => line.text).join('\n'),
          metadata: {
            shouldPause: true,
          },
        },
      ],
    };
  };

  generateStep = async ({
    project,
    playthrough,
    triggers,
    signal,
  }: {
    project: Project;
    playthrough: Playthrough;
    triggers: Trigger[];
    signal?: AbortSignal;
  }): Promise<{ lines: DisplayLine[] }> => {
    const result = await this.request<{ lines: XmlLine[] }>(`${BASE_GEN_URL}/story/step`, {
      method: 'POST',
      body: JSON.stringify({
        project,
        playthrough,
        triggers,
      }),
      signal,
    });

    return {
      lines: convertXmlLinesToDisplayLines(result.lines),
    };
  };

  // ===== QUICKSTART METHODS =====

  quickstartEdit = async (input: QuickstartInput): Promise<QuickstartOutput> => {
    return this.request<QuickstartOutput>(`${BASE_GEN_URL}/quickstart/edit`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  };

  quickstartGenerateIdeas = async (input: {
    image: { data: string; mediaType: string; preview: string } | null;
    textPrompt: string;
  }): Promise<{
    ideas: Array<{ id: string; description: string; probability: number }>;
  }> => {
    return this.request(`${BASE_GEN_URL}/quickstart/generate-ideas`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  };

  quickstartFullGenerate = async (input: {
    image: { data: string; mediaType: string; preview: string } | null;
    textPrompt: string;
    selectedIdeaIds: string[];
  }): Promise<{
    cartridge: QuickstartCartridge;
    message: string;
    title: string;
    settings: Settings;
  }> => {
    return this.request(`${BASE_GEN_URL}/quickstart/full-cartridge`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  };

  // ===== TRACE LOG METHODS =====

  createTraceLog = async (data: {
    projectId?: number;
    action: string;
    context?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    sessionId?: string;
  }): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(`${BASE_DB_URL}/trace-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }    );
  };

  // ===== PROJECT LIKE METHODS =====

  getProjectLikes = async (): Promise<Project[]> => {
    return this.request<Project[]>(`${BASE_DB_URL}/projectlikes`);
  };

  addProjectLike = async (projectId: number): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(`${BASE_DB_URL}/projectlikes`, {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  };

  removeProjectLike = async (projectId: number): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(
      `${BASE_DB_URL}/projectlikes?projectId=${projectId}`,
      {
        method: 'DELETE',
      },
    );
  };

  // ===== LINE LIKE METHODS =====

  getLineLike = async (playthroughId: number, lineId: number): Promise<boolean | null> => {
    return this.request<boolean | null>(
      `${BASE_DB_URL}/linelikes/playthrough/${playthroughId}/line/${lineId}`,
    );
  };

  getLineLikes = async (
    playthroughId: number,
  ): Promise<{ liked: number[]; disliked: number[] }> => {
    return this.request<{ liked: number[]; disliked: number[] }>(
      `${BASE_DB_URL}/linelikes/playthrough/${playthroughId}`,
    );
  };

  setLineLike = async (
    playthroughId: number,
    lineId: number,
    isLiked: boolean,
  ): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(`${BASE_DB_URL}/linelikes`, {
      method: 'POST',
      body: JSON.stringify({ playthroughId, lineId, isLiked }),
    });
  };

  removeLineLike = async (playthroughId: number, lineId: number): Promise<{ success: boolean }> => {
    return this.request<{ success: boolean }>(
      `${BASE_DB_URL}/linelikes?playthroughId=${playthroughId}&lineId=${lineId}`,
      {
        method: 'DELETE',
      },
    );
  };

  // ===== PLAYTHROUGH SAVE METHODS =====
  togglePlaythroughLike = async (
    playthroughId: number,
    liked: boolean,
  ): Promise<{ id: number }> => {
    return this.request<{ id: number }>(`${BASE_DB_URL}/playthroughs/${playthroughId}`, {
      method: 'PATCH',
      body: JSON.stringify({ liked }),
    });
  };

  updatePlaythroughVisibility = async (
    playthroughId: number,
    visibility: Visibility,
  ): Promise<{ id: number }> => {
    return this.request<{ id: number }>(`${BASE_DB_URL}/playthroughs/${playthroughId}`, {
      method: 'PATCH',
      body: JSON.stringify({ visibility }),
    });
  };

  // ===== CHAT METHODS =====

  getChatList = async (
    projectId: string | number,
  ): Promise<Array<{ id: number; createdAt: number; updatedAt: number; lastMessage: string }>> => {
    const response = await this.request<{ chats: Array<{ id: number; createdAt: number; updatedAt: number; lastMessage: string }> }>(
      `${BASE_DB_URL}/chats/list?projectId=${projectId}`,
    );
    return response.chats || [];
  };
}

export const apiClient = new ApiClient();
