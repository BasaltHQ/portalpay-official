
import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Trophy, Check, Loader2, X } from "lucide-react";

export function LoyaltyProgramStatus() {
    const account = useActiveAccount();
    const [status, setStatus] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        if (!account?.address) return;
        setLoading(true);
        fetch("/api/shop/config", { headers: { "x-wallet": account.address } })
            .then(r => r.json())
            .then(d => {
                setStatus(d?.config?.loyalty?.platformOptIn || false);
            })
            .catch(() => setStatus(false))
            .finally(() => setLoading(false));
    }, [account?.address]);

    const toggle = async () => {
        if (toggling) return;
        setToggling(true);
        const newState = !status;

        try {
            // We need to preserve other config, but for this component we blindly patch 
            // In a real app we'd fetch-merge-save or use a PATCH endpoint
            // For now assuming the backend handles merge or we just send this field if supported, 
            // but standard pattern here is full object. 
            // To be safe, I'll just simulate the UI update since I can't easily merge without refetching everything.
            // Wait, the previous save function fetched `xpPerDollar` etc.
            // I'll make a simplified 'patch' call if possible, or just re-save the config structure.
            // Since I don't want to duplicate the whole config state here, I will assume a specialized endpoint or just mock the persistence for the UI feedback.

            // let's fetch first to be safe
            const r1 = await fetch("/api/shop/config", { headers: { "x-wallet": account?.address || "" } });
            const d1 = await r1.json();
            const currentConfig = d1.config || {};
            const currentLoyalty = currentConfig.loyalty || {};

            const body = {
                ...currentConfig,
                loyalty: {
                    ...currentLoyalty,
                    platformOptIn: newState
                }
            };

            await fetch("/api/shop/config", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-wallet": account?.address || "" },
                body: JSON.stringify(body)
            });

            setStatus(newState);
        } catch (e) {
            console.error(e);
        } finally {
            setToggling(false);
        }
    };

    if (loading) return <div className="h-10 w-32 bg-muted/20 animate-pulse rounded-full" />;

    return (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${status ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 border-transparent'}`}>
            <div className={`p-1 rounded-full ${status ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                {status ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform Program</span>
                <span className={`text-sm font-bold ${status ? 'text-primary' : 'text-muted-foreground'}`}>
                    {status ? 'Active' : 'Not Participating'}
                </span>
            </div>
            <button
                onClick={toggle}
                disabled={toggling}
                className="ml-2 text-xs font-medium underline text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
                {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : (status ? 'Opt-out' : 'Opt-in')}
            </button>
        </div>
    );
}
