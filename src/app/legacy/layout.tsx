export default function LegacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Next.js automatically hoists this to the document head */}
      <link rel="stylesheet" href="/css/legacy.css" />
      {/* 
        CRITICAL: Kill the SSR theme-ready overlay.
        globals.css applies body::before/::after (z-index:9999, fixed, backdrop-blur)
        when data-pp-theme-ready="0". On Chrome 93, the beforeInteractive script
        that flips this to "1" may not execute, leaving a permanent gray overlay
        that blocks all interaction. This override is placed AFTER legacy.css to
        ensure it wins specificity.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        body::before, body::after {
          display: none !important;
          content: none !important;
        }
      `}} />
      {children}
    </>
  );
}
