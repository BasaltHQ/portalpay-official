'use client';

import Link from 'next/link';
import { Info, ExternalLink, BookOpen } from 'lucide-react';

interface GuideSection {
  title: string;
  items: {
    text: string;
    href?: string;
    external?: boolean;
  }[];
}

interface DashboardTOCProps {
  sections?: GuideSection[];
}

export function DashboardTOC({ sections = [] }: DashboardTOCProps) {
  if (sections.length === 0) return null;

  return (
    <aside className="hidden xl:block fixed top-[148px] bottom-0 right-0 w-64 border-l border-border bg-background">
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Info className="w-3 h-3" />
          <span>Guide</span>
        </div>
        
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-3">
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <ul className="space-y-2">
              {section.items.map((item, itemIdx) => (
                <li key={itemIdx}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <span className="mt-0.5 flex-shrink-0">•</span>
                      <span className="flex-1">{item.text}</span>
                      {item.external && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex-shrink-0">•</span>
                      <span className="flex-1">{item.text}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Link to documentation */}
        <div className="pt-4 border-t border-border">
          <Link
            href="/developers/docs/auth"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <BookOpen className="w-4 h-4" />
            <span>View Full Documentation</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
