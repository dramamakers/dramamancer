import Button from '@/components/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

interface TagsProps<T> {
  tags: T[];
  displayTag: (tag: T) => string;
  onAddTag: (tag: T) => void;
  prompt: string;
}

export default function Tags<T>({ tags, displayTag, onAddTag }: TagsProps<T>) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <Button
          key={index}
          onClick={() => onAddTag(tag)}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full cursor-pointer"
        >
          <PlusIcon className="w-3 h-3" />
          {displayTag(tag)}
        </Button>
      ))}
    </div>
  );
}
