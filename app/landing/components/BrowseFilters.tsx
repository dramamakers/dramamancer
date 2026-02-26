import { useAuth } from '@/components/Auth/AuthContext';
import { Chip } from '@/components/Chip';
import { twMerge } from 'tailwind-merge';
import SearchBar from './Searchbar';

export type SortOption = 'popular' | 'new-popular' | 'recent';

export const tags = [
  'Adventure',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'AI',
  'Magical',
  'Weird',
  'Comedy',
];

const sortSelectedMap: Record<string, string> = {
  popular:
    'bg-gradient-to-b from-blue-500/20 to-indigo-500/30 text-blue-700 hover:from-blue-500/30 hover:to-indigo-500/40 dark:from-blue-400/20 dark:to-indigo-400/30 dark:text-blue-300',
  'new-popular':
    'bg-gradient-to-b from-emerald-500/20 to-green-500/30 text-emerald-700 hover:from-emerald-500/30 hover:to-green-500/40 dark:from-emerald-400/20 dark:to-green-400/30 dark:text-emerald-300',
  recent:
    'bg-gradient-to-b from-purple-500/20 to-violet-500/30 text-purple-700 hover:from-purple-500/30 hover:to-violet-500/40 dark:from-purple-400/20 dark:to-violet-400/30 dark:text-purple-300',
};

const tagSelectedStyle =
  'bg-gradient-to-b from-amber-500/20 to-orange-500/30 text-amber-700 hover:from-amber-500/30 hover:to-orange-500/40 dark:from-amber-400/20 dark:to-orange-400/30 dark:text-amber-300';

interface BrowseFiltersProps {
  sortBy?: SortOption;
  searchQuery: string;
  remixableOnly?: boolean;
  likedOnly?: boolean;
  onSortChange: (sort: SortOption) => void;
  onSearchChange: (query: string) => void;
  onRemixableChange?: (remixableOnly: boolean) => void;
  onLikedChange?: (likedOnly: boolean) => void;
  onTagClick?: (tag: string) => void;
  hideTags?: boolean;
  className?: string;
}

export default function BrowseFilters({
  sortBy,
  searchQuery,
  remixableOnly,
  likedOnly,
  onSortChange,
  onSearchChange,
  onRemixableChange,
  onLikedChange,
  onTagClick,
  hideTags,
  className,
}: BrowseFiltersProps) {
  const { user } = useAuth();

  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      // Default behavior: toggle tag in search query
      const isSelected = searchQuery.toLowerCase().includes(tag.toLowerCase());
      onSearchChange(isSelected ? searchQuery.replace(tag, '') : `${tag}`);
    }
  };

  const handleAllClick = () => {
    if (onTagClick) {
      onTagClick('');
    } else {
      onSearchChange('');
    }
  };

  return (
    <div className={twMerge('flex flex-col gap-4', className)}>
      <div className="flex justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Chip
            onClick={() => onSortChange('popular')}
            className={twMerge(
              sortBy === 'popular'
                ? sortSelectedMap.popular
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            )}
          >
            Popular
          </Chip>
          <Chip
            onClick={() => onSortChange('new-popular')}
            className={twMerge(
              sortBy === 'new-popular'
                ? sortSelectedMap['new-popular']
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            )}
          >
            New & Popular
          </Chip>
          <Chip
            onClick={() => onSortChange('recent')}
            className={twMerge(
              sortBy === 'recent'
                ? sortSelectedMap.recent
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            )}
          >
            Most Recent
          </Chip>
          {onRemixableChange && (
            <Chip
              onClick={() => onRemixableChange(!remixableOnly)}
              className={twMerge(
                remixableOnly
                  ? 'bg-gradient-to-b from-teal-500/20 to-cyan-500/30 text-teal-700 hover:from-teal-500/30 hover:to-cyan-500/40 dark:from-teal-400/20 dark:to-cyan-400/30 dark:text-teal-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
              )}
            >
              Remixable
            </Chip>
          )}
          {user && onLikedChange && (
            <Chip
              onClick={() => onLikedChange(!likedOnly)}
              className={twMerge(
                likedOnly
                  ? 'bg-gradient-to-b from-rose-500/20 to-red-500/30 text-rose-700 hover:from-rose-500/30 hover:to-red-500/40 dark:from-rose-400/20 dark:to-red-400/30 dark:text-rose-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
              )}
            >
              Your Liked
            </Chip>
          )}
        </div>
        <SearchBar className="w-1/3" searchQuery={searchQuery} onSearch={onSearchChange} />
      </div>

      {/* Genre tags */}
      {!hideTags && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Chip
              onClick={handleAllClick}
              className={twMerge(
                searchQuery === ''
                  ? tagSelectedStyle
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
              )}
            >
              All
            </Chip>
            {tags.map((tag) => {
              const isSelected = searchQuery.toLowerCase().includes(tag.toLowerCase());
              return (
                <Chip
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={twMerge(
                    isSelected
                      ? tagSelectedStyle
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                  )}
                >
                  {tag}
                </Chip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
