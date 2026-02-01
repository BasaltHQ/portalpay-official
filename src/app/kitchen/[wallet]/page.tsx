"use client";

import { KitchenInterface } from "@/components/kitchen/KitchenInterface";
import { useParams } from "next/navigation";

export default function KitchenPage() {
    const params = useParams();
    const wallet = typeof params?.wallet === "string" ? params.wallet : undefined;

    return <KitchenInterface wallet={wallet} />;
}
