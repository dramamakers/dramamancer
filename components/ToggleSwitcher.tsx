import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { useTooltip } from './Tooltip';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface ToggleSwitcherProps<T extends string> {
  options: [ToggleOption<T>, ToggleOption<T>];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  tooltip?: string;
  className?: string;
}

export default function ToggleSwitcher<T extends string>({
  options,
  value,
  onChange,
  label,
  tooltip,
  className = '',
}: ToggleSwitcherProps<T>) {
  const { showTooltip, hideTooltip } = useTooltip();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-sm font-medium flex items-center gap-1">
          {label}
          {tooltip && (
            <QuestionMarkCircleIcon
              className="w-4 h-4 text-slate-500 cursor-help"
              onMouseOver={() => showTooltip(tooltip)}
              onMouseOut={hideTooltip}
            />
          )}
        </span>
      )}
      <div className="flex items-center bg-slate-500/20 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => value !== option.value && onChange(option.value)}
            className={twMerge(
              'px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer text-sm',
              value === option.value
                ? 'bg-white shadow-sm dark:bg-slate-900'
                : 'hover:bg-slate-300 dark:hover:bg-slate-600',
              'rounded-2xl',
            )}
          >
            {option.icon}
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
