# Modal System Documentation

## Overview

This modal system provides a type-safe, scalable way to manage modals in the application. It separates concerns between modal state management, modal registration, and modal components.

## Key Benefits

1. **Type Safety**: Full TypeScript support with proper typing for modal data
2. **Scalability**: Easy to add new modals without touching existing code
3. **Performance**: Only renders the active modal
4. **Clean API**: Simple hooks for opening and managing modals
5. **Separation of Concerns**: Modal logic is separated from business logic

## Architecture

### 1. Modal Registry (`app/store/modal.ts`)

The modal registry defines all available modals and their data types:

```typescript
export interface ModalRegistry {
  confirm: ConfirmModalData;
  'edit-character': EditCharacterModalData;
  'create-character': CreateCharacterModalData;
  generate: GenerateModalData;
  config: ConfigModalData;
  preview: PreviewModalData;
}
```

### 2. Modal Provider (`app/editor/components/Modals/index.tsx`)

The provider automatically renders the active modal based on the registry:

```typescript
const modalComponents: Record<keyof ModalRegistry, React.ComponentType> = {
  confirm: ConfirmModal,
  'edit-character': CharacterModal,
  // ...
};
```

### 3. Modal Hooks

#### `useModal<T>(modalName: T)`

Basic hook for a specific modal:

```typescript
const modal = useModal('confirm');
// modal.isOpen, modal.data, modal.open(data), modal.close()
```

#### `useModalActions()`

Convenience hook for opening modals:

```typescript
const { openConfirm, openEditCharacter } = useModalActions();
openConfirm({ type: 'character', id: 1 });
```

#### `useModalWrapper<T>(modalName: T)`

Advanced hook with common patterns:

```typescript
const modal = useModalWrapper('confirm');
const handleSubmit = modal.handleSubmit(async (data) => {
  // Handle the data
});
```

## Usage Examples

### Opening a Modal

```typescript
// Using useModalActions (recommended)
const { openConfirm } = useModalActions();
openConfirm({ type: 'character', id: 1 });

// Using useModalStore directly
const { openModal } = useModalStore();
openModal('confirm', { type: 'character', id: 1 });
```

### Creating a Modal Component

```typescript
export function MyModal() {
  const modal = useModal('my-modal');

  if (!modal.isOpen) return null;

  return (
    <Modal isOpen={modal.isOpen} onClose={modal.close}>
      {/* Modal content */}
    </Modal>
  );
}
```

### Adding a New Modal

1. Add the modal data type:

```typescript
export type MyModalData = {
  someField: string;
};
```

2. Add to the registry:

```typescript
export interface ModalRegistry {
  // ... existing modals
  'my-modal': MyModalData;
}
```

3. Add to the modal components:

```typescript
const modalComponents: Record<keyof ModalRegistry, React.ComponentType> = {
  // ... existing modals
  'my-modal': MyModal,
};
```

4. Add to useModalActions (optional):

```typescript
export function useModalActions() {
  return {
    // ... existing actions
    openMyModal: (data: MyModalData) => openModal('my-modal', data),
  };
}
```

## Best Practices

1. **Use typed hooks**: Always use `useModal<T>()` instead of accessing the store directly
2. **Keep modal data minimal**: Only include data that the modal actually needs
3. **Use convenience hooks**: Prefer `useModalActions()` for opening modals
4. **Handle async operations**: Use `useModalWrapper` for forms and confirmations
5. **Don't persist modal state**: Modal state should be ephemeral

## Migration from Old System

The old system had these issues:

- Manual type casting with `any`
- Repetitive conditional rendering
- Tight coupling between modals and store
- Hard to maintain switch statements
- Unnecessary persistence

The new system addresses all these issues while maintaining the same API surface for consumers.
