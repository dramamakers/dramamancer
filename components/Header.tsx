import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export function FullWidthHeader({
  left,
  right,
  children,
  sticky = false,
  variant = '1/2',
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  sticky?: boolean;
  className?: string;
  variant?: '1/2' | '2/3';
}) {
  return (
    <div
      className={twMerge(
        'w-full border-b border-slate-200 dark:border-slate-800 flex justify-center p-4 gap-2 dark:bg-slate-950 flex-col',
        sticky && 'sticky top-0 z-[2]',
        className,
      )}
    >
      <div className="flex justify-between items-center w-full gap-2 sm:flex-row flex-col">
        <div
          className={twMerge(
            'sm:w-1/2 w-full sm:items-start sm:justify-start',
            variant === '2/3' && 'sm:w-2/3',
          )}
        >
          {left}
        </div>
        <div
          className={twMerge(
            'flex sm:w-1/2 w-full justify-center sm:justify-end',
            variant === '2/3' && 'sm:w-1/3',
          )}
        >
          {right}
        </div>
      </div>
      {children && <div className="flex items-center justify-center w-full pt-4">{children}</div>}
    </div>
  );
}

export default function Header({
  className,
  children,
  sticky = false,
}: {
  className?: string;
  children: ReactNode;
  sticky?: boolean;
}) {
  return (
    <div
      className={twMerge(
        'w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-[2]',
        sticky && 'sticky top-0',
        className,
      )}
    >
      <div className="max-w-5xl w-full flex items-center justify-between p-4">{children}</div>
    </div>
  );
}
