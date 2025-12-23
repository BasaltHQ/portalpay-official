"use client";

import { ChangeEvent, useMemo } from "react";

type PublicSpacePanelProps = {
  spaceUrl: string;
  spacePublic: boolean;
  spaceImage: string;
  spaceImageUrlInput: string;
  imageError: string | null;
  ownerLabel: string;
  ownerSubLabel: string;
  tags: string[];
  onSpaceUrlChange: (value: string) => void;
  onToggleLive: (nextValue: boolean) => void;
  onImageUrlChange: (value: string) => void;
  onImageFileSelect: (file: File | null) => void;
  onImageClear: () => void;
};

export function PublicSpacePanel({
  spaceUrl,
  spacePublic,
  spaceImage,
  spaceImageUrlInput,
  imageError,
  ownerLabel,
  ownerSubLabel,
  tags,
  onSpaceUrlChange,
  onToggleLive,
  onImageUrlChange,
  onImageFileSelect,
  onImageClear,
}: PublicSpacePanelProps) {
  const status = useMemo(
    () => (spacePublic ? "Live on Live Now" : "Hidden from Live Now"),
    [spacePublic],
  );

  const buttonLabel = spacePublic
    ? "Hide from Live Now"
    : "Publish to Live Now";
  const buttonStyles = spacePublic
    ? "bg-red-500 text-white hover:bg-red-400"
    : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110";

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onImageFileSelect(file);
  };

  const trimmedUrl = spaceUrl.trim();
  const validUrl = useMemo(() => {
    if (!trimmedUrl) return null;
    try {
      return new URL(trimmedUrl);
    } catch {
      try {
        return new URL(`https://${trimmedUrl}`);
      } catch {
        return null;
      }
    }
  }, [trimmedUrl]);
  const previewHost = validUrl ? validUrl.hostname.replace(/^www\./, "") : "";
  const joinHref = validUrl ? validUrl.toString() : undefined;
  const ownerInitial = ownerLabel.trim().charAt(0).toUpperCase() || "Y";
  const previewDescription = trimmedUrl
    ? "Visitors will be sent directly to this link."
    : "Add a link so visitors know where to join your session.";
  const badgeTags = (tags || []).filter(Boolean).slice(0, 2);

  return (
    <div className="glass-pane rounded-xl border p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Public Space Visibility</h2>
          <p className="text-xs text-muted-foreground">
            Decide when your public space appears on the Live Now page.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ${spacePublic ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/40" : "bg-foreground/5 text-muted-foreground border border-foreground/10"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${spacePublic ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/60"}`}
          />
          {status}
        </span>
      </div>

      <div className="grid gap-5 items-start md:grid-cols-[minmax(0,1.3fr),minmax(0,320px)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Public space link
            </label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="https://your-space-link"
              value={spaceUrl}
              onChange={(event) => onSpaceUrlChange(event.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              This link is what visitors click from the Live Now card.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Thumbnail image link
            </label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="https://your-image.jpg"
              value={spaceImageUrlInput}
              onChange={(event) => onImageUrlChange(event.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Paste an http(s) image URL (16:9 works best) or upload below.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Upload custom thumbnail
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs file:mr-3 file:rounded-md file:border file:border-foreground/10 file:bg-foreground/5 file:px-3 file:py-2 file:text-xs file:font-medium"
              />
              {spaceImage && (
                <button
                  type="button"
                  className="text-xs underline text-muted-foreground"
                  onClick={onImageClear}
                >
                  Remove image
                </button>
              )}
            </div>
            {imageError && (
              <p className="text-[11px] text-red-500">{imageError}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-xl text-xs text-muted-foreground">
              Publishing makes it easy for anyone to join directly from the Live
              Now directory.
            </div>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${buttonStyles}`}
              onClick={() => onToggleLive(!spacePublic)}
            >
              {buttonLabel}
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground">
            <span>Need to confirm what visitors see? </span>
            <a
              className="underline"
              href="/live"
              target="_blank"
              rel="noreferrer"
            >
              Open Live Now
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Live Now Preview</h3>
            <span className="text-[11px] text-muted-foreground">
              Matches the public card
            </span>
          </div>
          <div className="glass-pane max-w-sm rounded-xl border p-4 text-sm">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold text-foreground/80">
                  {ownerInitial}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{ownerLabel}</div>
                  <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {ownerSubLabel}
                  </div>
                </div>
              </div>
              {joinHref ? (
                <a
                  href={joinHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium"
                >
                  Join
                </a>
              ) : (
                <span className="px-3 py-1.5 rounded-md border bg-foreground/5 text-xs text-muted-foreground">
                  Add link
                </span>
              )}
            </div>

            {badgeTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badgeTags.map((tag) => (
                  <span key={tag} className="badge-soft microtext">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {joinHref ? (
              <a
                href={joinHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border transition-colors hover:opacity-95"
              >
                <div className="grid grid-cols-[80px,1fr] items-center gap-3 p-3">
                  {spaceImage ? (
                    <div className="h-20 w-20 overflow-hidden rounded-md bg-foreground/10">
                      <img
                        src={spaceImage}
                        alt="Live Now thumbnail preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-md bg-foreground/5 text-[11px] text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    {previewHost ? (
                      <div className="microtext mb-1 truncate">
                        {previewHost}
                      </div>
                    ) : null}
                    <div className="truncate text-sm font-medium">
                      {ownerLabel || "Live session"}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {previewDescription}
                    </div>
                  </div>
                </div>
              </a>
            ) : (
              <div className="rounded-lg border border-dashed bg-foreground/5 p-3 text-center text-[11px] text-muted-foreground">
                Add a valid link to see the compact Live Now card preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicSpacePanel;
