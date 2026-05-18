"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { Loader2, Lock, BookOpen } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the reader to avoid SSR issues with PDF.js
const OsirisReader = dynamic(() => import("@/components/reader/OsirisReader"), {
    ssr: false,
    loading: () => (
        <div className="h-screen w-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
    ),
});

/**
 * Book Reader Page
 * - Validates ownership via receipt (for purchased books)
 * - For preview mode, author must be logged in with their wallet
 * - Loads the OsirisReader with the book content
 */

function ReaderPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const account = useActiveAccount();
    const itemId = params.itemId as string;
    const receiptId = searchParams.get("receiptId");
    const isPreview = searchParams.get("preview") === "true";

    // Direct preview params (for unsaved/in-editor previews)
    const directPdfUrl = searchParams.get("pdfUrl");
    const directTitle = searchParams.get("title");
    const directAuthor = searchParams.get("author");
    const directCover = searchParams.get("cover");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [bookData, setBookData] = useState<{
        pdfUrl: string;
        title: string;
        author?: string;
        coverUrl?: string;
    } | null>(null);

    useEffect(() => {
        if (isPreview) {
            // Check if we have direct PDF URL params (for unsaved manuscripts)
            if (directPdfUrl) {
                setBookData({
                    pdfUrl: directPdfUrl,
                    title: directTitle || "Untitled Preview",
                    author: directAuthor || undefined,
                    coverUrl: directCover || undefined,
                });
                setLoading(false);
                return;
            }

            // Otherwise, try to load from inventory (for saved books)
            if (!account?.address) {
                setError("Please connect your wallet to preview your book.");
                setLoading(false);
                return;
            }
            loadPreviewBook();
        } else {
            authorizeAndLoad();
        }
    }, [itemId, receiptId, isPreview, account?.address, directPdfUrl]);

    async function loadPreviewBook() {
        try {
            setLoading(true);
            setError("");

            // For preview, fetch the author's inventory with their wallet
            const r = await fetch(`/api/inventory`, {
                cache: "no-store",
                headers: {
                    "x-wallet": account?.address || "",
                }
            });

            if (!r.ok) throw new Error("Failed to fetch inventory");

            const j = await r.json();
            const items = j.items || [];

            // Find the specific item by ID
            const item = items.find((it: any) => it.id === itemId);

            if (!item) throw new Error("Book not found in your inventory. Make sure you're logged in with the correct wallet.");
            if (!item.bookFileUrl) throw new Error("No manuscript file uploaded yet. Upload a PDF in Writer's Workshop first.");

            setBookData({
                pdfUrl: item.bookFileUrl,
                title: item.name || item.contentDetails?.title || "Untitled",
                author: item.contentDetails?.author || item.contentDetails?.authorFirstName && item.contentDetails?.authorLastName
                    ? `${item.contentDetails.authorFirstName} ${item.contentDetails.authorLastName}`
                    : undefined,
                coverUrl: item.bookCoverUrl || item.thumb,
            });
        } catch (e: any) {
            setError(e.message || "Failed to load preview");
        } finally {
            setLoading(false);
        }
    }

    async function authorizeAndLoad() {
        if (!receiptId) {
            setError("Authorization required: No receipt provided.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Verify purchase ownership
            const r = await fetch("/api/orders/me", { cache: "no-store" });
            if (!r.ok) throw new Error("Failed to verify purchase");

            const j = await r.json();
            const items = j.items || [];
            const receipt = items.find((x: any) => x.receiptId === receiptId);

            if (!receipt) {
                throw new Error("Receipt not found in your account.");
            }

            // Find the book in the receipt
            const lineItem = receipt.lineItems?.find(
                (x: any) => x.itemId === itemId || x.sku === itemId
            );

            if (!lineItem) {
                throw new Error("Book not found in this receipt.");
            }

            if (!lineItem.bookFileUrl) {
                throw new Error("Book file not available. It may be a physical item or pre-order.");
            }

            setBookData({
                pdfUrl: lineItem.bookFileUrl,
                title: lineItem.label || "Untitled Book",
                author: lineItem.author,
                coverUrl: lineItem.bookCoverUrl || lineItem.thumb,
            });
        } catch (e: any) {
            setError(e.message || "Access denied.");
        } finally {
            setLoading(false);
        }
    }

    // Prevent right-click (basic copy protection)
    useEffect(() => {
        const handleContext = (e: MouseEvent) => e.preventDefault();
        document.addEventListener("contextmenu", handleContext);
        return () => document.removeEventListener("contextmenu", handleContext);
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex flex-col items-center justify-center text-white overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">
                    {/* Animated Book Icon */}
                    <div className="relative mb-8">
                        <div className="w-24 h-32 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-2xl shadow-purple-500/30 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white/80" />
                        </div>
                        {/* Glow Ring */}
                        <div className="absolute inset-0 -m-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-20 blur-xl animate-pulse" />
                    </div>

                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-4" />
                    <p className="text-sm text-zinc-400 font-mono tracking-widest uppercase animate-pulse">
                        {isPreview ? "Loading Preview..." : "Authenticating Neural Link..."}
                    </p>
                </div>
            </div>
        );
    }

    // Special case: Preview mode requires wallet ONLY if no direct PDF URL provided
    if (isPreview && !directPdfUrl && !account?.address && !loading) {
        // Need to dynamically import client to avoid SSR issues
        const ConnectWalletScreen = dynamic(
            () => import("@/lib/thirdweb/client").then((mod) => {
                const { client } = mod;
                return {
                    default: function ConnectWalletInner() {
                        return (
                            <div className="h-screen w-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex flex-col items-center justify-center text-white">
                                {/* Wallet Icon */}
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                        <BookOpen className="w-10 h-10 text-indigo-400" />
                                    </div>
                                    <div className="absolute inset-0 -m-4 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
                                </div>

                                <h1 className="text-2xl font-bold text-indigo-400 mb-2">Connect Wallet to Preview</h1>
                                <p className="text-sm text-zinc-500 max-w-md text-center mb-8 px-4">
                                    Connect your wallet to preview your manuscript. Use the same wallet you use in Writer's Workshop.
                                </p>

                                <div className="flex flex-col gap-4 items-center">
                                    <ConnectButton
                                        client={client}
                                        connectButton={{
                                            label: "Connect Wallet",
                                            className: "!px-8 !py-3 !rounded-xl !font-bold !text-base"
                                        }}
                                        connectModal={{ size: "compact", showThirdwebBranding: false }}
                                    />
                                    <button
                                        onClick={() => window.close()}
                                        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        Close Window
                                    </button>
                                </div>
                            </div>
                        );
                    }
                };
            }),
            { ssr: false, loading: () => <div className="h-screen w-screen bg-black" /> }
        );
        return <ConnectWalletScreen />;
    }

    if (error) {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex flex-col items-center justify-center text-white">
                {/* Error Icon */}
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                    <div className="absolute inset-0 -m-4 rounded-full bg-red-500/10 blur-xl animate-pulse" />
                </div>

                <h1 className="text-2xl font-bold text-red-400 mb-2">Access Restricted</h1>
                <p className="text-sm text-zinc-500 max-w-md text-center mb-8 px-4">{error}</p>

                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.href = "/"}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all"
                    >
                        Go Home
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    if (!bookData) {
        return null;
    }

    return (
        <OsirisReader
            pdfUrl={bookData.pdfUrl}
            title={bookData.title}
            author={bookData.author}
            coverUrl={bookData.coverUrl}
            mode={isPreview ? "preview" : "full"}
            onClose={() => window.close()}
            bookId={itemId}
        />
    );
}

export default function BookReaderPage() {
    return (
        <Suspense
            fallback={
                <div className="h-screen w-screen bg-black flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                </div>
            }
        >
            <ReaderPageContent />
        </Suspense>
    );
}
