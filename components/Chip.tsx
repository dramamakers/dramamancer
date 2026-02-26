import { twMerge } from 'tailwind-merge';

export function Chip({
  children,
  onClick,
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  return (
    <div
      className={twMerge(
        'bg-slate-200 dark:bg-slate-800 rounded-full px-3 py-1 flex items-center gap-2',
        onClick &&
          'hover:bg-slate-300 active:bg-slate-400 dark:hover:bg-slate-700 dark:active:bg-slate-700 cursor-pointer',
        className,
      )}
      {...props}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
