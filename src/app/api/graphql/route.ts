import { NextRequest } from "next/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { ApolloServer } from "@apollo/server";
import { getContainer } from "@/lib/cosmos";

const typeDefs = /* GraphQL */ `#graphql
  scalar JSON

  type Link { label: String!, url: String! }

  type User {
    wallet: ID!
    displayName: String
    bio: String
    pfpUrl: String
    xp: Int
    followersCount: Int
    followingCount: Int
    links: [Link!]
    live: Boolean
    liveSince: Float
    lastHeartbeat: Float
    spaceUrl: String
    spacePublic: Boolean
  }

  type FollowsInfo { followersCount: Int!, followingCount: Int!, viewerFollows: Boolean! }

  type LiveUser { wallet: ID!, displayName: String, pfpUrl: String, spaceUrl: String, liveSince: Float, lastHeartbeat: Float }

  type Query {
    user(wallet: ID!): User
    follows(wallet: ID!, viewer: ID): FollowsInfo!
    liveUsers: [LiveUser!]!
    leaderboard(limit: Int = 50): [User!]!
  }

  input LinkInput { label: String!, url: String! }

  type Mutation {
    upsertUser(wallet: ID!, displayName: String, bio: String, pfpUrl: String, links: [LinkInput!]): User!
    setPresence(wallet: ID!, live: Boolean!, spaceUrl: String, spacePublic: Boolean, sessionId: String): Boolean!
    follow(viewer: ID!, target: ID!, follow: Boolean!): Boolean!
  }
`;

const resolvers = {
  Query: {
    async user(_p: any, { wallet }: { wallet: string }) {
      const w = String(wallet || "").toLowerCase();
      const c = await getContainer();
      const id = `${w}:user`;
      try { const { resource } = await c.item(id, w).read<any>(); return resource || { wallet: w }; } catch { return { wallet: w }; }
    },
    async follows(_p: any, { wallet, viewer }: { wallet: string; viewer?: string }) {
      const w = String(wallet).toLowerCase();
      const v = String(viewer || "").toLowerCase();
      const c = await getContainer();
      let followersCount = 0, followingCount = 0, viewerFollows = false;
      try { const { resource } = await c.item(`${w}:user`, w).read<any>(); followersCount = Number(resource?.followersCount || 0); followingCount = Number(resource?.followingCount || 0); } catch {}
      if (/^0x[a-f0-9]{40}$/i.test(v) && v !== w) {
        try { const { resource } = await c.item(`${v}:follow:${w}`, v).read<any>(); viewerFollows = !!resource; } catch {}
      }
      return { followersCount, followingCount, viewerFollows };
    },
    async liveUsers() {
      const cutoff = Date.now() - 120_000;
      const c = await getContainer();
      const q = { query: "SELECT c.wallet, c.displayName, c.pfpUrl, c.spaceUrl, c.liveSince, c.lastHeartbeat FROM c WHERE c.type='user' AND c.live=true AND c.spacePublic=true AND c.lastHeartbeat > @cut ORDER BY c.lastHeartbeat DESC", parameters: [{ name: "@cut", value: cutoff }] } as any;
      const { resources } = await c.items.query(q).fetchAll();
      return (resources || []).map((u: any) => ({ wallet: u.wallet, displayName: u.displayName || null, pfpUrl: u.pfpUrl || null, spaceUrl: u.spaceUrl || null, liveSince: u.liveSince || null, lastHeartbeat: u.lastHeartbeat || null }));
    },
    async leaderboard(_p: any, { limit = 50 }: { limit?: number }) {
      const c = await getContainer();
      const q = { query: "SELECT c.wallet, c.displayName, c.pfpUrl, c.xp FROM c WHERE c.type='user' AND IS_DEFINED(c.xp) ORDER BY c.xp DESC OFFSET 0 LIMIT @lim", parameters: [{ name: "@lim", value: Math.min(200, Math.max(1, limit)) }] } as any;
      const { resources } = await c.items.query(q).fetchAll();
      return resources || [];
    },
  },
  Mutation: {
    async upsertUser(_p: any, { wallet, displayName, bio, pfpUrl, links }: { wallet: string; displayName?: string; bio?: string; pfpUrl?: string; links?: { label: string; url: string }[] }) {
      const w = String(wallet || "").toLowerCase();
      const c = await getContainer();
      const id = `${w}:user`;
      let current: any = null;
      try { const { resource } = await c.item(id, w).read<any>(); current = resource || { id, type: 'user', wallet: w, firstSeen: Date.now() }; } catch { current = { id, type: 'user', wallet: w, firstSeen: Date.now() }; }
      const next = { ...current, displayName, bio, pfpUrl, links: Array.isArray(links) ? links.slice(0,5) : current.links, lastSeen: Date.now() };
      await c.items.upsert(next);
      return next;
    },
    async setPresence(_p: any, { wallet, live, spaceUrl, spacePublic, sessionId }: { wallet: string; live: boolean; spaceUrl?: string; spacePublic?: boolean; sessionId?: string }) {
      const w = String(wallet || "").toLowerCase();
      const c = await getContainer();
      const id = `${w}:user`;
      let current: any = null;
      try { const { resource } = await c.item(id, w).read<any>(); current = resource || { id, type: 'user', wallet: w, firstSeen: Date.now() }; } catch { current = { id, type: 'user', wallet: w, firstSeen: Date.now() }; }
      const next: any = { ...current, lastHeartbeat: Date.now(), lastSeen: Date.now() };
      if (live) { next.live = true; if (!next.liveSince) next.liveSince = Date.now(); if (typeof spaceUrl === 'string') next.spaceUrl = spaceUrl; if (typeof spacePublic === 'boolean') next.spacePublic = spacePublic; if (sessionId) next.currentSessionId = String(sessionId).slice(0,80); }
      else { next.live = false; next.spacePublic = false; next.currentSessionId = undefined; }
      await c.items.upsert(next);
      return true;
    },
    async follow(_p: any, { viewer, target, follow }: { viewer: string; target: string; follow: boolean }) {
      const v = String(viewer || "").toLowerCase();
      const t = String(target || "").toLowerCase();
      if (!/^0x[a-f0-9]{40}$/i.test(v) || !/^0x[a-f0-9]{40}$/i.test(t) || v === t) return false;
      const c = await getContainer();
      const id = `${v}:follow:${t}`;
      if (follow) { await c.items.upsert({ id, type: 'follow', wallet: v, follower: v, target: t, ts: Date.now() } as any); }
      else { try { await c.item(id, v).delete(); } catch {} }
      try { const { resource } = await c.item(`${v}:user`, v).read<any>(); const following = Math.max(0, Number(resource?.followingCount || 0) + (follow?1:-1)); await c.items.upsert({ ...(resource||{}), id: `${v}:user`, type: 'user', wallet: v, followingCount: following, lastSeen: Date.now() }); } catch {}
      try { const { resource } = await c.item(`${t}:user`, t).read<any>(); const followers = Math.max(0, Number(resource?.followersCount || 0) + (follow?1:-1)); await c.items.upsert({ ...(resource||{}), id: `${t}:user`, type: 'user', wallet: t, followersCount: followers, lastSeen: Date.now() }); } catch {}
      return true;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const handler = startServerAndCreateNextHandler<NextRequest>(server);

export async function GET(request: NextRequest, _context: { params: Promise<{}> }) {
  return handler(request);
}
export async function POST(request: NextRequest, _context: { params: Promise<{}> }) {
  return handler(request);
}
