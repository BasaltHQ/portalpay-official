export default function LegacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Next.js automatically hoists this to the document head */}
      <link rel="stylesheet" href="/css/legacy.css" />
      {children}
    </>
  );
}
