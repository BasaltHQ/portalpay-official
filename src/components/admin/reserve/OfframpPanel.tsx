"use client";

import React, { useState, useEffect, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getCoinbaseAppId } from "./offramp-actions";
import { initOnRamp, type MessageData } from "@coinbase/cbpay-js";
import { Building2, X, AlertCircle, ArrowRightLeft, DollarSign, WalletCards, ShieldCheck, Clock, Lock } from "lucide-react";

export function OfframpPanel() {
  const account = useActiveAccount();
  const [appId, setAppId] = useState<string>("");
  const [isEnabled, setIsEnabled] = useState<boolean>(true); // default true until fetched
  const [error, setError] = useState<string>("");
  const [statusText, setStatusText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const onrampInstance = useRef<any>(null);

  useEffect(() => {
    getCoinbaseAppId().then((res) => {
      setAppId(res.appId);
      setIsEnabled(res.isEnabled);
    }).catch((err) => setError(err.message));
  }, []);

  const handleInitiate = () => {
    if (!account) {
      setError("Wallet must be connected to initiate offramp.");
      return;
    }
    if (!appId) {
      setError("Missing Coinbase configuration.");
      return;
    }

    try {
      setIsProcessing(true);
      setStatusText("Connecting to Coinbase Secure Portal...");
      
      initOnRamp({
        appId,
        widgetParameters: {
          destinationWallets: [
            {
              address: account.address,
              blockchains: ["base"],
              assets: ["USDC"]
            }
          ]
        },
        onSuccess: () => {
          setStatusText("Offramp session successfully initialized.");
          setIsProcessing(false);
        },
        onExit: () => {
          setStatusText("Offramp window closed.");
          setIsProcessing(false);
        },
        onEvent: (event: MessageData) => {
          console.log("Coinbase Event:", event);
          const eventName = event.eventName as string;
          if (eventName === 'transition_view') {
              setStatusText("Offramp transaction in progress...");
          }
        }
      }, (error, instance) => {
         if (error) {
             setError("Failed to initialize Coinbase Offramp: " + error.message);
             setIsProcessing(false);
             return;
         }
         if (instance) {
             onrampInstance.current = instance;
             instance.open();
         }
      });

    } catch (err: any) {
      setError("Failed to open Coinbase Offramp: " + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 w-full relative min-h-[65vh]">
      
      {/* Coming Soon Overlay */}
      {!isEnabled && (
        <div className="absolute -inset-4 z-50 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center p-6">
           <div className="bg-[#0a0a0a] p-8 md:p-12 rounded-3xl flex flex-col items-center text-center max-w-lg border border-foreground/[0.05] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--pp-secondary)]/10 to-transparent pointer-events-none" />
              <div className="w-24 h-24 bg-foreground/[0.02] rounded-full flex items-center justify-center mb-6 border border-foreground/[0.05] shadow-lg relative z-10">
                 <Lock className="w-10 h-10 text-[var(--pp-secondary)]" />
              </div>
              <h3 className="text-xl uppercase font-bold tracking-[0.2em] text-foreground mb-4 relative z-10">Offramp Coming Soon</h3>
              <p className="text-muted-foreground/80 text-xs leading-relaxed mb-8 relative z-10 font-medium">
                 We are currently finalizing our regulatory approval with the Coinbase Developer Platform for unified fiat offramps. This premium feature will be unlocked automatically across all regions once approved.
              </p>
              <div className="px-6 py-3 bg-[var(--pp-secondary)]/10 text-[var(--pp-secondary)] text-[10px] font-bold uppercase tracking-widest rounded-xl border border-[var(--pp-secondary)]/20 relative z-10">
                 Pending Alliance Whitelist
              </div>
           </div>
        </div>
      )}

      {/* Header Section */}
      <div className="md:col-span-12 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4 mb-2">
        <div>
           <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--pp-secondary)]" /> 
             Fiat Liquidation
           </h3>
           <div className="text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-1">Securely route your on-chain revenue directly out to your traditional banking infrastructure.</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <span className="text-[9px] font-bold uppercase tracking-wider px-4 py-2 bg-[var(--pp-secondary)]/10 text-[var(--pp-secondary)] rounded-xl border border-[var(--pp-secondary)]/20 flex items-center gap-2">
             <ShieldCheck className="w-3.5 h-3.5" />
             Secured by Coinbase
           </span>
        </div>
      </div>

      {error && (
        <div className="md:col-span-12 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] uppercase font-bold tracking-wider text-red-500 leading-relaxed flex-1 mt-1">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-red-500/80 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="md:col-span-12 grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        
        {/* Left Column: Info Cards */}
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
           
           <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 flex items-start gap-5 hover:bg-foreground/[0.03] hover:border-foreground/[0.05] transition-all duration-300 shadow-sm h-full">
              <div className="bg-foreground/[0.03] p-4 rounded-2xl shrink-0 border border-foreground/[0.05]">
                 <WalletCards className="w-6 h-6 text-foreground/80" />
              </div>
              <div>
                 <h4 className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-2">Direct Bank Routing</h4>
                 <p className="text-[9px] text-muted-foreground/80 leading-relaxed font-medium">
                   Transfer standard USDC from your connected Treasury directly to your US Bank Account (ACH). Coinbase automatically handles the complex bridge between DeFi and TradFi.
                 </p>
              </div>
           </div>

           <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 flex items-start gap-5 hover:bg-foreground/[0.03] hover:border-foreground/[0.05] transition-all duration-300 shadow-sm h-full">
              <div className="bg-foreground/[0.03] p-4 rounded-2xl shrink-0 border border-foreground/[0.05]">
                 <Clock className="w-6 h-6 text-foreground/80" />
              </div>
              <div>
                 <h4 className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-2">Settlement Timelines</h4>
                 <p className="text-[9px] text-muted-foreground/80 leading-relaxed font-medium">
                   Once the on-chain send finishes, standard ACH timelines apply. Expect funds to clear in your checking account within 1-3 business days.
                 </p>
              </div>
           </div>

           <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 flex items-start gap-5 hover:bg-foreground/[0.03] hover:border-foreground/[0.05] transition-all duration-300 shadow-sm h-full">
              <div className="bg-foreground/[0.03] p-4 rounded-2xl shrink-0 border border-foreground/[0.05]">
                 <ShieldCheck className="w-6 h-6 text-foreground/80" />
              </div>
              <div>
                 <h4 className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-2">Non-Custodial Integrity</h4>
                 <p className="text-[9px] text-muted-foreground/80 leading-relaxed font-medium">
                   PortalPay never custodies your funds. The Offramp integration routes assets securely from your independent wallet to Coinbase's liquidation engine.
                 </p>
              </div>
           </div>

        </div>

        {/* Right Column: Interactive Area */}
        <div className="lg:col-span-3 flex flex-col h-full">
           <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-8 md:p-12 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:bg-foreground/[0.03] hover:border-[var(--pp-secondary)]/30 transition-all duration-500 shadow-sm">
              
              {/* Background Aesthetic */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--pp-secondary)]/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-[var(--pp-secondary)]/10 transition-colors duration-700" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-[var(--pp-secondary)]/20 blur-2xl rounded-full scale-150 transition-transform duration-700 group-hover:scale-[2]" />
                   <div className="h-24 w-24 bg-background rounded-full flex items-center justify-center border-2 border-[var(--pp-secondary)] shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-110">
                      <ArrowRightLeft className="w-10 h-10 text-[var(--pp-secondary)]" />
                   </div>
                </div>

                <h3 className="text-lg md:text-xl uppercase font-bold tracking-[0.2em] text-foreground mb-4">Initiate Liquidation</h3>
                <p className="text-[10px] text-muted-foreground/80 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                   Connecting to Coinbase will redirect you to their secure environment to authorize your bank destination and sign the outbound transaction.
                </p>

                <button
                  onClick={handleInitiate}
                  disabled={isProcessing || !appId || !isEnabled}
                  className="group relative flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-[var(--pp-secondary)] hover:bg-[var(--pp-secondary)]/90 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_var(--pp-secondary)]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                >
                  {isProcessing ? (
                    <>Processing Request...</>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                      Enter Offramp Portal
                    </>
                  )}
                </button>

                {statusText && (
                   <div className="mt-8 px-5 py-3 bg-foreground/[0.03] rounded-xl border border-foreground/[0.05] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                     <p className="text-[9px] font-mono uppercase font-bold tracking-wider text-muted-foreground items-center flex gap-3">
                       <span className="w-2 h-2 rounded-full bg-[var(--pp-secondary)] animate-pulse shadow-[0_0_10px_var(--pp-secondary)]" />
                       {statusText}
                     </p>
                   </div>
                )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
