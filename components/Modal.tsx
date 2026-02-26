import { XMarkIcon } from '@heroicons/react/24/outline';
import { PropsWithChildren } from 'react';
import { twMerge } from 'tailwind-merge';
import Button from './Button';

type ModalProps = PropsWithChildren<{
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  containerClassName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  actions?: React.ReactNode;
}>;

export default function Modal({
  isOpen = true,
  onClose,
  title,
  children,
  size = 'md',
  subtitle,
  containerClassName = '',
  className = '',
  actions,
}: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="relative z-[5]">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className={twMerge(
            'w-full relative',
            size === 'sm' ? 'max-w-2xl' : size === 'md' ? 'max-w-3xl' : 'max-w-4xl',
            'transform bg-white dark:bg-slate-900 rounded-lg max-h-[90%] flex flex-col overflow-hidden',
            containerClassName,
          )}
        >
          <div
            className={twMerge(
              'flex flex-col flex-1 min-h-0',
              !(title || onClose || actions) && 'py-8',
            )}
          >
            {(title || onClose) && (
              <div
                className={twMerge(
                  'flex items-center justify-end px-6 py-4',
                  title && 'justify-between',
                )}
              >
                {title && (
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-medium">{title}</h3>
                    {subtitle && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                    )}
                  </div>
                )}
                {onClose && (
                  <Button variant="icon" onClick={onClose}>
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}
            <div
              className={twMerge(
                'flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] p-6 pt-3',
                className,
              )}
            >
              {children}
            </div>
          </div>
          {actions && (
            <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 rounded-b-lg">
              <div className="flex justify-end gap-2">{actions}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
