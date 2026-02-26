import { type Visibility } from '@/app/types';
import { twMerge } from 'tailwind-merge';

export default function Visibility({ visibility }: { visibility: Visibility }) {
  return (
    <div
      className={twMerge(
        'capitalize inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm',
        visibility === 'public'
          ? 'bg-gradient-to-b from-emerald-500/20 to-green-500/30 text-emerald-700 hover:from-emerald-500/30 hover:to-green-500/40 dark:from-emerald-400/20 dark:to-green-400/30 dark:text-emerald-300'
          : visibility === 'unlisted'
            ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/30 text-amber-700 hover:from-amber-500/30 hover:to-orange-500/40 dark:from-amber-400/20 dark:to-orange-400/30 dark:text-amber-300'
            : 'bg-slate-200 dark:bg-slate-700',
      )}
    >
      {visibility}
    </div>
  );
}
