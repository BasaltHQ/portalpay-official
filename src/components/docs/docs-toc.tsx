'use client';

import { useEffect, useState } from 'react';
import { List, PanelRightClose, PanelRight } from 'lucide-react';
import { Tooltip } from './tooltip';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function DocsTOC() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const article = document.querySelector('article');
    if (!article) return;

    const headingElements = article.querySelectorAll('h2, h3');
    const items: TocItem[] = Array.from(headingElements).map((heading) => ({
      id: heading.id,
      text: heading.textContent || '',
      level: parseInt(heading.tagName[1]),
    }));

    setHeadings(items);

    // Add IDs to headings if they don't have them
    headingElements.forEach((heading) => {
      if (!heading.id) {
        heading.id = heading.textContent?.toLowerCase().replace(/[^\w]+/g, '-') || '';
      }
    });

    // Intersection Observer for active heading - improved logic
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Find all currently intersecting headings
      const visibleHeadings = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => {
          // Sort by position from top of viewport
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });

      // Set the first visible heading as active (topmost in viewport)
      if (visibleHeadings.length > 0) {
        setActiveId(visibleHeadings[0].target.id);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-100px 0px -66% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    headingElements.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside className={`hidden xl:flex fixed top-[176px] bottom-0 right-0 border-l border-border bg-background z-10 transition-all duration-300 flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <div className={`flex items-center gap-2 text-sm font-semibold text-foreground p-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <List className="w-4 h-4" />
          {!isCollapsed && <span>On This Page</span>}
        </div>
        <nav className="flex flex-col items-center gap-1">
          {headings.map((heading, index) => {
            const content = (
              <a
                href={`#${heading.id}`}
                className={`transition-colors ${isCollapsed
                    ? heading.level === 2
                      ? 'w-8 h-8 rounded-full border-2 flex items-center justify-center'
                      : 'p-1 rounded-sm'
                    : `text-sm px-3 py-1.5 block rounded-md ${heading.level === 3 ? 'pl-6' : ''}`
                  } ${activeId === heading.id
                    ? isCollapsed
                      ? heading.level === 2
                        ? 'bg-primary border-primary'
                        : 'bg-primary'
                      : 'bg-primary text-primary-foreground font-medium'
                    : isCollapsed
                      ? heading.level === 2
                        ? 'border-[var(--primary)] hover:bg-[var(--primary)]/10'
                        : 'hover:bg-muted'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(heading.id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              >
                {isCollapsed ? (
                  <div className={`rounded-full ${heading.level === 2 ? 'w-2 h-2' : 'w-1.5 h-1.5'} ${activeId === heading.id
                      ? 'bg-primary-foreground'
                      : heading.level === 2
                        ? 'bg-[var(--primary)]'
                        : 'bg-foreground'
                    }`} />
                ) : (
                  heading.text
                )}
              </a>
            );

            return isCollapsed ? (
              <Tooltip key={`${heading.id}-${index}`} content={heading.text} side="left">
                {content}
              </Tooltip>
            ) : (
              <div key={`${heading.id}-${index}`} className="w-full">{content}</div>
            );
          })}
        </nav>
      </div>

      {/* Toggle Button at bottom */}
      <div className="border-t border-border p-2 flex justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label={isCollapsed ? "Expand TOC" : "Collapse TOC"}
        >
          {isCollapsed ? <PanelRight className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
