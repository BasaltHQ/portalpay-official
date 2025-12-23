import { recoverTypedDataAddress } from "viem";
import { chain } from "@/lib/thirdweb/server";
import { getBrandConfig, getBrandKey } from "@/config/brands";

/**
 * EIP-712 typed signature verification for destructive admin actions.
 * Domain binds to chainId to mitigate replay across chains.
 */
export type AdminActionMessage = {
  action: string;
  target: string;
  nonce: bigint;
  correlationId: string;
};

function getDomain() {
  const chainId = (() => {
    try {
      const id: any = (chain as any)?.id;
      const n = Number(id);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    } catch {
      return undefined;
    }
  })();

  // Brand-aware domain name; resolves from active brand config with partner-safe behavior
  let name = "Admin";
  try {
    const key = getBrandKey();
    const eff = getBrandConfig(key);
    const brandName = typeof eff?.name === "string" && eff.name ? eff.name : "Admin";
    name = `${brandName} Admin`;
  } catch {
    name = "Admin";
  }

  return {
    name,
    version: "1",
    chainId,
  } as const;
}

const types = {
  Action: [
    { name: "action", type: "string" },
    { name: "target", type: "string" },
    { name: "nonce", type: "uint256" },
    { name: "correlationId", type: "string" },
  ],
} as const;

/**
 * Verify that the typed signature recovers the expected admin address
 * for the provided action/target/nonce/correlationId.
 */
export async function verifyAdminActionSignature(params: {
  signature: `0x${string}`;
  address: string;
  action: string;
  target: string;
  correlationId: string;
  nonce: bigint | number | string;
}): Promise<boolean> {
  const { signature, address, action, target, correlationId } = params;
  let nonce: bigint;
  try {
    const n = BigInt(params.nonce as any);
    nonce = n >= BigInt(0) ? n : BigInt(0);
  } catch {
    nonce = BigInt(0);
  }
  const message: AdminActionMessage = {
    action: String(action || ""),
    target: String(target || ""),
    nonce,
    correlationId: String(correlationId || ""),
  };
  try {
    const recovered = await recoverTypedDataAddress({
      domain: getDomain(),
      types,
      primaryType: "Action",
      message,
      signature,
    });
    return recovered?.toLowerCase() === String(address || "").toLowerCase();
  } catch {
    return false;
  }
}
