import Button from '@/components/Button';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { ReactNode, useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface CollapsibleCardProps {
  children: ReactNode;
  header: ReactNode;
  actions?: ReactNode;
  className?: string;
  backgroundImage?: string;
  defaultExpanded?: boolean;
}

export default function CollapsibleCard({
  children,
  header,
  actions,
  className,
  backgroundImage,
  defaultExpanded = false,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
  };

  return (
    <div
      className={twMerge(
        'group relative w-full rounded-lg bg-slate-200 dark:bg-slate-800 transition-colors',
        className,
      )}
    >
      <div className="relative z-[1]">
        <div className="relative p-4">
          {/* Header */}
          <div
            className="flex items-center justify-between cursor-pointer relative z-[1]"
            onClick={handleToggle}
          >
            <h2 className="flex-1 select-none">{header}</h2>
            <div className="flex items-center gap-2">
              {actions}
              <Button
                variant="icon"
                className="text-slate-500 hover:text-slate-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle();
                }}
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {backgroundImage && (
            <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none">
              <div className="relative w-full h-full">
                <Image
                  src={backgroundImage}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-r-lg"
                  width={100}
                  height={100}
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-200 to-transparent dark:from-slate-800 dark:via-slate-800/80 dark:to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="flex flex-col gap-2 p-4 pt-0" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
