"use client";

import React from "react";
import { DefaultAvatar } from "@/components/default-avatar";
import { WalletActions } from "./wallet-actions";
import {
  StatusSection,
  InterestsSection,
  ContactSection,
  RelationshipSection,
  LinksSection,
  AboutSection,
  HeroBanner,
  RolesSection
} from "@/components/profile";
import { sanitizeProfileHtmlLimited } from "@/lib/sanitize";
import { LevelPFPFrame } from "@/components/LevelPFPFrame";
import { GenerativeArtBadge } from "@/components/GenerativeArtBadge";
import { calculateLevelProgress, DEFAULT_LOYALTY_CONFIG } from "@/utils/loyalty-math";

type LinkItem = { label: string; url: string };
type InterestItem = { name: string; category: string };
type ContactInfo = { email?: string; phone?: string; location?: string; website?: string; showEmail?: boolean; showPhone?: boolean; showLocation?: boolean; showWebsite?: boolean };
type StatusInfo = { message?: string; mood?: string; updatedAt?: number };
type RelationshipInfo = { status?: string; partner?: string };
type Profile = {
  wallet: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  links?: LinkItem[];
  xp?: number;
  roles?: { merchant?: boolean; buyer?: boolean };
  profileConfig?: { htmlBox?: string; backgroundUrl?: string; themeColor?: string };
  live?: boolean;
  spacePublic?: boolean;
  lastHeartbeat?: number;
  spaceUrl?: string;
  interests?: InterestItem[];
  contact?: ContactInfo;
  status?: StatusInfo;
  relationship?: RelationshipInfo;
  activeRing?: { type: 'platform' | 'merchant' | 'none'; wallet?: string };
};

function linkDotColor(url: string, label: string): string {
  const u = String(url || "").toLowerCase();
  const l = String(label || "").toLowerCase();
  if (u.includes("x.com") || /twitter|x\b/.test(l)) return "#111827";
  if (u.includes("youtube.com") || u.includes("youtu.be") || /youtube/.test(l)) return "#ef4444";
  if (u.includes("twitch.tv") || /twitch/.test(l)) return "#9146ff";
  if (u.includes("discord.gg") || u.includes("discord.com") || /discord/.test(l)) return "#5865f2";
  if (u.includes("github.com") || /github/.test(l)) return "#24292f";
  if (u.includes("linkedin.com") || /linkedin/.test(l)) return "#0a66c2";
  if (u.includes("instagram.com") || /instagram/.test(l)) return "#d6249f";
  if (u.includes("t.me") || u.includes("telegram.me") || /telegram/.test(l)) return "#26a4e3";
  if (u.includes("suno.") || /suno/.test(l)) return "#111827";
  if (u.includes("soundcloud.com") || /soundcloud/.test(l)) return "#ff5500";
  if (u.includes("mailto:") || /email|mail/.test(l)) return "#475569";
  return "#64748b";
}

function FollowControls({ wallet }: { wallet: string }) {
  // client island
  // @ts-ignore
  const Comp = require("./follow-client").FollowClient as any;
  return <Comp wallet={wallet} />;
}

function UserHeader({ wallet, profile, merchantXp }: { wallet: string; profile: Profile; merchantXp?: any[] }) {
  const name = profile.displayName || `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  const live = !!profile.live && !!profile.spacePublic && (!!profile.lastHeartbeat && profile.lastHeartbeat > Date.now() - 120000);
  const link = live && typeof profile.spaceUrl === "string" ? profile.spaceUrl : "";

  // Ring Logic
  const activeRing = profile.activeRing;
  const [ringProps, setRingProps] = React.useState<{ level: number; primaryColor?: string; secondaryColor?: string; ringText?: string } | null>(null);

  React.useEffect(() => {
    if (!activeRing || activeRing.type === 'none') {
      setRingProps(null);
      return;
    }

    if (activeRing.type === 'platform') {
      // Calculate Platform Level using proper utility
      const progress = calculateLevelProgress(profile.xp || 0, DEFAULT_LOYALTY_CONFIG);
      // Platform ring doesn't have text
      setRingProps({ level: progress.currentLevel, primaryColor: profile.profileConfig?.themeColor || '#8b5cf6' });
    } else if (activeRing.type === 'merchant' && activeRing.wallet) {
      // Find merchant XP
      const mXpData = merchantXp?.find(m => m.merchant.toLowerCase() === activeRing.wallet?.toLowerCase());
      const xp = mXpData?.xp || 0;
      const merchantProgress = calculateLevelProgress(xp, DEFAULT_LOYALTY_CONFIG);

      // Fetch Merchant Config for Colors and Name
      fetch(`/api/shop/config`, { headers: { 'x-wallet': activeRing.wallet } })
        .then(r => r.json())
        .then(data => {
          const theme = data.config?.theme;
          const shopName = data.config?.name;
          setRingProps({
            level: merchantProgress.currentLevel,
            primaryColor: theme?.primaryColor || '#ffffff',
            secondaryColor: theme?.secondaryColor,
            ringText: shopName
          });
        })
        .catch(() => setRingProps({ level: merchantProgress.currentLevel }));
    }
  }, [activeRing, profile.xp, merchantXp]);

  return (
    <div className="glass-pane rounded-xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-5 min-w-0">
        <div className="flex-shrink-0">
          {(!activeRing || activeRing.type === 'none') ? (
            <div className="rounded-full bg-foreground/10 overflow-hidden" style={{ width: 140, height: 140 }}>
              {profile.pfpUrl ? <img src={profile.pfpUrl} alt={name} className="w-full h-full object-cover" /> : <DefaultAvatar seed={wallet} size={140} className="w-full h-full" />}
            </div>
          ) : (
            <LevelPFPFrame
              level={ringProps?.level || 1}
              size={140}
              showAnimation={true}
              glowIntensity={1.5}
              profileImageUrl={profile.pfpUrl}
              primaryColor={ringProps?.primaryColor}
              innerRingColor={ringProps?.secondaryColor}
              ringText={ringProps?.ringText}
              textColor={ringProps?.primaryColor}
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold truncate">{name}</div>
            {live && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-0.5 rounded-full border bg-red-500/10 border-red-500/40 text-red-300 whitespace-nowrap"
              >
                Live Now
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="font-mono text-xs text-muted-foreground truncate max-w-[55vw] md:max-w-none">
              {wallet.slice(0, 10)}…{wallet.slice(-6)}
            </div>
            <WalletActions wallet={wallet} className="hidden sm:flex" />
          </div>
          <div className="mt-1 text-sm">
            XP: <span className="font-semibold">{profile.xp || 0}</span>
          </div>
          <div className="sm:hidden mt-2">
            <WalletActions wallet={wallet} />
          </div>
          <FollowControls wallet={wallet} />
        </div>
      </div>
      {live && link && (
        <div>
          <a href={link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-sm text-center block">
            Join
          </a>
        </div>
      )}
    </div>
  );
}

export default function PublicClient({ wallet }: { wallet: string }) {
  const [profile, setProfile] = React.useState<Profile>({ wallet });
  const [loading, setLoading] = React.useState<boolean>(true);

  // Reviews state (merchant subject)
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [reviewsError, setReviewsError] = React.useState("");

  // Write review modal
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewSubject, setReviewSubject] = React.useState<{ type: "merchant" | "shop" | "inventory"; id: string } | null>(null);
  const [reviewReceiptId, setReviewReceiptId] = React.useState("");
  const [reviewRating, setReviewRating] = React.useState<number>(5);
  const [reviewTitle, setReviewTitle] = React.useState<string>("");
  const [reviewBody, setReviewBody] = React.useState<string>("");
  const [reviewSaving, setReviewSaving] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string>("");

  // Message modal
  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgBody, setMsgBody] = React.useState("");
  const [msgSending, setMsgSending] = React.useState(false);
  const [msgError, setMsgError] = React.useState("");

  // Purchases for dropdowns (message/review)
  const [myReceipts, setMyReceipts] = React.useState<Array<{ receiptId: string; merchantWallet: string; shopSlug?: string; lineItems?: any[] }>>([]);
  const [myReceiptsLoading, setMyReceiptsLoading] = React.useState(false);

  // Message: optional receipt reference
  const [selectedReceiptId, setSelectedReceiptId] = React.useState<string>("");

  // Review scope: entire order (merchant) vs specific item (inventory)
  const [reviewScope, setReviewScope] = React.useState<"merchant" | "inventory">("merchant");
  const [reviewItemId, setReviewItemId] = React.useState<string>("");

  // Selected receipt object for review item dropdown
  const selectedReviewReceipt = React.useMemo(
    () => (myReceipts || []).find((r) => r.receiptId === reviewReceiptId) || null,
    [myReceipts, reviewReceiptId]
  );

  const bgUrl = String(profile?.profileConfig?.backgroundUrl || "").trim();
  const showHero = /^https?:\/\//i.test(bgUrl);

  /* PublicClient State */
  const [merchantXp, setMerchantXp] = React.useState<any[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/users/profile?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!cancelled) {
          setProfile(j?.profile || { wallet });
          setMerchantXp(Array.isArray(j?.merchantXp) ? j.merchantXp : []);
        }
      } catch {
        if (!cancelled) setProfile({ wallet });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  // Load public reviews for merchant (wallet)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setReviewsLoading(true);
        setReviewsError("");
        const r = await fetch(`/api/reviews?subjectType=merchant&subjectId=${encodeURIComponent(wallet)}`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!cancelled) {
          if (!r.ok || j?.ok !== true) {
            setReviewsError(j?.error || "Failed to load reviews");
            setReviews([]);
          } else {
            setReviews(Array.isArray(j?.items) ? j.items : []);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setReviewsError(e?.message || "Failed to load reviews");
          setReviews([]);
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  // Load buyer's receipts (filtered to this merchant) for dropdowns
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMyReceiptsLoading(true);
        const r = await fetch("/api/orders/me", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!cancelled) {
          if (!r.ok || j?.ok !== true) {
            setMyReceipts([]);
          } else {
            const arr = Array.isArray(j?.items) ? j.items : [];
            const filtered = arr.filter((x: any) => String(x?.merchantWallet || "").toLowerCase() === String(wallet).toLowerCase());
            setMyReceipts(
              filtered.map((x: any) => ({
                receiptId: String(x.receiptId || ""),
                merchantWallet: String(x.merchantWallet || ""),
                shopSlug: typeof x.shopSlug === "string" ? String(x.shopSlug) : undefined,
                lineItems: Array.isArray(x.lineItems) ? x.lineItems : []
              }))
            );
          }
        }
      } catch {
        if (!cancelled) setMyReceipts([]);
      } finally {
        if (!cancelled) setMyReceiptsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  function openWriteReviewForMerchant() {
    setReviewSubject({ type: "merchant", id: wallet });
    setReviewReceiptId("");
    setReviewItemId("");
    setReviewScope("merchant");
    setReviewRating(5);
    setReviewTitle("");
    setReviewBody("");
    setReviewError("");
    setReviewOpen(true);
  }

  async function submitReview() {
    try {
      // Require receipt and scope consistency
      if (!reviewReceiptId) return;
      const subjectType = reviewScope === "inventory" ? "inventory" : "merchant";
      const subjectId = reviewScope === "inventory" ? String(reviewItemId || "") : wallet;
      if (!subjectId) return;

      setReviewSaving(true);
      setReviewError("");

      const payload = {
        subjectType,
        subjectId,
        receiptId: reviewReceiptId,
        rating: Math.max(1, Math.min(5, Number(reviewRating || 5))),
        title: reviewTitle || undefined,
        body: reviewBody || undefined
      };
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok !== true) {
        setReviewError(j?.error || "Failed to submit review");
        return;
      }
      setReviewOpen(false);
      // refresh merchant reviews shown on the profile
      try {
        const rr = await fetch(`/api/reviews?subjectType=merchant&subjectId=${encodeURIComponent(wallet)}`, { cache: "no-store" });
        const jj = await rr.json().catch(() => ({}));
        if (rr.ok && jj?.ok === true) {
          setReviews(Array.isArray(jj?.items) ? jj.items : []);
        }
      } catch { }
    } catch (e: any) {
      setReviewError(e?.message || "Failed to submit review");
    } finally {
      setReviewSaving(false);
    }
  }

  async function sendMessage() {
    try {
      setMsgSending(true);
      setMsgError("");
      // Create or upsert a conversation with merchant subject or a specific order if referenced
      const cRes = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          participants: [wallet],
          subject: selectedReceiptId ? { type: "order", id: selectedReceiptId } : { type: "merchant", id: wallet }
        })
      });
      const cJson = await cRes.json().catch(() => ({}));
      if (!cRes.ok || cJson?.ok !== true) {
        setMsgError(cJson?.error || "Failed to start conversation");
        return;
      }
      const convoId = String(cJson?.conversation?.id || "");
      if (!convoId) {
        setMsgError("Conversation not created");
        return;
      }
      // Send initial message
      const mRes = await fetch(`/api/messages/conversations/${encodeURIComponent(convoId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ body: msgBody })
      });
      const mJson = await mRes.json().catch(() => ({}));
      if (!mRes.ok || mJson?.ok !== true) {
        setMsgError(mJson?.error || "Failed to send message");
        return;
      }
      setMsgOpen(false);
      setMsgBody("");
      setSelectedReceiptId("");
    } catch (e: any) {
      setMsgError(e?.message || "Failed to send message");
    } finally {
      setMsgSending(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="glass-pane rounded-xl border p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-foreground/10" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-foreground/10 rounded" />
              <div className="h-3 w-64 bg-foreground/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {showHero && (
        <div className="rounded-xl border overflow-hidden">
          <div
            className="w-full h-40 sm:h-48"
            style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        </div>
      )}

      {profile && profile.wallet ? (
        <UserHeader wallet={wallet} profile={profile} merchantXp={merchantXp} />
      ) : (
        <div className="glass-pane rounded-xl border p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-foreground/10" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-foreground/10 rounded" />
              <div className="h-3 w-64 bg-foreground/10 rounded" />
            </div>
          </div>
        </div>
      )}

      {/* Merchant Rating (shows even if no reviews) */}
      <div
        className="flex items-center justify-center gap-2 text-xl sm:text-2xl"
        title={
          (reviews && reviews.length)
            ? `${(((reviews || []).reduce((s: number, r: any) => s + Number(r?.rating || 0), 0) / (reviews as any[]).length) || 0).toFixed(2)} based on ${(reviews || []).length} reviews`
            : "Buy from this merchant to give the first review!"
        }
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={
              i <
                Math.round(
                  ((reviews || []).reduce((s: number, r: any) => s + Number(r?.rating || 0), 0) /
                    Math.max(1, (reviews as any[]).length)) || 0
                )
                ? "text-amber-500"
                : "text-muted-foreground"
            }
          >
            ★
          </span>
        ))}
        <span className="microtext text-muted-foreground">
          (
          {((reviews || []).length
            ? (reviews as any[]).reduce((s: number, r: any) => s + Number(r?.rating || 0), 0) / (reviews as any[]).length
            : 0
          ).toFixed(2)}
          )
        </span>
      </div>

      {profile.status?.message && (
        <StatusSection message={profile.status.message} updatedAt={profile.status.updatedAt} />
      )}

      <AboutSection bio={profile.bio || ""} htmlBox={profile.profileConfig?.htmlBox} />

      {/* Actions: Message / Write Review */}
      <div className="glass-pane rounded-xl border p-4 flex items-center gap-2">
        <button
          className="px-3 py-1.5 rounded-md border text-sm"
          onClick={() => setMsgOpen(true)}
          title="Send a message to this merchant"
        >
          Message
        </button>
        <button
          className="px-3 py-1.5 rounded-md border text-sm"
          onClick={openWriteReviewForMerchant}
          title="Write a public review (requires a completed receipt ID)"
        >
          Write Review
        </button>
      </div>

      {/* Reviews List */}
      <div className="glass-pane rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Public Reviews</div>
          <button
            className="px-2 py-1 rounded-md border text-xs"
            onClick={async () => {
              try {
                setReviewsLoading(true);
                const r = await fetch(`/api/reviews?subjectType=merchant&subjectId=${encodeURIComponent(wallet)}`, { cache: "no-store" });
                const j = await r.json().catch(() => ({}));
                if (!r.ok || j?.ok !== true) {
                  setReviewsError(j?.error || "Failed to refresh reviews");
                } else {
                  setReviews(Array.isArray(j?.items) ? j.items : []);
                }
              } finally {
                setReviewsLoading(false);
              }
            }}
            disabled={reviewsLoading}
          >
            {reviewsLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {reviewsError && <div className="microtext text-red-500">{reviewsError}</div>}
        <div className="space-y-2">
          {(reviews || []).map((rv: any) => (
            <div key={rv.id} className="rounded-md border p-2">
              <div className="flex items-center justify-between">
                <div className="microtext text-muted-foreground">
                  {new Date(Number(rv.createdAt || 0)).toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(Number(rv.rating || 0)) ? "text-amber-500" : "text-muted-foreground"}>
                      ★
                    </span>
                  ))}
                  <span className="microtext text-muted-foreground">({Number(rv.rating || 0).toFixed(2)})</span>
                </div>
              </div>
              {rv.title && <div className="text-sm font-medium mt-1">{rv.title}</div>}
              {rv.body && <div className="text-sm mt-1 whitespace-pre-wrap break-words">{rv.body}</div>}
            </div>
          ))}
          {(reviews || []).length === 0 && !reviewsLoading && (
            <div className="microtext text-muted-foreground">No reviews yet.</div>
          )}
        </div>
      </div>

      <InterestsSection interests={profile.interests || []} />

      <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
        <ContactSection contact={profile.contact || {}} />
        <RelationshipSection relationship={profile.relationship || {}} />
        <LinksSection links={profile.links || []} />
        <RolesSection merchant={!!profile.roles?.merchant} buyer={!!profile.roles?.buyer} />
      </div>

      {/* Message Modal */}
      {msgOpen && typeof window !== "undefined" ? (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border bg-background p-0 relative shadow-xl">
            <div className="p-4 border-b bg-gradient-to-r from-foreground/10 to-transparent rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Message Merchant</div>
                  <div className="microtext text-muted-foreground">Your message will appear in Admin → Messages panel</div>
                </div>
                <button
                  onClick={() => setMsgOpen(false)}
                  className="h-8 w-8 rounded-full border bg-white text-black shadow-sm flex items-center justify-center"
                  title="Close"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="microtext text-muted-foreground mb-2">
                Be specific. Include order IDs if applicable. You can continue the conversation in the Admin module.
              </div>

              {/* Optional: reference a specific receipt to start an Order conversation */}
              <div className="mb-2">
                <label className="microtext text-muted-foreground">Reference Receipt (optional)</label>
                <select
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                  value={selectedReceiptId}
                  onChange={(e) => setSelectedReceiptId(e.target.value)}
                >
                  <option value="">No receipt selected</option>
                  {(myReceipts || []).map((r) => (
                    <option key={r.receiptId} value={r.receiptId}>
                      {r.receiptId} {r.shopSlug ? `• ${r.shopSlug}` : ""}
                    </option>
                  ))}
                </select>
                {myReceiptsLoading && <div className="microtext text-muted-foreground mt-1">Loading your receipts…</div>}
              </div>

              <textarea
                className="mt-1 w-full h-28 px-3 py-2 border rounded-md bg-background"
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Type your message…"
              />
              {msgError && <div className="microtext text-red-500 mt-2">{msgError}</div>}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button className="px-3 py-1.5 rounded-md border text-sm" onClick={() => setMsgOpen(false)}>
                  Cancel
                </button>
                <button className="px-3 py-1.5 rounded-md border text-sm" onClick={sendMessage} disabled={msgSending || !msgBody.trim()}>
                  {msgSending ? "Sending…" : "Send"}
                </button>
              </div>
              <div className="microtext text-muted-foreground mt-3">
                Tip: Open Admin → Messages panel to see replies and manage your conversations.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Write Review Modal */}
      {reviewOpen && typeof window !== "undefined" ? (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border bg-background p-0 relative shadow-xl">
            <div className="p-4 border-b bg-gradient-to-r from-foreground/10 to-transparent rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Write a Review</div>
                  <div className="microtext text-muted-foreground">Reviews help others — verified purchases only</div>
                </div>
                <button
                  onClick={() => setReviewOpen(false)}
                  className="h-8 w-8 rounded-full border bg-white text-black shadow-sm flex items-center justify-center"
                  title="Close"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div>
                  <label className="microtext text-muted-foreground">Select Receipt</label>
                  <select
                    className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                    value={reviewReceiptId}
                    onChange={(e) => setReviewReceiptId(e.target.value)}
                  >
                    <option value="">Select a receipt...</option>
                    {(myReceipts || []).map((r) => (
                      <option key={r.receiptId} value={r.receiptId}>
                        {r.receiptId} {r.shopSlug ? `• ${r.shopSlug}` : ""}
                      </option>
                    ))}
                  </select>
                  {myReceiptsLoading && <div className="microtext text-muted-foreground mt-1">Loading your receipts…</div>}
                </div>
                <div>
                  <label className="microtext text-muted-foreground">Scope</label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="flex items-center gap-2 microtext">
                      <input type="radio" checked={reviewScope === "merchant"} onChange={() => setReviewScope("merchant")} />
                      Entire Order (Merchant)
                    </label>
                    <label className="flex items-center gap-2 microtext">
                      <input type="radio" checked={reviewScope === "inventory"} onChange={() => setReviewScope("inventory")} />
                      Specific Item
                    </label>
                  </div>
                </div>
                {reviewScope === "inventory" && (
                  <div>
                    <label className="microtext text-muted-foreground">Select Item</label>
                    <select
                      className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                      value={reviewItemId}
                      onChange={(e) => setReviewItemId(e.target.value)}
                      disabled={!selectedReviewReceipt}
                    >
                      <option value="">Select an item...</option>
                      {Array.isArray(selectedReviewReceipt?.lineItems) &&
                        (selectedReviewReceipt!.lineItems || [])
                          .filter((li: any) => !!li?.itemId)
                          .map((li: any, idx: number) => (
                            <option key={idx} value={String(li.itemId)}>
                              {li.label || li.sku || String(li.itemId)}
                            </option>
                          ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="microtext text-muted-foreground">Rating</label>
                  <div className="flex items-center gap-2 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`h-7 w-7 rounded-md border grid place-items-center ${i < reviewRating ? "bg-amber-100 border-amber-300" : "bg-background"}`}
                        onClick={() => setReviewRating(i + 1)}
                        aria-label={`Set rating ${i + 1}`}
                        title={`Set rating ${i + 1}`}
                      >
                        <span className={i < reviewRating ? "text-amber-500" : "text-muted-foreground"}>★</span>
                      </button>
                    ))}
                    <span className="microtext text-muted-foreground">({Number(reviewRating).toFixed(2)})</span>
                  </div>
                </div>
                <div>
                  <label className="microtext text-muted-foreground">Title (optional)</label>
                  <input
                    className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g., Great experience"
                  />
                </div>
                <div>
                  <label className="microtext text-muted-foreground">Review</label>
                  <textarea
                    className="mt-1 w-full h-24 px-3 py-2 border rounded-md bg-background"
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Share details about your experience…"
                  />
                </div>
                {reviewError && <div className="microtext text-red-500">{reviewError}</div>}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button className="px-3 py-1.5 rounded-md border text-sm" onClick={() => setReviewOpen(false)}>
                  Cancel
                </button>
                <button className="px-3 py-1.5 rounded-md border text-sm" onClick={submitReview} disabled={reviewSaving || !reviewReceiptId.trim()}>
                  {reviewSaving ? "Submitting…" : "Submit Review"}
                </button>
              </div>
              <div className="microtext text-muted-foreground mt-3">
                You can track your submitted reviews in Admin → My Purchases. Messaging follow-ups happen in Admin → Messages panel.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
