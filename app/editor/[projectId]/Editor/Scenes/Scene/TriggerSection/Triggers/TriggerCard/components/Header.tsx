import Button from '@/components/Button';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

interface TriggerCardHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

export function TriggerCardHeader({
  isExpanded,
  onToggle,
  children,
  actions,
}: TriggerCardHeaderProps) {
  return (
    <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
      <h2 className="flex-1 select-none">{children}</h2>
      <div className="flex items-center gap-2">
        {actions}
        <Button
          variant="icon"
          className="text-slate-500 hover:text-slate-700 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
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
  );
}
