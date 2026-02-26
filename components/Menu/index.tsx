'use client';

import { DropdownMenu, DropdownMenuButton } from '@/components/Dropdown';
import { useEffect, useRef, useState } from 'react';
import { useMenu } from './MenuContext';

export function Menu() {
  const { menuRef, isVisible, position, options, hideMenu } = useMenu();
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuContainerRef.current && isVisible) {
      const rect = menuContainerRef.current.getBoundingClientRect();
      const margin = 10;

      // Calculate available space
      const availableSpaceRight = window.innerWidth - position.x;
      const availableSpaceBottom = window.innerHeight - position.y;

      // Adjust horizontal position if needed
      let newX = position.x;
      if (rect.width > availableSpaceRight) {
        newX = Math.max(margin, window.innerWidth - rect.width - margin);
      }

      // Adjust vertical position if needed
      let newY = position.y;
      if (rect.height > availableSpaceBottom) {
        newY = Math.max(margin, window.innerHeight - rect.height - margin);
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [position, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-99"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div ref={menuContainerRef}>
        <DropdownMenu>
          {options.map((option) => (
            <DropdownMenuButton
              key={option.value}
              option={option}
              onClick={() => {
                option.onSelect?.();
                hideMenu();
              }}
            />
          ))}
        </DropdownMenu>
      </div>
    </div>
  );
}

export * from './MenuContext';
