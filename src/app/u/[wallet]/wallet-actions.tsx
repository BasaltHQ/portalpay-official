"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { prepareTransaction, getContract, prepareContractCall, readContract } from "thirdweb";
import { client, chain, getRecipientAddress } from "@/lib/thirdweb/client";
import { getRpcClient, eth_getBalance } from "thirdweb/rpc";

export function WalletActions({ wallet, className = "" }: { wallet: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [amount, setAmount] = useState<string>("0.01");
  const [token, setToken] = useState<"ETH" | "USDC" | "USDT" | "cbXRP" | "cbBTC">("ETH");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const activeAccount = useActiveAccount();
  const [balanceRaw, setBalanceRaw] = useState<bigint>(BigInt(0));
  const [fetchingBal, setFetchingBal] = useState(false);
  const [inputMode, setInputMode] = useState<"token" | "usd">("token");
  const [rates, setRates] = useState<{ ETH_USD: number; BTC_USD: number; XRP_USD: number }>({ ETH_USD: 0, BTC_USD: 0, XRP_USD: 0 });

  function copy() {
    try { navigator.clipboard.writeText(wallet).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false), 1200); }); } catch {}
  }

  function preset(v: string) { setAmount(v); setTipOpen(true); }

  function parseToUnits(v: string, decimals: number): bigint {
    const n = Math.max(0, Number(v || 0));
    const s = n.toFixed(Math.max(0, Math.min(18, decimals)));
    const [w, f = ""] = s.split(".");
    const frac = (f + "0".repeat(decimals)).slice(0, decimals);
    return BigInt(w) * BigInt("1" + "0".repeat(decimals)) + BigInt(frac || "0");
  }

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(String(addr || ""));

  const USDC_ADDR = process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS || "";
  const USDT_ADDR = process.env.NEXT_PUBLIC_BASE_USDT_ADDRESS || "";
  const CBBTC_ADDR = process.env.NEXT_PUBLIC_BASE_CBBTC_ADDRESS || "";
  const CBXRP_ADDR = process.env.NEXT_PUBLIC_BASE_CBXRP_ADDRESS || "";

  const USDC_DEC = Number(process.env.NEXT_PUBLIC_BASE_USDC_DECIMALS || 6);
  const USDT_DEC = Number(process.env.NEXT_PUBLIC_BASE_USDT_DECIMALS || 6);
  const CBBTC_DEC = Number(process.env.NEXT_PUBLIC_BASE_CBBTC_DECIMALS || 8);
  const CBXRP_DEC = Number(process.env.NEXT_PUBLIC_BASE_CBXRP_DECIMALS || 6);

  type TokenSymbol = "ETH" | "USDC" | "USDT" | "cbBTC" | "cbXRP";
  type TokenDef = { symbol: TokenSymbol; type: "native" | "erc20"; address?: `0x${string}`; decimals: number };

  const supportedTokens: TokenDef[] = [{ symbol: "ETH", type: "native", decimals: 18 }];
  if (isValidAddress(USDC_ADDR)) supportedTokens.push({ symbol: "USDC", type: "erc20", address: USDC_ADDR as `0x${string}`, decimals: USDC_DEC });
  if (isValidAddress(USDT_ADDR)) supportedTokens.push({ symbol: "USDT", type: "erc20", address: USDT_ADDR as `0x${string}`, decimals: USDT_DEC });
  if (isValidAddress(CBBTC_ADDR)) supportedTokens.push({ symbol: "cbBTC", type: "erc20", address: CBBTC_ADDR as `0x${string}`, decimals: CBBTC_DEC });
  if (isValidAddress(CBXRP_ADDR)) supportedTokens.push({ symbol: "cbXRP", type: "erc20", address: CBXRP_ADDR as `0x${string}`, decimals: CBXRP_DEC });

  // Format big integer token balance into readable units (approximate for display)
  function formatUnits(raw: bigint, decimals: number): string {
    try {
      const n = Number(raw) / Math.pow(10, decimals);
      if (!isFinite(n)) return "~";
      return n.toFixed(Math.min(6, decimals));
    } catch {
      return "~";
    }
  }

  // Live USD rates for conversions
  React.useEffect(() => {
    if (!tipOpen) return;
    (async () => {
      try {
        const r = await fetch(`/api/reserve/balances?wallet=${encodeURIComponent(activeAccount?.address || "")}`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        setRates({
          ETH_USD: Number(j?.rates?.ETH_USD || 0),
          BTC_USD: Number(j?.rates?.BTC_USD || 0),
          XRP_USD: Number(j?.rates?.XRP_USD || 0),
        });
      } catch {
        // ignore
      }
    })();
  }, [tipOpen, activeAccount?.address]);

  function getUsdRateFor(symbol: TokenSymbol): number {
    switch (symbol) {
      case "USDC":
      case "USDT":
        return 1.0;
      case "ETH":
        return Number(rates.ETH_USD || 0);
      case "cbBTC":
        return Number(rates.BTC_USD || 0);
      case "cbXRP":
        return Number(rates.XRP_USD || 0);
      default:
        return 0;
    }
  }

  function tokenAmountFromUsd(usd: number, symbol: TokenSymbol): string {
    const rate = getUsdRateFor(symbol);
    if (!rate || rate <= 0) return "0";
    const amt = Math.max(0, Number(usd || 0)) / rate;
    return amt.toFixed(6);
  }

  function usdFromTokenAmount(amountStr: string, symbol: TokenSymbol): string {
    const rate = getUsdRateFor(symbol);
    const val = Math.max(0, Number(amountStr || 0)) * (rate > 0 ? rate : 0);
    return val.toFixed(2);
  }

  // Fetch active wallet balance for selected token whenever modal opens / token changes
  React.useEffect(() => {
    if (!tipOpen) return;
    if (!activeAccount?.address) {
      setBalanceRaw(BigInt(0));
      return;
    }
    const sel = supportedTokens.find((t) => t.symbol === token);
    if (!sel) return;

    let cancelled = false;
    (async () => {
      setFetchingBal(true);
      try {
        if (sel.type === "native") {
          const rpc = getRpcClient({ client, chain });
          const hex = await eth_getBalance(rpc, { address: activeAccount.address as `0x${string}` });
          if (!cancelled) setBalanceRaw(BigInt(hex));
        } else if (sel.address) {
          const contract = getContract({ client, chain, address: sel.address as `0x${string}` });
          const res = await readContract({
            contract,
            method: "function balanceOf(address) view returns (uint256)",
            params: [activeAccount.address as `0x${string}`],
          });
          const bi = typeof res === "bigint" ? res : BigInt(String(res));
          if (!cancelled) setBalanceRaw(bi);
        } else {
          if (!cancelled) setBalanceRaw(BigInt(0));
        }
      } catch {
        if (!cancelled) setBalanceRaw(BigInt(0));
      } finally {
        if (!cancelled) setFetchingBal(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tipOpen, activeAccount?.address, token]);

  const selectedToken = supportedTokens.find((t) => t.symbol === token);
  const amountNativeStr = selectedToken ? (inputMode === "usd" ? tokenAmountFromUsd(Number(amount || 0), selectedToken.symbol) : amount) : amount;
  const desiredUnits = parseToUnits(amountNativeStr, selectedToken?.decimals || 18);
  const insufficient = !!activeAccount?.address && !!selectedToken && desiredUnits > balanceRaw;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button onClick={copy} className="px-2 py-1 rounded-md border text-xs">
        {copied ? "Copied" : "Copy"}
      </button>
      <button onClick={()=>setTipOpen(true)} className="px-2 py-1 rounded-md border text-xs">Tip</button>

      {tipOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 z-40 glass-backdrop" onClick={()=>setTipOpen(false)} />
            <div className="glass-float relative z-50 w-[min(480px,calc(100vw-24px))] rounded-xl border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Send a tip</div>
                <button className="px-2 py-1 rounded-md border text-xs" onClick={()=>setTipOpen(false)}>Close</button>
              </div>
              <div className="microtext text-muted-foreground mb-2">Funds go to this profile's wallet if valid; otherwise to the project wallet. Add a note in the transaction memo if you want.</div>
              {statusMsg && <div className="microtext text-[var(--primary)]">{statusMsg}</div>}
              {errorMsg && <div className="microtext text-red-500">{errorMsg}</div>}
              <div className="space-y-4">
                <div>
                  <div className="microtext text-muted-foreground mb-1">Select token</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {supportedTokens.map((t) => (
                      <button
                        key={t.symbol}
                        onClick={() => setToken(t.symbol as any)}
                        className={`px-2 py-1 rounded-md border text-xs ${token === t.symbol ? "bg-foreground/10" : ""}`}
                      >
                        {t.symbol}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="microtext text-muted-foreground">Select amount</div>
                    <div className="inline-flex items-center gap-1">
                      <button onClick={()=>setInputMode("token")} className={`px-2 py-1 rounded-md border text-xs ${inputMode==="token"?"bg-foreground/10":""}`}>Token</button>
                      <button onClick={()=>setInputMode("usd")} className={`px-2 py-1 rounded-md border text-xs ${inputMode==="usd"?"bg-foreground/10":""}`}>USD</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(inputMode==="token"
                      ? (
                        (() => {
                          const presets: Record<TokenSymbol,string[]> = {
                            ETH: ["0.005","0.01","0.025","0.05"],
                            USDC: ["1","5","10","20"],
                            USDT: ["1","5","10","20"],
                            cbBTC: ["0.00005","0.0001","0.00025","0.0005"],
                            cbXRP: ["10","25","50","100"],
                          };
                          return presets[token] || ["1","5","10","20"];
                        })()
                      )
                      : ["1","5","10","25"]
                    ).map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount(v)}
                        className={`px-3 py-1.5 rounded-md border ${amount===v? 'bg-foreground/10':''}`}
                      >
                        {inputMode==="token" ? `${v} ${token}` : `$${v}`}
                      </button>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        className="h-9 px-3 py-1 border rounded-md bg-background w-28"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={inputMode==="usd" ? "USD" : token}
                      />
                      <span className="microtext">{inputMode==="usd" ? "USD" : token}</span>
                    </div>
                  </div>
                  {selectedToken && (
                    <div className="microtext text-muted-foreground mt-1">
                      {inputMode==="token"
                        ? `≈ $${usdFromTokenAmount(amount, selectedToken.symbol)}`
                        : `≈ ${tokenAmountFromUsd(Number(amount||0), selectedToken.symbol)} ${selectedToken.symbol}`
                      }
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="microtext text-muted-foreground">
                    {fetchingBal ? "Fetching balance..." : (selectedToken ? `Balance: ${formatUnits(balanceRaw, selectedToken.decimals)} ${selectedToken.symbol}` : "")}
                  </div>
                  {insufficient && selectedToken && (
                    <div className="microtext text-red-500">
                      Insufficient {selectedToken.symbol} balance. Available {formatUnits(balanceRaw, selectedToken.decimals)} {selectedToken.symbol}; required {formatUnits(desiredUnits, selectedToken.decimals)} {selectedToken.symbol}.
                    </div>
                  )}
                </div>
              </div>
              <TransactionButton
                transaction={() => {
                  const recipient = (isValidAddress(wallet) ? (wallet as `0x${string}`) : getRecipientAddress()) as `0x${string}`;
                  const sel = supportedTokens.find((t) => t.symbol === token);
                  if (!sel) throw new Error("Unsupported token selected");
                  if (sel.type === "erc20" && !sel.address) throw new Error("Token address missing");
                  if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) throw new Error("Recipient address misconfigured");
                  const amountNativeStr = sel ? (inputMode === "usd" ? tokenAmountFromUsd(Number(amount || 0), sel.symbol) : amount) : amount;
                  const units = parseToUnits(amountNativeStr, sel.decimals);
                  if (units <= BigInt(0)) throw new Error("Enter a valid amount");
                  if (sel.type === "native") {
                    return prepareTransaction({ client, chain, to: recipient, value: units });
                  } else {
                    const contract = getContract({ client, chain, address: sel.address as `0x${string}` });
                    return prepareContractCall({
                      contract,
                      method: "function transfer(address to, uint256 value)",
                      params: [recipient, units],
                    });
                  }
                }}
                className="buy-button w-full text-center"
                disabled={
                  !activeAccount?.address ||
                  insufficient ||
                  fetchingBal ||
                  (selectedToken ? (inputMode === "usd" && getUsdRateFor(selectedToken.symbol) <= 0) : false)
                }
                onTransactionSent={() => { setStatusMsg("Transaction submitted. Awaiting confirmation..."); setErrorMsg(""); }}
                onError={(e) => { setErrorMsg(e?.message ? String(e.message) : "Transaction failed"); setStatusMsg(""); }}
                onTransactionConfirmed={() => setTipOpen(false)}
              >
                Send tip
              </TransactionButton>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}
