'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Tooltip } from './Tooltip';

type Tooltip = {
  text: string;
  position: { x: number; y: number };
};

interface TooltipContextType {
  tooltip: Tooltip | null;
  showTooltip: (text: string) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const calculateTooltipPosition = useCallback((text: string, mouseX: number, mouseY: number) => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Tooltip styling: max-w-xs = 20rem = 320px, plus padding
    const maxTooltipWidth = 320 + 16; // max-width + padding
    const charWidth = 6; // approximate character width
    const lineHeight = 20; // approximate line height
    const basePadding = 16; // vertical padding

    // Calculate dimensions more accurately for multi-line text
    const estimatedSingleLineWidth = text.length * charWidth + 16;
    const tooltipWidth = Math.min(estimatedSingleLineWidth, maxTooltipWidth);

    // Estimate number of lines if text wraps
    const estimatedLines = Math.ceil(estimatedSingleLineWidth / (maxTooltipWidth - 16));
    const tooltipHeight = estimatedLines * lineHeight + basePadding;

    // Start with preferred position (offset from cursor)
    let x = mouseX + 10;
    let y = mouseY - tooltipHeight - 10;

    // Adjust horizontal position if tooltip would go off right edge
    if (x + tooltipWidth > viewportWidth - 10) {
      x = mouseX - tooltipWidth - 10;
    }

    // If still off-screen horizontally, center it as best as possible
    if (x < 10) {
      x = Math.max(10, mouseX - tooltipWidth / 2);
    }

    // Adjust vertical position if tooltip would go off top edge
    if (y < 10) {
      y = mouseY + 20; // Position below cursor
    }

    // Adjust vertical position if tooltip would go off bottom edge
    if (y + tooltipHeight > viewportHeight - 10) {
      y = Math.max(10, viewportHeight - tooltipHeight - 10);
    }

    return { x, y };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newMousePosition = { x: e.clientX, y: e.clientY };

      // Always update mouse position for immediate use in showTooltip
      setMousePosition(newMousePosition);

      // Only update tooltip position if tooltip is visible and enough time has passed
      setTooltip((currentTooltip) => {
        if (currentTooltip) {
          // Schedule update on next animation frame
          const newPosition = calculateTooltipPosition(
            currentTooltip.text,
            newMousePosition.x,
            newMousePosition.y,
          );
          setTooltip((prev) => (prev ? { ...prev, position: newPosition } : null));
        }
        return currentTooltip;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [calculateTooltipPosition]);

  const showTooltip = useCallback(
    (text: string) => {
      const position = calculateTooltipPosition(text, mousePosition.x, mousePosition.y);
      setTooltip({ text, position });
    },
    [mousePosition.x, mousePosition.y, calculateTooltipPosition],
  );

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <TooltipContext.Provider value={{ tooltip, showTooltip, hideTooltip }}>
      <Tooltip />
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltip() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
}
