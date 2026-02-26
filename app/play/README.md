# Preview System Design

## Overview

The preview system is designed to allow users to view and interact with their visual novel during its development. It features two main modes:

1. **Sidebar Preview** - A compact version in the sidebar while working in the editor
2. **Fullscreen Preview** - A modal that takes over the whole screen for a more immersive preview

Both previews share the same story state so that users can seamlessly switch between views without losing their place in the narrative.

## Key Components

### State Management

The core of the preview system is the shared state management:

- `app/store/story.ts` - Zustand store that manages all narrative state
  - Persists story state to localStorage
  - Tracks current line, scene, and game mode
  - Handles story progression and user input
  - Detects content changes that require story reload

### UI Components

The main UI components used in both preview modes:

- `app/preview/components/VisualNovel/index.tsx` - Main container for the visual novel UI
- `app/preview/components/VisualNovel/Dialog.tsx` - Displays character dialogue and narration
- `app/editor/components/Modals/PreviewModal.tsx` - Fullscreen modal for preview

### Hooks

- `app/hooks/usePreviewStory.ts` - Custom hook that provides an interface to the story store
  - Used by both sidebar and fullscreen components
  - Handles initialization and context-specific behaviors

## Features

### Playtest Mode

- Start from any scene in the story
- Observe triggers and debug information
- Automatically picks up changes to scenes/characters
- Remembers position between preview sessions

### Shared State

- Seamlessly transitions between sidebar and modal views
- Persists story state between page reloads
- Detects when content has changed and reloads story appropriately

## Implementation Details

1. The story store uses Zustand's `persist` middleware to save state to localStorage
2. When editor content changes are detected (via editor-storage events), it marks the story as "dirty"
3. When initialized, if the story is "dirty", it reloads from the current scene
4. Uses React's Context API for dependency injection of story generation services
5. Compatible with both the sidebar component and the fullscreen modal

## Usage

To use the preview system in a component:

```tsx
import { usePreviewStory } from '@/app/hooks/usePreviewStory';

function MyPreviewComponent() {
  const {
    currentLine,
    currentScene,
    handleNext,
    handleUserInput,
    // other props...
  } = usePreviewStory(playableCharacter);

  // Component implementation...
}
```

The `usePreviewStory` hook handles all the necessary logic to integrate with the shared story state.
