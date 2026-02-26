import { QuickstartImageData, QuickstartLine } from '@/app/types';

export type QuickstartState = {
  type: 'awaiting-image' | 'selecting-ideas' | 'generating-cartridge' | 'editing';
  messages: QuickstartLine[];
  image?: QuickstartImageData | null;
};

// Store current chat ID in memory
let currentChatId: number | null = null;

export function setCurrentChatId(chatId: number | null): void {
  currentChatId = chatId;
}

export function getCurrentChatId(): number | null {
  return currentChatId;
}

// Save chat state to database
export async function saveChatState(
  projectId: string | number,
  state: QuickstartState,
): Promise<void> {
  try {
    if (currentChatId) {
      // Update existing chat
      const response = await fetch(`/api/data/chats/${currentChatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatState: state }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to update chat: ${response.statusText}`);
      }

      console.log('💾 Chat state updated in database for project', projectId);
    } else {
      // Create new chat
      const response = await fetch('/api/data/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, chatState: state }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to create chat: ${response.statusText}`);
      }

      const data = await response.json();
      currentChatId = data.id;
      console.log('💾 New chat created in database for project', projectId);
    }
  } catch (error) {
    console.error('❌ Failed to save chat state:', error);
    // Fallback to localStorage if API fails
    try {
      localStorage.setItem(`chat-${projectId}`, JSON.stringify(state));
      console.log('💾 Chat state saved to localStorage (fallback) for project', projectId);
    } catch (localStorageError) {
      console.error('❌ Failed to save to localStorage:', localStorageError);
    }
  }
}

// Load latest chat state from database
export async function loadChatState(projectId: string | number): Promise<QuickstartState | null> {
  try {
    const response = await fetch(`/api/data/chats/latest?projectId=${projectId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Not authenticated, skipping chat load');
        return null;
      }
      throw new Error(`Failed to load chat: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.id && data.chatState) {
      currentChatId = data.id;
      console.log('📁 Chat state loaded from database for project', projectId);
      return data.chatState;
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to load chat state from database:', error);
    // Fallback to localStorage if API fails
    try {
      const stored = localStorage.getItem(`chat-${projectId}`);
      if (stored) {
        console.log('📁 Chat state loaded from localStorage (fallback) for project', projectId);
        return JSON.parse(stored) as QuickstartState;
      }
    } catch (localStorageError) {
      console.error('❌ Failed to load from localStorage:', localStorageError);
    }
    return null;
  }
}

// Create a new chat (resets current chat ID)
export function createNewChat(): void {
  currentChatId = null;
  console.log('🆕 Starting new chat');
}

// Load a specific chat by ID
export async function loadChatById(chatId: number): Promise<QuickstartState | null> {
  try {
    const response = await fetch(`/api/data/chats/${chatId}/load`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to load chat: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.chatState) {
      currentChatId = chatId;
      console.log('📁 Chat loaded from database (ID:', chatId, ')');
      return data.chatState;
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to load chat by ID:', error);
    return null;
  }
}

// Get list of all chats for a project
export async function getChatList(
  projectId: string | number,
): Promise<Array<{ id: number; createdAt: number; updatedAt: number }>> {
  try {
    const response = await fetch(`/api/data/chats/list?projectId=${projectId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat list: ${response.statusText}`);
    }

    const data = await response.json();
    return data.chats || [];
  } catch (error) {
    console.error('❌ Failed to fetch chat list:', error);
    return [];
  }
}

// Delete a chat
export async function deleteChat(chatId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/data/chats/${chatId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.statusText}`);
    }

    console.log('🗑️ Chat deleted (ID:', chatId, ')');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete chat:', error);
    return false;
  }
}

// Clear chat state (deprecated - use createNewChat instead)
export function clearChatState(projectId: string | number): void {
  createNewChat();
  // Also clear localStorage fallback
  try {
    localStorage.removeItem(`chat-${projectId}`);
  } catch (error) {
    console.error('❌ Failed to clear localStorage:', error);
  }
}

// Migration function to move localStorage chats to database
export async function migrateLocalStorageChatsToDatabase(
  projectId: string | number,
): Promise<void> {
  try {
    const key = `chat-${projectId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      console.log(`No localStorage chat found for project ${projectId}`);
      return;
    }

    const state = JSON.parse(stored) as QuickstartState;

    // Check if we already have a chat in the database
    const response = await fetch(`/api/data/chats/latest?projectId=${projectId}`, {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.id) {
        console.log(`Chat already exists in database for project ${projectId}, skipping migration`);
        // Clear localStorage since we have it in database
        localStorage.removeItem(key);
        return;
      }
    }

    // Create new chat in database
    const createResponse = await fetch('/api/data/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, chatState: state }),
      credentials: 'include',
    });

    if (createResponse.ok) {
      const data = await createResponse.json();
      currentChatId = data.id;
      console.log(`✅ Migrated chat for project ${projectId} to database (ID: ${data.id})`);
      // Clear localStorage after successful migration
      localStorage.removeItem(key);
    } else {
      console.error(`Failed to migrate chat for project ${projectId}:`, createResponse.statusText);
    }
  } catch (error) {
    console.error(`Error migrating chat for project ${projectId}:`, error);
  }
}
