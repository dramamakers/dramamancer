import { create } from 'zustand';

interface LikesState {
  // Line likes by playthrough ID
  lineLikes: Record<number, { liked: number[]; disliked: number[] }>;
  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  setLineLikes: (playthroughId: number, likes: { liked: number[]; disliked: number[] }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Clear likes when playthrough changes
  clearLikes: (playthroughId: number) => void;
}

export const useLikesStore = create<LikesState>((set, get) => ({
  lineLikes: {},
  loading: false,
  error: null,

  setLineLikes: (playthroughId: number, likes: { liked: number[]; disliked: number[] }) => {
    set((state) => ({
      lineLikes: {
        ...state.lineLikes,
        [playthroughId]: likes,
      },
    }));
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearLikes: (playthroughId: number) => {
    set((state) => {
      const newLineLikes = { ...state.lineLikes };
      delete newLineLikes[playthroughId];

      return {
        lineLikes: newLineLikes,
      };
    });
  },
}));
