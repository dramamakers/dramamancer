import { twMerge } from 'tailwind-merge';

function Cell({ children, noPadding }: { children: React.ReactNode; noPadding?: boolean }) {
  return (
    <td
      className={twMerge(
        'border-b border-slate-200 dark:border-slate-700 px-4',
        noPadding && 'px-0',
      )}
    >
      {children}
    </td>
  );
}

function ProjectTablePlaceholderRow() {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 h-20! overflow-hidden">
      {/* Project image */}
      <Cell noPadding>
        <div className="min-w-30 relative h-30 overflow-hidden rounded-l-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </Cell>

      {/* Project title */}
      <Cell>
        <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </Cell>

      {/* Created date */}
      <Cell>
        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </Cell>

      {/* Updated date */}
      <Cell>
        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </Cell>

      {/* Lines count */}
      <Cell>
        <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </Cell>

      {/* Visibility */}
      <Cell>
        <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </Cell>

      {/* Actions button */}
      <Cell>
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </Cell>
    </tr>
  );
}

export default function ProjectTablePlaceholder() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <ProjectTablePlaceholderRow key={`placeholder-row-${index}`} />
      ))}
    </>
  );
}
