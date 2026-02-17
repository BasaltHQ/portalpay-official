import { NextRequest, NextResponse } from "next/server";
import { getInternalBaseUrl } from "@/lib/base-url";

/**
 * Recommends which token to use for settlement and how frequently,
 * based on configured reserve ratios vs current balances.
 * 
 * Algorithm:
 * 1. Fetch current balances in USD from /api/reserve/balances
 * 2. Fetch target ratios from /api/site/config
 * 3. Compute deficit = target - current for each token
 * 4. Pick token with largest positive deficit (needs most filling)
 * 5. If no deficit, pick token with smallest current balance
 * 6. Frequency: map deficit fraction to cadence
 *    - deficit >= 20% of total -> every transaction
 *    - deficit >= 10% -> every 2
 *    - deficit >= 5% -> every 3
 *    - else -> every 5
 * 
 * Query params:
 *   - receiptUsd: optional upcoming payment amount to consider
 */
export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const url = new URL(req.url);
    const receiptUsd = Number(url.searchParams.get("receiptUsd") || 0);
    const headerWallet = String(req.headers.get("x-wallet") || "");

    // Fetch current balances
    const internalBase = getInternalBaseUrl();
    const balancesUrl = new URL("/api/reserve/balances", internalBase);
    const balRes = await fetch(balancesUrl.toString(), {
      headers: {
        "x-wallet": headerWallet,
      },
    }).catch(() => null);
    if (!balRes || !balRes.ok) {
      return NextResponse.json(
        { error: "failed_to_fetch_balances" },
        { status: 500, headers: { "x-correlation-id": correlationId } }
      );
    }
    const balData = await balRes.json().catch(() => ({}));
    const balances = balData?.balances || {};
    const totalUsd = Number(balData?.totalUsd || 0);

    // Fetch configured ratios
    const configUrl = new URL("/api/site/config", internalBase);
    const cfgRes = await fetch(configUrl.toString(), {
      headers: {
        "x-wallet": headerWallet,
      },
    }).catch(() => null);
    const cfgData = cfgRes?.ok ? await cfgRes.json().catch(() => ({})) : {};
    const config = cfgData?.config || {};
    const ratios: Record<string, number> = config.reserveRatios || {
      USDC: 0.2,
      USDT: 0.2,
      cbBTC: 0.2,
      cbXRP: 0.2,
      ETH: 0.2,
    };

    // Compute target USD for each token based on total + receiptUsd
    const futureTotal = totalUsd + (receiptUsd > 0 ? receiptUsd : 0);
    const targets: Record<string, number> = {};
    const currentUsd: Record<string, number> = {};
    const deficits: Record<string, number> = {};

    for (const symbol of ["USDC", "USDT", "cbBTC", "cbXRP", "ETH"]) {
      const ratio = Number(ratios[symbol] || 0);
      targets[symbol] = futureTotal * ratio;
      currentUsd[symbol] = Number(balances[symbol]?.usd || 0);
      deficits[symbol] = targets[symbol] - currentUsd[symbol];
    }

    // Pick token with largest positive deficit, or smallest current if all negative
    let recommendedToken = "USDC";
    let maxDeficit = deficits["USDC"] || 0;
    for (const symbol of ["USDT", "cbBTC", "cbXRP", "ETH"]) {
      const d = deficits[symbol] || 0;
      if (d > maxDeficit) {
        maxDeficit = d;
        recommendedToken = symbol;
      }
    }
    // If all deficits are negative or zero, pick token with smallest current balance
    if (maxDeficit <= 0) {
      let minCurrent = currentUsd["USDC"] || 0;
      recommendedToken = "USDC";
      for (const symbol of ["USDT", "cbBTC", "cbXRP", "ETH"]) {
        const c = currentUsd[symbol] || 0;
        if (c < minCurrent) {
          minCurrent = c;
          recommendedToken = symbol;
        }
      }
    }

    // Frequency suggestion based on deficit fraction
    const deficitFraction = futureTotal > 0 ? Math.max(0, maxDeficit) / futureTotal : 0;
    let frequency = 5; // default: every 5 transactions
    if (deficitFraction >= 0.2) frequency = 1;
    else if (deficitFraction >= 0.1) frequency = 2;
    else if (deficitFraction >= 0.05) frequency = 3;

    return NextResponse.json(
      {
        recommendedToken,
        frequency,
        deficitFraction,
        maxDeficit,
        totalUsd,
        futureTotal,
        targets,
        currentUsd,
        deficits,
      },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "recommendation_failed" },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}
