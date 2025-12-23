import { Metadata } from 'next';
import PublicClient from "./public-client";
import { getBrandConfig } from "@/config/brands";

type Profile = {
  displayName?: string;
  bio?: string;
};

export async function generateMetadata({ params }: { params: Promise<{ wallet: string }> }): Promise<Metadata> {
  const brand = getBrandConfig();
  try {
    const { wallet } = await params;
    const walletLc = (wallet || "").toLowerCase();
    
    // Fetch brand-scoped and legacy profile directly from Cosmos DB and merge in Platform context
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    
    let profile: Profile = {};
    try {
      const brandKey = String(getBrandConfig().key || "").toLowerCase();
      let primary: any | undefined;
      let legacy: any | undefined;
      try {
        const r = await container.item(`${walletLc}:user:${brandKey}`, walletLc).read<any>();
        primary = r?.resource || undefined;
      } catch {}
      try {
        const r2 = await container.item(`${walletLc}:user`, walletLc).read<any>();
        legacy = r2?.resource || undefined;
      } catch {}
      const isPlatform = String(process.env.CONTAINER_TYPE || process.env.NEXT_PUBLIC_CONTAINER_TYPE || "platform").toLowerCase() === "platform";
      const merged = isPlatform ? { ...(legacy || {}), ...(primary || {}) } : (primary ?? legacy);
      if (merged) {
        profile = {
          displayName: merged.displayName,
          bio: merged.bio,
        };
      }
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    }
    
    const displayName = profile.displayName || `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    const bio = profile.bio || '';
    const truncatedBio = bio.length > 160 ? bio.slice(0, 157) + '...' : bio;
    const description = truncatedBio || `View ${displayName}'s profile on ${brand.name}`;
    
    return {
      title: `${displayName} • ${brand.name}`,
      description,
      openGraph: {
        type: 'profile',
        siteName: brand.name,
        title: `${displayName} • ${brand.name}`,
        description,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${displayName} • ${brand.name}`,
        description,
      },
    };
  } catch (error) {
    const { wallet } = await params;
    const displayName = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    return {
      title: `${displayName} • ${getBrandConfig().name}`,
      description: `${getBrandConfig().name} user profile`,
      openGraph: {
        type: 'profile',
        siteName: getBrandConfig().name,
      },
      twitter: {
        card: 'summary_large_image',
      },
    };
  }
}

export default async function UserPublicPage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  const walletLc = (wallet || "").toLowerCase();
  return <PublicClient wallet={walletLc} />;
}
