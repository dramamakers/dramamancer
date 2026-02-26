import { useRef } from 'react';
import { twMerge } from 'tailwind-merge';

export type DropdownMenuButtonOption = {
  label: string;
  subtitle?: string;
  Icon?: React.ElementType;
  value: string;
  isGroupHeader?: boolean;
  isDivider?: boolean;
  disabled?: boolean;
  className?: string;
  hidden?: boolean;
  onSelect?: () => void;
};

export const DropdownMenuButton = ({
  option,
  onClick,
}: {
  option: DropdownMenuButtonOption;
  onClick?: (value: string) => void;
}) => {
  if (option.isDivider) {
    return <div className={option.className} />;
  }

  if (option.hidden) {
    return null;
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick?.(option.value);
      }}
      disabled={option.disabled}
      className={twMerge(
        'peer justify-start flex gap-2 items-center w-full cursor-pointer select-none sm:py-1.5 sm:px-2 text-left rounded p-2.5 text-sm active:ring-2 font-medium border border-transparent hover:bg-slate-200 dark:hover:bg-slate-900 buttonActiveRing buttonHoverOpacity buttonActiveOpacity buttonActiveBackground buttonHoverBackground transition-none! disabled:pointer-events-none disabled:opacity-30 hover:border-slate-200/5',
        !onClick && 'pointer-events-none font-normal',
        option.className,
      )}
    >
      {option.Icon && <option.Icon height={15} className="opacity-60 w-5" />}
      <div className="flex flex-col gap-1">
        <span className="relative">{option.label}</span>
        {option.subtitle && (
          <span className="relative text-xs font-normal text-slate-500">{option.subtitle}</span>
        )}
      </div>
    </button>
  );
};

export const DropdownMenuButtonWithDescription = ({
  option,
  description,
  onClick,
  menuParent,
}: {
  option: DropdownMenuButtonOption;
  description: string | React.ReactNode;
  onClick: (value: string) => void;
  menuParent?: boolean;
}) => {
  if (option.hidden) {
    return null;
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick(option.value);
      }}
      className={
        'peer items-start justify-start flex flex-col w-full cursor-pointer select-none sm:py-1.5 sm:px-2 text-left rounded p-2.5 text-sm active:ring-2 font-medium border border-transparent buttonActiveRing buttonHoverOpacity buttonActiveOpacity buttonActiveBackground buttonHoverBackground  transition-none! hover:border-slate-200/5  ' +
        (menuParent ? 'buttonHoverOpacityGroup buttonHoverBackgroundGroup' : '')
      }
    >
      <h1 className="items-center justify-start gap-3 flex">
        {option.Icon && <option.Icon height={15} className="opacity-60" />}
        <span className="relative">{option.label}</span>
      </h1>
      <span className="relative text-sm font-normal text-secondary">{description}</span>
    </button>
  );
};

export const DropdownMenuBreak = () => (
  <div className="-mx-1 py-1">
    <hr className="border-t border-light-50" />
  </div>
);

export function DropdownMenu({
  children,
  maxHeight,
  width,
  fullWidth = false,
  className,
}: {
  children: React.ReactNode;
  maxHeight?: string;
  width?: string | number;
  fullWidth?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomMargin = 20;
  const topMargin = 20;

  return (
    <div className={twMerge('relative inline-block text-left', fullWidth ? 'w-full' : '')}>
      <div className={'max-sm:fixed relative max-sm:inset-x-2 max-sm:bottom-2'}>
        <div
          ref={containerRef}
          className={`p-2 grid bg-white dark:bg-slate-800 rounded-xl sm:rounded-md shadow-lg text-sm border border-slate-300 dark:border-slate-700 sm:p-1 w-full min-w-max sm:w-44 max-sm:w-auto! max-sm:m-0! microScrollbar overflow-y-auto overflow-x-hidden ${className}`}
          style={{
            maxHeight: maxHeight ?? `calc(100vh - ${topMargin + bottomMargin}px)`,
            width: width,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
