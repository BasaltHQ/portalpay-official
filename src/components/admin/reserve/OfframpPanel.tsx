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
    <div className="flex flex-col space-y-6 w-full relative min-h-[65vh]">
      
      {/* Coming Soon Overlay */}
      {!isEnabled && (
        <div className="absolute -inset-4 z-50 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center p-6">
           <div className="bg-background/80 p-8 rounded-3xl flex flex-col items-center text-center max-w-lg border border-portal-teal/20 shadow-2xl shadow-portal-teal/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-portal-teal/10 to-transparent pointer-events-none" />
              <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 border border-portal-teal/30 shadow-lg relative z-10">
                 <Lock className="w-8 h-8 text-portal-teal" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight mb-3 relative z-10 text-foreground">Offramp Coming Soon</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 relative z-10">
                 We are currently finalizing our regulatory approval with the Coinbase Developer Platform for unified fiat offramps. This premium feature will be unlocked automatically across all regions once approved.
              </p>
              <div className="px-5 py-2.5 bg-portal-teal/10 text-portal-teal text-xs font-bold uppercase tracking-widest rounded-full border border-portal-teal/20 relative z-10">
                 Pending Alliance Whitelist
              </div>
           </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-foreground/10">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
             <Building2 className="w-6 h-6 text-portal-teal" />
             Fiat Liquidation
           </h2>
           <p className="text-sm text-muted-foreground">Securely route your on-chain revenue directly out to your traditional banking infrastructure.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <span className="text-xs font-medium px-3 py-1 bg-portal-teal/10 text-portal-teal rounded-full border border-portal-teal/20 flex items-center gap-1.5">
             <ShieldCheck className="w-3.5 h-3.5" />
             Secured by Coinbase
           </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-500 font-medium leading-relaxed flex-1">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-red-500/80 hover:text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20 p-1 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Info Cards */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
           
           <div className="glass-pane p-5 rounded-2xl border border-foreground/10 flex items-start gap-4 hover:border-portal-teal/30 transition-colors duration-300">
              <div className="bg-foreground/5 p-3 rounded-xl shrink-0">
                 <WalletCards className="w-6 h-6 text-foreground" />
              </div>
              <div>
                 <h4 className="font-semibold text-sm mb-1">Direct Bank Routing</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   Transfer standard USDC from your connected Treasury directly to your US Bank Account (ACH). Coinbase automatically handles the complex bridge between DeFi and TradFi.
                 </p>
              </div>
           </div>

           <div className="glass-pane p-5 rounded-2xl border border-foreground/10 flex items-start gap-4 hover:border-portal-teal/30 transition-colors duration-300">
              <div className="bg-foreground/5 p-3 rounded-xl shrink-0">
                 <Clock className="w-6 h-6 text-foreground" />
              </div>
              <div>
                 <h4 className="font-semibold text-sm mb-1">Settlement Timelines</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   Once the on-chain send finishes, standard ACH timelines apply. Expect funds to clear in your checking account within 1-3 business days.
                 </p>
              </div>
           </div>

           <div className="glass-pane p-5 rounded-2xl border border-foreground/10 flex items-start gap-4 hover:border-portal-teal/30 transition-colors duration-300">
              <div className="bg-foreground/5 p-3 rounded-xl shrink-0">
                 <ShieldCheck className="w-6 h-6 text-foreground" />
              </div>
              <div>
                 <h4 className="font-semibold text-sm mb-1">Non-Custodial Integrity</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   PortalPay never custodies your funds. The Offramp integration routes assets securely from your independent wallet to Coinbase's liquidation engine.
                 </p>
              </div>
           </div>

        </div>

        {/* Right Column: Interactive Area */}
        <div className="lg:col-span-3 flex flex-col h-full">
           <div className="glass-pane rounded-2xl border border-foreground/10 p-8 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-portal-teal/50 transition-all duration-500">
              
              {/* Background Aesthetic */}
              <div className="absolute inset-0 bg-gradient-to-br from-portal-teal/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-0 flex flex-col items-center">
                <div className="relative mb-6">
                   <div className="absolute inset-0 bg-portal-teal/20 blur-xl rounded-full scale-150" />
                   <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center border-2 border-portal-teal shadow-xl relative z-0">
                      <ArrowRightLeft className="w-10 h-10 text-portal-teal" />
                   </div>
                </div>

                <h3 className="font-bold text-xl text-foreground mb-3">Initiate Liquidation</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
                   Connecting to Coinbase will redirect you to their secure environment to authorize your bank destination and sign the outbound transaction.
                </p>

                <button
                  onClick={handleInitiate}
                  disabled={isProcessing || !appId || !isEnabled}
                  className="group relative flex items-center gap-3 px-8 py-4 bg-foreground hover:bg-foreground/90 text-background rounded-full font-semibold text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <>Processing Request...</>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 group-hover:text-portal-teal transition-colors" />
                      Enter Offramp Portal
                    </>
                  )}
                </button>

                {statusText && (
                   <div className="mt-6 px-4 py-2 bg-foreground/5 rounded-lg border border-foreground/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                     <p className="text-xs font-mono text-muted-foreground items-center flex gap-2">
                       <span className="w-2 h-2 rounded-full bg-portal-teal animate-pulse" />
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
