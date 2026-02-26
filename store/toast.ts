import { ReactNode } from 'react';
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: ReactNode;
  type: ToastType;
  duration?: number | null; // null means no auto-remove
  onClick?: () => void; // optional click handler
}

interface ToastState {
  toasts: Toast[];
  addToast: (
    message: ReactNode,
    type?: ToastType,
    duration?: number | null,
    onClick?: () => void,
  ) => string;
  updateToast: (
    id: string,
    updates: Partial<Pick<Toast, 'message' | 'type' | 'duration' | 'onClick'>>,
  ) => void;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 5000, onClick) => {
    // If message exists in another toast, remove it
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.message !== message),
    }));

    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration, onClick }],
    }));

    // Auto remove after duration if specified
    if (duration !== null) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      }, duration);
    }

    return id;
  },
  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id
          ? {
              ...toast,
              ...updates,
            }
          : toast,
      ),
    }));

    if (typeof updates.duration === 'number' && updates.duration >= 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      }, updates.duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  removeAllToasts: () => set({ toasts: [] }),
}));
