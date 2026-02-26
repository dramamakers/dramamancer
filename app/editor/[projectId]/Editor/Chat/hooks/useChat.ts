import { applyInstructions } from '@/app/api/gen/quickstart/edit/processor';
import {
  ApiLine,
  Cartridge,
  DEFAULT_SPRITE_ID,
  Project,
  QuickstartCartridge,
  QuickstartImageData,
  QuickstartLine,
} from '@/app/types';
import { useProject } from '@/components/Game/ProjectContext';
import { apiClient } from '@/utils/api';
import { useTraceLogger } from '@/utils/api/hooks';
import { resizeImage } from '@/utils/files';
import { useCallback, useEffect, useReducer } from 'react';
import { useBatchedLogger } from '../../../../utils/log';
import {
  createNewChat,
  getCurrentChatId,
  loadChatById,
  loadChatState,
  QuickstartState,
  saveChatState,
} from '../utils/utils';

type ChatState = QuickstartState & {
  isLoading: boolean;
  error: string | null;
};

type ChatAction =
  | { type: 'SET_STATE'; payload: Partial<QuickstartState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET'; payload: QuickstartState };

const initialMessages: QuickstartLine[] = [
  {
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: `Hi, I'm your game writing assistant! Describe some of your ideas, and optionally give me an image to go off of. Or <u action="exit">skip this and go into editing mode</u>.`,
      },
    ],
    actions: [
      {
        type: 'image-select',
        image: null,
        actionKey: 'select-image',
      },
    ],
  },
];

const editModeMessages: QuickstartLine[] = [
  {
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: `How can I help you edit your game?`,
      },
    ],
  },
];

// Helper to convert QuickstartLine to ApiLine (strip extra fields and filter empty content)
function stripQuickstartFields(messages: QuickstartLine[]): ApiLine[] {
  return messages
    .map(({ role, content }) => ({
      role,
      content: content.filter((block) => {
        // Filter out text blocks with empty or missing text
        if (block.type === 'text') {
          return block.text && block.text.trim().length > 0;
        }
        // Keep image blocks as-is
        return true;
      }),
    }))
    .filter((message) => message.content.length > 0); // Ensure messages have at least one content block
}

// Helper to find the last /create command index
function findLastCreateIndex(messages: QuickstartLine[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user') {
      const textContent = msg.content.find((c) => c.type === 'text');
      const text = textContent?.text || '';
      if (text.toLowerCase().includes('/create') || text.toLowerCase().includes('\\create')) {
        return i;
      }
    }
  }
  return -1;
}

// Helper to trim conversation history to prevent context overflow
function trimConversationHistory(
  messages: QuickstartLine[],
  maxMessages: number = 20,
): QuickstartLine[] {
  // Always keep the first message (initial greeting) and last N messages
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Keep first message and last (maxMessages - 1) messages
  return [messages[0], ...messages.slice(-(maxMessages - 1))];
}

// Helper to filter messages for edit mode (exclude /create and everything after it)
function filterMessagesForEdit(messages: QuickstartLine[]): QuickstartLine[] {
  const lastCreateIndex = findLastCreateIndex(messages);

  // If no /create found, use all messages
  if (lastCreateIndex === -1) {
    return messages;
  }

  // Return messages up to (but not including) the last /create
  return messages.slice(0, lastCreateIndex);
}

// Helper to filter messages for create mode (only include from /create onwards)
function filterMessagesForCreate(messages: QuickstartLine[]): QuickstartLine[] {
  const lastCreateIndex = findLastCreateIndex(messages);

  // If no /create found, use all messages
  if (lastCreateIndex === -1) {
    return messages;
  }

  // Return messages from the last /create onwards
  return messages.slice(lastCreateIndex);
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function useChat(
  project: Project,
  updateProject: (updates: Partial<Project> | ((draft: Project) => void)) => void,
) {
  const { updatePlaythrough } = useProject();
  const { log: originalLog } = useTraceLogger();
  const batchedLog = useBatchedLogger(originalLog);

  const [state, dispatch] = useReducer(chatReducer, {
    type: 'editing',
    messages: [],
    image: null,
    isLoading: false,
    error: null,
  });

  const updateState = useCallback(
    (partialState: Partial<QuickstartState>, shouldSave = false) => {
      if (project?.id && shouldSave) {
        const newQuickstartState: QuickstartState = {
          type: partialState.type ?? state.type,
          messages: partialState.messages ?? state.messages,
          image: partialState.image ?? state.image,
        };
        // Save asynchronously without blocking UI
        saveChatState(project.id, newQuickstartState).catch(console.error);
      }
      dispatch({ type: 'SET_STATE', payload: partialState });
    },
    [project?.id, state.type, state.messages, state.image],
  );

  // Helper to prepare image for API calls - compress if needed
  const prepareImageForApi = useCallback(async (imageData: QuickstartImageData | null) => {
    if (!imageData) return null;

    // Validate that we have either data or a valid URL
    const hasValidData = imageData.data && imageData.mediaType;
    const hasValidUrl = imageData.url && imageData.url.trim() !== '';

    if (!hasValidData && !hasValidUrl) {
      console.warn('Image data is invalid, skipping image');
      return null;
    }

    // If we have a URL but no data, fetch and compress it
    if (imageData.url && !imageData.data) {
      try {
        const response = await fetch(imageData.url);
        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise<QuickstartImageData>((resolve, reject) => {
          reader.onload = async (event) => {
            const base64String = event.target?.result as string;
            try {
              const compressed = await resizeImage(base64String, blob.type, 240);
              resolve({
                data: compressed.data,
                mediaType: compressed.mediaType,
                preview: imageData.preview,
                url: imageData.url,
              });
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Failed to prepare image:', error);
        return null;
      }
    }

    // Already have compressed data
    return imageData;
  }, []);

  // Initialize messages
  useEffect(() => {
    if (!project?.id) return;

    let cancelled = false;

    // Reset chat ID when switching projects
    createNewChat();

    loadChatState(project.id)
      .then((savedState) => {
        if (cancelled) return;

        if (savedState) {
          // Restore the saved state with its original type
          updateState(savedState);
        } else {
          updateState({ type: 'awaiting-image', messages: initialMessages, image: null });
        }
      })
      .catch((error) => {
        console.error('Error loading chat state:', error);
        if (!cancelled) {
          updateState({ type: 'awaiting-image', messages: initialMessages, image: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate story ideas based on image/text
  const generateIdeas = useCallback(
    async (
      textPrompt: string,
      currentMessages: QuickstartLine[],
      currentImage: QuickstartImageData | null,
    ) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Add a progress message while generating (don't save yet)
      const progressMessage: QuickstartLine = {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: '💡 Generating story ideas...',
          },
        ],
      };
      const messagesWithProgress = [...currentMessages, progressMessage];
      updateState({ messages: messagesWithProgress }, false);

      try {
        console.log('💡 Generating story ideas...');
        const preparedImage = await prepareImageForApi(currentImage);
        const result = await apiClient.quickstartGenerateIdeas({
          image: preparedImage,
          textPrompt,
        });

        // Create assistant response message with idea buttons
        const ideasMessage: QuickstartLine = {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'Interesting! Look at some of my interpretations of your prompt. Combine or edit them, then tell me your favorite idea.',
            },
          ],
          actions: result.ideas.map((idea) => ({
            type: 'idea-button',
            label: idea.description,
            actionKey: `idea-${idea.id}`,
          })),
        };

        // Replace progress message with ideas
        const updatedMessages = [...currentMessages, ideasMessage];
        updateState(
          { type: 'selecting-ideas', messages: updatedMessages, image: currentImage },
          true,
        );
        console.log('✨ Generated ideas successfully');

        // Trace success
        batchedLog(project.id, {
          message: 'chat:generate-ideas:success',
          context: JSON.stringify({
            textPrompt,
            hasImage: !!currentImage,
            ideasCount: result.ideas.length,
          }),
        });
      } catch (err) {
        console.error('Ideas generation error:', err);

        // Trace error
        batchedLog(project.id, {
          message: 'chat:generate-ideas:error',
          context: JSON.stringify({
            textPrompt,
            hasImage: !!currentImage,
            error: err instanceof Error ? err.message : 'Unknown error',
          }),
        });

        // Replace progress message with error message
        const errorText = err instanceof Error ? err.message : 'Unknown error';
        const is504Error = errorText.includes('504') || errorText.includes('timeout');

        const errorMessage: QuickstartLine = {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: `❌ Failed to generate ideas: ${errorText}\n\nIf you have a long chat history, try another query or creating a new chat`,
            },
          ],
        };

        // Add delete and retry button for 504 errors
        if (is504Error) {
          errorMessage.actions = [
            {
              type: 'button',
              label: 'Delete Chat & Try Again',
              actionKey: 'delete-and-retry',
            },
          ];
        }

        const updatedMessages = [...currentMessages, errorMessage];
        updateState({ messages: updatedMessages }, true);

        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to generate ideas',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [updateState, prepareImageForApi, batchedLog, project.id],
  );

  // Generate full cartridge from ideas
  const generateCartridge = useCallback(
    async (
      textPrompt: string,
      currentMessages: QuickstartLine[],
      currentImage: QuickstartImageData | null,
    ) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Add a progress message while generating (don't save yet)
      const progressMessage: QuickstartLine = {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: '🎨 Generating your game... This usually takes 30 seconds.',
          },
        ],
      };
      const messagesWithProgress = [...currentMessages, progressMessage];
      updateState({ messages: messagesWithProgress }, false);

      try {
        console.log('🎨 Generating full cartridge...');
        console.log('Text prompt:', textPrompt);

        const preparedImage = await prepareImageForApi(currentImage);
        const result = await apiClient.quickstartFullGenerate({
          image: preparedImage,
          textPrompt,
          selectedIdeaIds: [],
        });

        // If there's an image in the cartridge, set it as the background for the starting scene's place
        if (currentImage && result.cartridge.places && result.cartridge.places.length > 0) {
          const imageUrl = currentImage.url || currentImage.preview;
          const startingSceneId = result.settings.startingSceneId;
          const startingScene = result.cartridge.scenes.find(
            (scene) => scene.uuid === startingSceneId,
          );
          if (startingScene) {
            const place = result.cartridge.places.find(
              (place) => place.uuid === startingScene.placeId,
            );
            if (place && imageUrl) {
              place.sprites[DEFAULT_SPRITE_ID].imageUrl = imageUrl;
            }
          }
        }

        // Prepare updated project
        const nextProject = {
          ...project!,
          title: result.title || project!.title,
          cartridge: result.cartridge,
          settings: {
            ...project!.settings,
            ...result.settings,
          },
          updatedAt: Date.now(),
        };

        // Create assistant response message
        const assistantMessage: QuickstartLine = {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: result.message || 'I created a game for you! Try playing it or make edits.',
            },
          ],
          before: project?.cartridge,
          after: nextProject.cartridge,
        };

        updateProject(nextProject);

        // Replace progress message with final result
        const updatedMessages = [...currentMessages, assistantMessage];
        updateState(
          {
            type: 'editing',
            messages: updatedMessages,
            image: null,
          },
          true,
        );

        // Create a new playthrough
        await updatePlaythrough({
          action: 'create',
          playthrough: { projectSnapshot: nextProject },
        });

        console.log('✨ Full cartridge generated successfully');

        // Trace success
        batchedLog(project.id, {
          message: 'chat:generate-cartridge:success',
          context: JSON.stringify({
            textPrompt,
            hasImage: !!currentImage,
            title: result.title,
            scenesCount: result.cartridge.scenes.length,
            charactersCount: result.cartridge.characters.length,
          }),
        });

      } catch (err) {
        console.error('Full generation error:', err);

        // Trace error
        batchedLog(project.id, {
          message: 'chat:generate-cartridge:error',
          context: JSON.stringify({
            textPrompt,
            hasImage: !!currentImage,
            error: err instanceof Error ? err.message : 'Unknown error',
          }),
        });

        // Replace progress message with error message
        const errorText = err instanceof Error ? err.message : 'Unknown error';
        const is504Error = errorText.includes('504') || errorText.includes('timeout');

        const errorMessage: QuickstartLine = {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: `❌ Failed to generate: ${errorText}\n\nIf you have a long chat history, try another query or creating a new chat`,
            },
          ],
        };

        // Add delete and retry button for 504 errors
        if (is504Error) {
          errorMessage.actions = [
            {
              type: 'button',
              label: 'Delete Chat & Try Again',
              actionKey: 'delete-and-retry',
            },
          ];
        }

        const updatedMessages = [...currentMessages, errorMessage];
        updateState({ messages: updatedMessages }, true);

        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to generate cartridge',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [project, updateProject, updatePlaythrough, prepareImageForApi, updateState, batchedLog],
  );

  const handleEdit = useCallback(
    async (userInput: string, currentMessages: QuickstartLine[]) => {
      if (!project?.cartridge) {
        throw new Error('No project cartridge available for editing');
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        console.log('🎭 Calling edit API...');

        // Filter messages to exclude /create and everything after it
        const filteredMessages = filterMessagesForEdit(currentMessages);

        // Trim conversation history to prevent context overflow
        const trimmedMessages = trimConversationHistory(filteredMessages, 20);

        // Strip extra fields (before, after, actions) before sending to API
        const apiMessages = stripQuickstartFields(trimmedMessages);

        const editData = await apiClient.quickstartEdit({
          conversation: apiMessages,
          userInput,
          currentCartridge: project.cartridge,
          projectTitle: project.title,
        });

        // Create assistant response message for text/question
        const assistantMessage: QuickstartLine = {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: editData.message || 'I can help you with that!',
            },
          ],
        };

        if (editData?.suggestions) {
          assistantMessage.content[0].text += '\n - ' + editData.suggestions.join('\n - ');
        }

        // If this was an edit (not just a question), update the project
        if (editData.type === 'edit' && editData.instructions) {
          const beforeCartridge = project.cartridge;
          const newCartridge = applyInstructions(project.cartridge, editData.instructions);

          // Update messages with before/after cartridges
          assistantMessage.before = beforeCartridge;
          assistantMessage.after = newCartridge;

          const nextProject = {
            ...project,
            cartridge: newCartridge,
            updatedAt: Date.now(),
          };

          updateProject(nextProject);
          console.log(`✨ Applied ${editData.instructions.length} instruction(s)`);

          // Trace edit success
          batchedLog(project.id, {
            message: 'chat:edit:success',
            context: JSON.stringify({
              userInput,
              instructionsCount: editData.instructions.length,
              instructions: editData.instructions.map((i) => i.type),
            }),
          });

          // Update the playthrough - restart if any major changes were made
          if (
            editData.instructions.some(
              (i) =>
                i.type === 'create' ||
                i.type === 'delete' ||
                (i.type === 'edit' && i.entity === 'Scene'),
            )
          ) {
            await updatePlaythrough({
              action: 'create',
              playthrough: { projectSnapshot: nextProject },
            });
          }
          console.log('✨ Edit applied');
        } else {
          console.log('❓ Question asked, no edits made');

          // Trace question
          batchedLog(project.id, {
            message: 'chat:question:success',
            context: JSON.stringify({
              userInput,
              response: editData.message,
            }),
          });
        }

        updateState(
          {
            type: 'editing',
            messages: [...currentMessages, assistantMessage],
            image: null,
          },
          true,
        );
      } catch (err) {
        console.error('Edit error:', err);

        // Trace error
        batchedLog(project.id, {
          message: 'chat:edit:error',
          context: JSON.stringify({
            userInput,
            error: err instanceof Error ? err.message : 'Unknown error',
          }),
        });

        // Create a more helpful error message
        const errorText = err instanceof Error ? err.message : 'Unknown error';
        const is504Error = errorText.includes('504') || errorText.includes('timeout');

        const errorMessage: QuickstartLine = {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: `❌ Failed to process your request: ${errorText}\n\nIf you have a long chat history, try another query or creating a new chat`,
            },
          ],
        };

        // Add delete and retry button for 504 errors
        if (is504Error) {
          errorMessage.actions = [
            {
              type: 'button',
              label: 'Delete Chat & Try Again',
              actionKey: 'delete-and-retry',
            },
          ];
        }

        const updatedMessages = [...currentMessages, errorMessage];
        updateState({ messages: updatedMessages }, true);

        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to process edit',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [project, updateProject, updatePlaythrough, updateState, batchedLog],
  );

  // Handle new chat - creates a new chat and resets state
  const handleNewChat = useCallback(() => {
    createNewChat(); // Reset current chat ID
    const resetState: QuickstartState = {
      type: 'editing' as const,
      messages: editModeMessages,
      image: null,
    };
    dispatch({ type: 'RESET', payload: resetState });
    // Save immediately so the chat appears in history
    if (project?.id) {
      saveChatState(project.id, resetState).catch(console.error);
    }
  }, [project?.id]);

  // Load a specific chat by ID
  const handleLoadChat = useCallback(async (chatId: number) => {
    const chatState = await loadChatById(chatId);
    if (chatState) {
      // Restore the saved state with its original type
      dispatch({ type: 'RESET', payload: chatState });
    }
  }, []);

  // Handle reset - clears chat but keeps current project (deprecated - use handleNewChat)
  const handleReset = useCallback(() => {
    handleNewChat();
  }, [handleNewChat]);

  // Helper to extract combined text prompt from conversation in new game flow
  const getCombinedTextPrompt = useCallback((messages: QuickstartLine[]): string => {
    // Filter to only include messages from the last /create onwards
    const filteredMessages = filterMessagesForCreate(messages);

    // Find all user messages
    const userMessages = filteredMessages
      .filter((msg) => msg.role === 'user')
      .map((msg) => {
        const textContent = msg.content.find((c) => c.type === 'text');
        return textContent?.text || '';
      })
      .filter((text) => text.trim().length > 0);

    // Combine all user messages, removing "/create" prefix from first message if present
    const combined = userMessages
      .map((text, index) => {
        if (index === 0) {
          // Remove "/create" or "new game about" or "new game" prefix from first message
          return text
            .replace(/^\/create\s*/i, '')
            .replace(/^\\create\s*/i, '')
            .replace(/^new\s+game\s+(about\s+)?/i, '')
            .trim();
        }
        return text;
      })
      .filter((text) => text.length > 0)
      .join('. ');

    return combined;
  }, []);

  // Send message with mode selection
  const sendMessage = useCallback(
    async (input: string, selectedMode: 'create' | 'edit' = 'edit') => {
      if (state.isLoading) return;

      const newMessages = [...state.messages];
      const trimmedInput = input.trim();

      const userMessage: QuickstartLine = {
        role: 'user',
        content: [{ type: 'text', text: trimmedInput }],
      };

      // Add user message immediately (but don't save yet - wait for assistant response)
      newMessages.push(userMessage);
      const currentImage = state.image;

      updateState({ messages: newMessages }, false);

      // Determine what to do based on current workflow state and selected mode
      const currentWorkflowState = state.type;

      // If we're in the middle of create flow (awaiting-image or selecting-ideas)
      if (currentWorkflowState === 'awaiting-image') {
        if (selectedMode === 'edit') {
          // User switched to edit mode - exit create flow and do edit
          const assistantMessage: QuickstartLine = {
            role: 'assistant',
            content: [{ type: 'text', text: 'Switched to edit mode.' }],
          };
          const messagesWithResponse = [...newMessages, assistantMessage];
          updateState({ type: 'editing', messages: messagesWithResponse }, true);
          await handleEdit(trimmedInput, messagesWithResponse);
        } else {
          // Continue create flow - generate ideas
          const combinedPrompt = getCombinedTextPrompt(newMessages);
          await generateIdeas(combinedPrompt, newMessages, currentImage ?? null);
        }
      } else if (currentWorkflowState === 'selecting-ideas') {
        if (selectedMode === 'edit') {
          // User switched to edit mode - exit create flow and do edit
          const assistantMessage: QuickstartLine = {
            role: 'assistant',
            content: [{ type: 'text', text: 'Switched to edit mode.' }],
          };
          const messagesWithResponse = [...newMessages, assistantMessage];
          updateState({ type: 'editing', messages: messagesWithResponse }, true);
          await handleEdit(trimmedInput, messagesWithResponse);
        } else {
          // Continue create flow - generate cartridge
          const combinedPrompt = getCombinedTextPrompt(newMessages);
          await generateCartridge(combinedPrompt, newMessages, currentImage ?? null);
        }
      } else {
        // We're in editing state
        if (selectedMode === 'create') {
          // User wants to start create flow - show image upload prompt
          const assistantMessage: QuickstartLine = {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'Upload an image and/or add more details to generate your new game.',
              },
            ],
            actions: [
              {
                type: 'image-select',
                image: currentImage,
                actionKey: 'select-image',
              },
            ],
          };
          const messagesWithPrompt = [...newMessages, assistantMessage];
          updateState({ type: 'awaiting-image', messages: messagesWithPrompt }, true);
        } else {
          // Stay in edit mode - do edit
          await handleEdit(trimmedInput, newMessages);
        }
      }
    },
    [state, updateState, generateIdeas, generateCartridge, handleEdit, getCombinedTextPrompt],
  );

  // Don't auto-save on every change - only save when explicitly told to via updateState
  // This prevents updating the chat timestamp just by viewing it

  // Action handlers
  const handleStartFromImage = useCallback(() => {
    // Send message to generate ideas from image
    updateState(
      {
        type: 'awaiting-image',
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'Upload an image and/or write some text to generate a game! You can edit the game anytime.',
              },
            ],
            actions: [
              {
                type: 'image-select',
                image: state.image,
                actionKey: 'select-image',
              },
            ],
          },
        ],
      },
      true,
    );
  }, [updateState, state.image]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = useCallback(
    (image: QuickstartImageData) => {
      const newMessages = [...state.messages];
      const lastMessage = newMessages[newMessages.length - 1];
      const newActions = [
        ...(lastMessage.actions?.filter((action) => action.type !== 'image-select') || []),
        {
          type: 'image-select' as const,
          image,
          actionKey: 'select-image',
        },
      ] as QuickstartLine['actions'];
      lastMessage.actions = newActions;
      updateState({ messages: newMessages, image }, true);
    },
    [state.messages, updateState],
  );

  const handleRestoreCheckpoint = useCallback(
    async (cartridge: Cartridge) => {
      if (!project) return;

      // Update playerId to first character in restored cartridge if current one doesn't exist
      const playerIdExists = cartridge.characters.some((c) => c.uuid === project.settings.playerId);
      const newPlayerId = playerIdExists
        ? project.settings.playerId
        : cartridge.characters[0]?.uuid || project.settings.playerId;

      const nextProject = {
        ...project,
        cartridge,
        settings: {
          ...project.settings,
          playerId: newPlayerId,
        },
        updatedAt: Date.now(),
      };

      updateProject(nextProject);

      // Restart playthrough with restored cartridge
      await updatePlaythrough({
        action: 'clear',
      });
    },
    [project, updateProject, updatePlaythrough],
  );

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const switchToEditMode = useCallback(() => {
    updateState({ type: 'editing' }, true);
  }, [updateState]);

  return {
    // State
    state: {
      type: state.type,
      messages: state.messages,
      image: state.image,
    },
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    currentChatId: getCurrentChatId(),

    // Actions
    setError,
    sendMessage,
    switchToEditMode,
    handleReset,
    handleNewChat,
    handleLoadChat,
    handleStartFromImage,
    handleImageUpload,
    handleRestoreCheckpoint,
  };
}
