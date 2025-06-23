'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode];
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  className?: string;
  onResize?: (leftWidth: number) => void;
  direction?: 'horizontal' | 'vertical';
}

export function ResizablePanels({
  children,
  defaultLeftWidth = 400,
  minLeftWidth = 300,
  maxLeftWidth = 800,
  className,
  onResize,
  direction = 'horizontal',
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHorizontal = direction === 'horizontal';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [isHorizontal]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = isHorizontal ? rect.width : rect.height;
      const mousePosition = isHorizontal ? e.clientX - rect.left : e.clientY - rect.top;

      const newSize = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, Math.min(mousePosition, containerSize - minLeftWidth))
      );

      setLeftWidth(newSize);
      onResize?.(newSize);
    },
    [isDragging, minLeftWidth, maxLeftWidth, onResize, isHorizontal]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const [leftPanel, rightPanel] = children;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full w-full',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {/* Left/Top Panel */}
      <div
        className="relative overflow-hidden"
        style={{
          [isHorizontal ? 'width' : 'height']: `${leftWidth}px`,
          flexShrink: 0,
        }}
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <div
        role="separator"
        tabIndex={0}
        aria-label="Resize panels"
        className={cn(
          'group relative flex-shrink-0 bg-border hover:bg-border/80 transition-colors',
          isHorizontal
            ? 'w-1 cursor-col-resize hover:w-2'
            : 'h-1 cursor-row-resize hover:h-2',
          isDragging && (isHorizontal ? 'w-2' : 'h-2')
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Visual drag indicator */}
        <div
          className={cn(
            'absolute bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity',
            isHorizontal
              ? 'left-0 top-0 w-full h-full'
              : 'top-0 left-0 w-full h-full',
            isDragging && 'opacity-100'
          )}
        />

        {/* Drag dots indicator */}
        <div
          className={cn(
            'absolute flex items-center justify-center',
            isHorizontal
              ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col space-y-1'
              : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-row space-x-1'
          )}
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-muted-foreground rounded-full opacity-0 group-hover:opacity-60 transition-opacity"
            />
          ))}
        </div>
      </div>

      {/* Right/Bottom Panel */}
      <div className="flex-1 overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
}

export default ResizablePanels;
