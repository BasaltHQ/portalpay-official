'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function Tooltip({ content, children, side = 'right' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (side) {
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
          break;
        case 'top':
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
          break;
      }

      setPosition({ top, left });
    }
  }, [isVisible, side]);

  const transformClasses = {
    right: '-translate-y-1/2',
    left: '-translate-y-1/2 -translate-x-full',
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
  };

  const arrowClasses = {
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-r-background',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-l-background',
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-t-background',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-b-background',
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div 
          className={`fixed z-[100] pointer-events-none ${transformClasses[side]}`}
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="relative">
            <div className="bg-background text-foreground text-xs font-medium px-3 py-1.5 rounded-lg border border-border shadow-lg whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
              {content}
            </div>
            <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[side]}`} />
          </div>
        </div>
      )}
    </>
  );
}
