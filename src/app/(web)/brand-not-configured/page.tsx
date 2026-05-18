"use client";

export default function BrandNotConfiguredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-background">
      <div className="max-w-xl w-full glass-pane rounded-xl border p-6 text-center">
        <div className="text-2xl font-bold mb-2">Brand not configured</div>
        <p className="text-sm text-muted-foreground mb-4">
          This partner container has not been configured with a valid BRAND_KEY and branding assets.
        </p>
        <div className="text-left text-sm space-y-2 rounded-md border p-3 bg-foreground/5">
          <div className="font-semibold">Next steps</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Provision or update this container with the required environment variables:</li>
          </ol>
          <ul className="list-disc pl-5">
            <li>BRAND_KEY</li>
            <li>NEXT_PUBLIC_OWNER_WALLET</li>
            <li>NEXT_PUBLIC_PLATFORM_WALLET</li>
            <li>NEXT_PUBLIC_RECIPIENT_ADDRESS</li>
            <li>Optional: PP_BRAND_NAME, PP_BRAND_LOGO, PP_BRAND_FAVICON</li>
          </ul>
          <div className="text-xs text-muted-foreground">
            If Azure Front Door changes are currently locked, use APIM/AuthZ fallback and retry AFD configuration later.
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Operators: see docs/env.md and docs/whitelabel-branding.md for details.
        </div>
      </div>
    </div>
  );
}
