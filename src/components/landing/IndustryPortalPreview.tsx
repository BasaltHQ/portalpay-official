'use client';

import { useEffect, useState, useMemo } from 'react';
import { PortalPreviewEmbedded } from '@/components/portal-preview-embedded';
import { useTheme } from '@/contexts/ThemeContext';

type DemoReceipt = {
  lineItems: { label: string; priceUsd: number; qty?: number }[];
  totalUsd: number;
};

type IndustryPortalPreviewProps = {
  industryReceipts: DemoReceipt[];
  recipient: string;
};

export function IndustryPortalPreview({ industryReceipts, recipient }: IndustryPortalPreviewProps) {
  // Get theme from context instead of fetching independently
  const { theme: activeTheme } = useTheme();

  // Rotate through demo receipts
  const [receiptIndex, setReceiptIndex] = useState(0);
  const demoReceipt = industryReceipts[receiptIndex];

  useEffect(() => {
    if (industryReceipts.length <= 1) return;
    
    const intervalId = setInterval(() => {
      setReceiptIndex((prev) => (prev + 1) % industryReceipts.length);
    }, 8000); // Rotate every 8 seconds (synced with token rotation)

    return () => clearInterval(intervalId);
  }, [industryReceipts.length]);

  // Local preview style overrides to ensure PortalPreviewEmbedded mirrors the active theme
  const previewStyle = useMemo(() => {
    return {
      ["--pp-primary" as any]: activeTheme.primaryColor,
      ["--pp-secondary" as any]: activeTheme.secondaryColor,
      ["--pp-text" as any]: activeTheme.headerTextColor || activeTheme.textColor || '#ffffff',
      ["--pp-text-header" as any]: activeTheme.headerTextColor || activeTheme.textColor || '#ffffff',
      ["--pp-text-body" as any]: activeTheme.bodyTextColor || '#e5e7eb',
      fontFamily: activeTheme.fontFamily,
      backgroundImage: activeTheme.receiptBackgroundUrl ? `url(${activeTheme.receiptBackgroundUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }, [
    activeTheme.primaryColor,
    activeTheme.secondaryColor,
    activeTheme.headerTextColor,
    activeTheme.textColor,
    activeTheme.bodyTextColor,
    activeTheme.fontFamily,
    activeTheme.receiptBackgroundUrl,
  ]);

  return (
    <div className="glass-pane rounded-2xl border p-4">
      <div className="text-sm font-semibold mb-3">Live Payment Portal Preview</div>
      <div style={{ minHeight: '650px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <PortalPreviewEmbedded
          theme={activeTheme}
          demoReceipt={demoReceipt}
          recipient={recipient as any}
          className="max-w-[428px] mx-auto"
          style={previewStyle}
        />
      </div>
      <div className="text-xs text-muted-foreground text-center mt-3">
        Connect wallet to simulate checkout. Preview inherits your brand theme.
      </div>
    </div>
  );
}
