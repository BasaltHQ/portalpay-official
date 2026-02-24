import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LandingPageSkeleton() {
    return (
        <div className="min-h-screen">
            {/* Hero Header Area */}
            <div className="w-full h-[60px] md:h-[80px] bg-black/20 backdrop-blur-md mb-6" />

            <div className="max-w-6xl mx-auto p-6 md:p-8 relative z-10 w-full animate-in fade-in duration-500">

                {/* Main Value Prop Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
                    {/* Left: Messaging */}
                    <div className="glass-pane rounded-2xl border p-8 lg:p-10 flex flex-col space-y-6">
                        <Skeleton className="h-16 w-3/4 max-w-[340px] rounded-xl" />
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-5/6" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-4/5" />
                        </div>

                        {/* 4 Feature Points */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                            <Skeleton className="h-[72px] rounded-md" />
                            <Skeleton className="h-[72px] rounded-md" />
                            <Skeleton className="h-[72px] rounded-md" />
                            <Skeleton className="h-[72px] rounded-md" />
                        </div>

                        <div className="mt-8">
                            <Skeleton className="h-14 w-40 rounded-md" />
                        </div>
                    </div>

                    {/* Right: Portal Preview */}
                    <div className="glass-pane rounded-2xl border p-4 md:p-5 flex flex-col">
                        <Skeleton className="h-5 w-40 mb-3" />
                        <Skeleton className="flex-1 w-full max-w-[428px] mx-auto rounded-[32px] min-h-[500px]" />
                        <Skeleton className="h-4 w-3/4 mx-auto mt-4" />
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="mt-6">
                    <div className="glass-pane rounded-xl border p-4 md:p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="rounded-md border p-3 bg-background/60">
                                    <Skeleton className="h-3 w-1/2 mb-2" />
                                    <Skeleton className="h-6 w-3/4" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* What We Do Cards */}
                <section className="mt-8">
                    <div className="glass-pane rounded-xl border p-6">
                        <Skeleton className="h-7 w-48 mb-6" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="rounded-md border p-4 bg-background/60 space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
