import { EntityType } from '@/app/editor/utils/entity';
import { Sprite } from '@/app/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX_GENERATED_IMAGES = 20 * 4;

type JobStatus = 'pending' | 'generating' | 'completed' | 'failed';

interface JobType {
  jobId: string;
  status: JobStatus;
  imageUrl?: string;
  type: 'image' | 'video';
}

export type GeneratedAsset = {
  /* Identifiers */
  id: string;
  entityType: EntityType;

  /* Generation */
  jobId: string;
  prompt: string;
  error?: string;
  loading: 'starting' | 'generating' | 'completed' | 'failed';
  imageIndex: number;
  type: 'image' | 'video';

  /* Results */
  sprite?: Sprite;
  sourceImageUrl?: string; // Original image used for video generation
  imageUrl?: string;
  videoUrl?: string;

  /* Dimensions (for aspect ratio filtering) */
  width?: number;
  height?: number;
};

interface GenerateState {
  jobQueue: Array<JobType>;
  addJob: (jobId: string, type?: 'image' | 'video') => void;
  updateJob: (jobId: string, updates: Partial<JobType>) => void;

  /* Save generated assets */
  generatedAssets: GeneratedAsset[];
  addGeneratedAssets: (assets: GeneratedAsset[]) => void;
  updateGeneratedAsset: (jobId: string, updates: Partial<GeneratedAsset>) => void;
  updateGeneratedAssetSprite: (imageUrl: string, sprite: Sprite) => void;
  updateGeneratedAssets: (
    jobId: string,
    updates: Partial<{ imageUrls?: string[]; videoUrls?: string[] }>,
  ) => number;
  replaceJobId: (oldJobId: string, newJobId: string) => void;
  deleteGeneratedAsset: (imageUrl: string) => void;
}

export const useGenerateStore = create<GenerateState>()(
  persist(
    (set) => ({
      jobQueue: [],
      addJob: (jobId: string, type: 'image' | 'video' = 'image') =>
        set((state) => ({ jobQueue: [...state.jobQueue, { jobId, status: 'pending', type }] })),
      updateJob: (jobId: string, updates: Partial<JobType>) => {
        set((state) => {
          const newJobQueue = [...state.jobQueue];
          const jobIndex = newJobQueue.findIndex((job) => job.jobId === jobId);

          if (jobIndex !== -1) {
            newJobQueue[jobIndex] = {
              ...newJobQueue[jobIndex],
              ...updates,
            };
          }

          return {
            ...state,
            jobQueue: newJobQueue,
          };
        });
      },

      generatedAssets: [],
      addGeneratedAssets: (assets: GeneratedAsset[]) =>
        set((state) => ({
          generatedAssets: [...assets, ...state.generatedAssets].slice(0, MAX_GENERATED_IMAGES),
        })),

      updateGeneratedAsset: (jobId: string, updates: Partial<GeneratedAsset>) => {
        set((state) => {
          const newGeneratedAssets = state.generatedAssets.map((asset) => {
            if (asset.jobId === jobId) {
              const updatedAsset = { ...asset, ...updates } as GeneratedAsset;
              // Ensure legacy compatibility
              if (updatedAsset.sprite?.imageUrl) {
                updatedAsset.imageUrl = updatedAsset.sprite.imageUrl;
              }
              return updatedAsset;
            }
            return asset;
          });

          return {
            ...state,
            generatedAssets: newGeneratedAssets,
          };
        });
      },

      updateGeneratedAssetSprite: (imageUrl: string, sprite: Sprite) => {
        set((state) => {
          const newGeneratedAssets = state.generatedAssets.map((asset) => {
            if (asset.imageUrl === imageUrl || asset.sprite?.imageUrl === imageUrl) {
              return {
                ...asset,
                sprite,
                imageUrl: sprite.imageUrl, // Maintain legacy compatibility
              };
            }
            return asset;
          });

          return {
            ...state,
            generatedAssets: newGeneratedAssets,
          };
        });
      },

      updateGeneratedAssets: (
        jobId: string,
        updates: Partial<{ imageUrls?: string[]; videoUrls?: string[] }>,
      ) => {
        let count = 0;
        set((state) => {
          const newGeneratedAssets = state.generatedAssets.map((asset: GeneratedAsset) => {
            if (asset.jobId === jobId) {
              count++;
              if ('imageUrls' in updates && Array.isArray(updates.imageUrls)) {
                const imageUrl = updates.imageUrls[asset.imageIndex];
                return {
                  ...asset,
                  imageUrl,
                  sprite: { imageUrl },
                  loading: 'completed' as const,
                };
              } else if ('videoUrls' in updates && Array.isArray(updates.videoUrls)) {
                const videoUrl = updates.videoUrls[asset.imageIndex];
                return {
                  ...asset,
                  videoUrl,
                  sprite: asset.sprite
                    ? { ...asset.sprite, imageUrl: videoUrl }
                    : { imageUrl: videoUrl },
                  loading: 'completed' as const,
                };
              }
              return { ...asset, ...updates } as GeneratedAsset;
            }
            return asset;
          });

          return {
            ...state,
            generatedAssets: newGeneratedAssets,
          };
        });
        return count;
      },

      replaceJobId: (oldJobId: string, newJobId: string) => {
        set((state) => ({
          jobQueue: state.jobQueue.map((job) =>
            job.jobId === oldJobId ? { ...job, jobId: newJobId } : job,
          ),
          generatedAssets: state.generatedAssets.map((asset) =>
            asset.jobId === oldJobId ? { ...asset, jobId: newJobId } : asset,
          ),
        }));
      },

      deleteGeneratedAsset: (imageUrl: string) => {
        set((state) => ({
          generatedAssets: state.generatedAssets.filter(
            (asset) => asset.type === 'image' && asset.imageUrl !== imageUrl,
          ),
        }));
      },
    }),
    {
      name: 'generate-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const completedAssets = state.generatedAssets.filter(
          (asset: GeneratedAsset) => asset.loading === 'completed',
        );
        return {
          generatedAssets: completedAssets,
        };
      },
    },
  ),
);
