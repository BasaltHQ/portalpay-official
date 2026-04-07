"use server";

export async function getCoinbaseAppId() {
  const appId = process.env.COINBASE_CLIENT_API_KEY || process.env.NEXT_PUBLIC_COINBASE_CLIENT_API_KEY;
  if (!appId) {
    throw new Error("COINBASE_CLIENT_API_KEY is not defined in the environment.");
  }
  const isEnabled = process.env.OFFRAMP?.toUpperCase() === 'TRUE';
  return { appId, isEnabled };
}
