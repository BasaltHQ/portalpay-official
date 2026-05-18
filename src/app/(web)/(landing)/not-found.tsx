import Link from "next/link";

export default function LandingNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center glass-pane rounded-2xl border p-8">
        <div className="text-5xl mb-2">404</div>
        <h1 className="text-2xl font-bold mb-2">This landing page isnt available</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The industry page you requested is disabled or doesnt exist. Explore our live crypto payment guides
          and examples, or head back to the main site.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/crypto-payments" className="px-5 py-2.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:opacity-90 transition">
            View Industries
          </Link>
          <Link href="/" className="px-5 py-2.5 rounded-md border font-semibold hover:bg-accent transition">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
