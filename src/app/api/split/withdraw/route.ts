import { NextRequest, NextResponse } from "next/server";

/**
 * Deprecated: Server-side admin-triggered split withdrawals
 *
 * This endpoint previously used an admin private key to call PaymentSplitter.release
 * on behalf of recipients. To improve security and follow the requested design,
 * all split release/withdraw actions must be executed client-side using the
 * connected wallet (useActiveAccount) directly against the split contract.
 *
 * New flow:
 * - Platform Release (Admin Users Panel): call PaymentSplitter.release(account) or
 *   release(token, account) where account = NEXT_PUBLIC_RECIPIENT_ADDRESS, and contract
 *   address = merchant's splitAddressUsed.
 * - Merchant Withdraw (Reserve Analytics): call PaymentSplitter.release(account) or
 *   release(token, account) where account = merchant wallet.
 *
 * See implementations in src/app/admin/page.tsx:
 * - UsersPanel: releasePlatformShare(wallet, onlySymbol?) using connected wallet
 * - ReserveAnalytics: withdrawMerchant(onlySymbol?) using connected wallet
 *
 * This route is now disabled to prevent usage of THIRDWEB_ADMIN_PRIVATE_KEY.
 */

export async function POST(_req: NextRequest) {
  const cid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : undefined;
  return NextResponse.json(
    {
      error: "deprecated",
      reason: "use_connected_wallet",
      message:
        "Server-side split withdrawals have been deprecated. Execute PaymentSplitter.release via the connected wallet in the client UI. Platform should pass NEXT_PUBLIC_RECIPIENT_ADDRESS as the account; merchants should pass their own wallet.",
      cid,
    },
    {
      status: 410,
      headers: cid ? { "x-correlation-id": cid } : undefined,
    }
  );
}
