'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeTab {
  label: string;
  language: string;
  code: string;
}

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tabs[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg border border-border bg-muted overflow-hidden">
      {/* Tab Headers */}
      <div className="flex items-center border-b border-border bg-background/50">
        <div className="flex-1 flex items-center gap-1 px-2 py-1">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === index
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre
        className="p-4 text-sm whitespace-pre overflow-x-auto"
        style={{
          margin: 0,
          fontSize: '0.875rem',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <code>{tabs[activeTab].code}</code>
      </pre>
    </div>
  );
}
