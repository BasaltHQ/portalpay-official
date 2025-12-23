"use client";

import React, { useState, useMemo } from "react";
import { Search, Grid, List, Library, BookOpen, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Bookshelf View
 * - Displays purchased books in a futuristic cyberpunk interface
 * - Supports Grid, List, and Shelf layouts
 * - Filters for "My Books" from purchase history
 */

export interface BookEntry {
    receiptId: string;
    purchaseDate: number;
    item: {
        label: string;
        itemId?: string;
        sku?: string;
        thumb?: string;
        bookCoverUrl?: string;
        bookFileUrl?: string;
        isBook: boolean;
        releaseDate?: number;
        previewUrl?: string; // For pre-orders
    };
}

interface BookshelfViewProps {
    books: BookEntry[];
}

type LayoutMode = "shelf" | "grid" | "list";

export default function BookshelfView({ books }: BookshelfViewProps) {
    const [layout, setLayout] = useState<LayoutMode>("shelf");
    const [search, setSearch] = useState("");

    const filteredBooks = useMemo(() => {
        let b = books;
        if (search.trim()) {
            const q = search.toLowerCase();
            b = b.filter((x) => x.item.label.toLowerCase().includes(q));
        }
        return b.sort((a, b) => b.purchaseDate - a.purchaseDate);
    }, [books, search]);

    const openReader = (book: BookEntry) => {
        if (book.item.releaseDate && book.item.releaseDate > Date.now()) {
            // Pre-order logic: maybe show preview?
            alert(`This title will be released on ${new Date(book.item.releaseDate).toLocaleDateString()}`);
            return;
        }
        // Open reader in new window
        // We pass the receiptId and itemId (or sku) so the reader can verify ownership/fetch the file
        // Alternatively, if we trust the URL in the receipt (which we might for this demo), pass it.
        // Ideally, we open /reader/[itemId]?receiptId=...
        const url = `/reader/${encodeURIComponent(book.item.itemId || "")}?receiptId=${encodeURIComponent(book.receiptId)}`;
        window.open(url, "PortalReader", "width=1200,height=900,menubar=no,toolbar=no,location=no,status=no");
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search your library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 ring-primary/20 transition-all font-mono text-sm"
                    />
                </div>

                <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border">
                    <button
                        onClick={() => setLayout("shelf")}
                        className={`p-2 rounded-md transition-all ${layout === "shelf" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-foreground/10 text-muted-foreground"}`}
                        title="Shelf View"
                    >
                        <Library className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setLayout("grid")}
                        className={`p-2 rounded-md transition-all ${layout === "grid" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-foreground/10 text-muted-foreground"}`}
                        title="Grid View"
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setLayout("list")}
                        className={`p-2 rounded-md transition-all ${layout === "list" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-foreground/10 text-muted-foreground"}`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-[400px] rounded-xl border bg-gradient-to-br from-background via-background to-foreground/5 p-6 overflow-y-auto custom-scrollbar">
                {filteredBooks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                        <BookOpen className="w-16 h-16 mb-4 stroke-1" />
                        <p className="text-lg font-light">Your bookshelf is empty</p>
                        <p className="text-sm">Purchased books will appear here</p>
                    </div>
                ) : (
                    <div className={`
            ${layout === "shelf" ? "flex flex-wrap gap-x-8 gap-y-12 items-end justify-start px-4" : ""}
            ${layout === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" : ""}
            ${layout === "list" ? "flex flex-col gap-3" : ""}
          `}>
                        <AnimatePresence mode="popLayout">
                            {filteredBooks.map((book, i) => {
                                const isPreorder = book.item.releaseDate && book.item.releaseDate > Date.now();
                                const cover = book.item.bookCoverUrl || book.item.thumb || "/placeholder-book.jpg";

                                return (
                                    <motion.div
                                        key={`${book.receiptId}-${book.item.itemId}-${i}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className={`group relative cursor-pointer
                      ${layout === "shelf" ? "w-32 md:w-40 perspective-1000" : ""}
                      ${layout === "grid" ? "aspect-[2/3] w-full" : ""}
                      ${layout === "list" ? "w-full flex items-center gap-4 p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors" : ""}
                    `}
                                        onClick={() => openReader(book)}
                                    >
                                        {/* Shelf/Grid Item Card */}
                                        {layout !== "list" && (
                                            <div className={`relative w-full aspect-[2/3] rounded-sm shadow-xl transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-2
                        ${layout === "shelf" ? "origin-bottom transform-gpu rotate-y-12 group-hover:rotate-y-0" : ""}
                      `}>
                                                {/* Book Spine Effect for Shelf Mode */}
                                                {layout === "shelf" && (
                                                    <div className="absolute left-0 top-1 bottom-1 w-3 bg-white/10 blur-[1px] z-10 border-r border-white/20 rounded-l-sm" />
                                                )}

                                                <img
                                                    src={cover}
                                                    alt={book.item.label}
                                                    className="w-full h-full object-contain rounded-sm border border-white/10 shadow-2xl bg-black/80"
                                                />

                                                {/* Status Overlays */}
                                                {isPreorder && (
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-2 backdrop-blur-[1px]">
                                                        <Clock className="w-8 h-8 text-amber-500 mb-1" />
                                                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pre-Order</span>
                                                        <span className="text-[10px] text-white/80 mt-1">{new Date(book.item.releaseDate!).toLocaleDateString()}</span>
                                                    </div>
                                                )}

                                                {/* Hover Specs */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                    <h4 className="text-white text-sm font-bold leading-tight line-clamp-2">{book.item.label}</h4>
                                                    <span className="text-[10px] text-white/60 mt-1 uppercase tracking-wider">
                                                        {isPreorder ? "Coming Soon" : "Read Now"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Shelf Base Graphic */}
                                        {layout === "shelf" && (
                                            <div className="absolute -bottom-4 left-[-10%] right-[-10%] h-4 bg-gradient-to-b from-white/10 to-transparent blur-sm rounded-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
                                        )}

                                        {/* List View */}
                                        {layout === "list" && (
                                            <>
                                                <div className="h-16 w-12 shrink-0 rounded overflow-hidden relative shadow-md">
                                                    <img src={cover} alt={book.item.label} className="w-full h-full object-contain bg-black/80" />
                                                    {isPreorder && <div className="absolute inset-0 bg-black/50 grid place-items-center"><Clock className="w-4 h-4 text-white" /></div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate">{book.item.label}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <span>Purchased {new Date(book.purchaseDate).toLocaleDateString()}</span>
                                                        {isPreorder && <span className="text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Releases {new Date(book.item.releaseDate!).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {isPreorder ? (
                                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs">Pre-Order</span>
                                                    ) : (
                                                        <button className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:shadow-lg hover:shadow-primary/20 transition-all">
                                                            Read
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Shelf Graphic (The actual shelf line under the books) */}
                        {layout === "shelf" && (
                            <div className="w-full h-0 basis-full border-b-[8px] border-foreground/10 shadow-[0_4px_10px_rgba(0,0,0,0.5)] transform translate-y-2 mt-[-10px] z-0 rounded-sm mb-12" />
                        )}
                    </div>
                )}
            </div>

            {/* Footer / Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <div>{filteredBooks.length} Titles</div>
                <div className="flex items-center gap-4">
                    <span>PDF / EPUB</span>
                    <span>Cloud Sync</span>
                </div>
            </div>
        </div>
    );
}
