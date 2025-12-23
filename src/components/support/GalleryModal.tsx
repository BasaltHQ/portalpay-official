"use client";

import React, { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, Grid3X3 } from "lucide-react";
import { createPortal } from "react-dom";

interface GalleryImage {
    url: string;
    name?: string;
    createdAt?: number;
}

interface GalleryModalProps {
    wallet: string;
    onClose: () => void;
}

export function GalleryModal({ wallet, onClose }: GalleryModalProps) {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [showThumbnails, setShowThumbnails] = useState(false);

    useEffect(() => {
        loadGallery();
    }, [wallet]);

    async function loadGallery() {
        setLoading(true);
        setError("");
        try {
            const ticketsRes = await fetch(`/api/admin/support/tickets`);
            const ticketsData = await ticketsRes.json();
            if (ticketsData.ok) {
                const userTickets = (ticketsData.tickets || []).filter((t: any) => t.user === wallet);
                const allImages: GalleryImage[] = [];
                userTickets.forEach((t: any) => {
                    (t.attachments || []).forEach((url: string) => {
                        allImages.push({ url, name: t.subject, createdAt: t.createdAt });
                    });
                    (t.responses || []).forEach((r: any) => {
                        (r.attachments || []).forEach((url: string) => {
                            allImages.push({ url, name: t.subject, createdAt: r.createdAt });
                        });
                    });
                });
                allImages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setImages(allImages);
            } else {
                setError("Failed to load tickets");
            }
        } catch (e: any) {
            setError(e?.message || "Failed to load gallery");
        } finally {
            setLoading(false);
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft" && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
        if (e.key === "ArrowRight" && selectedIndex < images.length - 1) setSelectedIndex(selectedIndex + 1);
        if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.25, 4));
        if (e.key === "-") setZoom(z => Math.max(z - 0.25, 0.25));
    };

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, images.length]);

    useEffect(() => {
        setZoom(1);
    }, [selectedIndex]);

    const selectedImage = images[selectedIndex];

    // Touch/swipe support for mobile
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const diff = e.changedTouches[0].clientX - touchStart;
        if (diff > 50 && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
        if (diff < -50 && selectedIndex < images.length - 1) setSelectedIndex(selectedIndex + 1);
        setTouchStart(null);
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl w-full h-full sm:max-w-5xl sm:max-h-[90vh] sm:mx-4 flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header - Premium glass effect */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm sm:text-base">Support Gallery</h3>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                {images.length} attachments from support tickets
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Mobile thumbnail toggle */}
                        <button
                            onClick={() => setShowThumbnails(!showThumbnails)}
                            className="sm:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex overflow-hidden relative">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                            <p className="text-sm">Loading gallery...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-2 p-4">
                            <ImageIcon className="w-12 h-12 opacity-50" />
                            <p className="text-sm text-center">{error}</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-4">
                            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-sm text-center">No images found for this merchant</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Thumbnail sidebar - hidden on mobile unless toggled */}
                            <div className={`${showThumbnails ? 'absolute inset-0 z-10 bg-background/95' : 'hidden'} sm:relative sm:block sm:w-24 lg:w-28 border-r border-white/10 overflow-y-auto p-2 space-y-2 bg-muted/10 shrink-0`}>
                                {showThumbnails && (
                                    <div className="flex items-center justify-between mb-3 sm:hidden">
                                        <span className="text-sm font-medium">All Images</span>
                                        <button onClick={() => setShowThumbnails(false)} className="p-1 hover:bg-muted rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <div className={`${showThumbnails ? 'grid grid-cols-3 gap-2' : ''} sm:block sm:space-y-2`}>
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setSelectedIndex(i); setShowThumbnails(false); }}
                                            className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === selectedIndex
                                                ? 'border-primary ring-2 ring-primary/30 scale-95'
                                                : 'border-transparent hover:border-white/30'
                                                }`}
                                        >
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Main image view */}
                            <div
                                className="flex-1 flex flex-col"
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                            >
                                {/* Image container */}
                                <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-muted/5 to-muted/20 flex items-center justify-center p-2 sm:p-4">
                                    {/* Navigation arrows - larger touch targets on mobile */}
                                    {selectedIndex > 0 && (
                                        <button
                                            onClick={() => setSelectedIndex(selectedIndex - 1)}
                                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 sm:p-2 bg-background/80 backdrop-blur-sm border border-white/20 rounded-full hover:bg-background transition-all shadow-xl active:scale-95"
                                        >
                                            <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
                                        </button>
                                    )}
                                    {selectedIndex < images.length - 1 && (
                                        <button
                                            onClick={() => setSelectedIndex(selectedIndex + 1)}
                                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 sm:p-2 bg-background/80 backdrop-blur-sm border border-white/20 rounded-full hover:bg-background transition-all shadow-xl active:scale-95"
                                        >
                                            <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
                                        </button>
                                    )}

                                    {/* Image with zoom */}
                                    <div className="w-full h-full flex items-center justify-center overflow-auto">
                                        <img
                                            src={selectedImage?.url}
                                            alt=""
                                            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                            onClick={() => setZoom(z => z < 2 ? z + 0.5 : 1)}
                                            draggable={false}
                                        />
                                    </div>

                                    {/* Image caption overlay */}
                                    {selectedImage?.name && (
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full text-xs sm:text-sm text-muted-foreground border border-white/10 shadow-lg max-w-[90%] truncate">
                                            {selectedImage.name}
                                        </div>
                                    )}
                                </div>

                                {/* Controls bar - premium design */}
                                <div className="p-3 sm:p-4 border-t border-white/10 bg-gradient-to-t from-muted/10 to-transparent">
                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                        {/* Zoom controls */}
                                        <div className="flex items-center gap-1 bg-muted/30 rounded-full p-1">
                                            <button
                                                onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))}
                                                disabled={zoom <= 0.25}
                                                className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                                                title="Zoom out"
                                            >
                                                <ZoomOut className="w-4 h-4" />
                                            </button>
                                            <div className="px-3 py-1 text-xs sm:text-sm font-mono min-w-[50px] sm:min-w-[60px] text-center">
                                                {Math.round(zoom * 100)}%
                                            </div>
                                            <button
                                                onClick={() => setZoom(z => Math.min(z + 0.25, 4))}
                                                disabled={zoom >= 4}
                                                className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                                                title="Zoom in"
                                            >
                                                <ZoomIn className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setZoom(1)}
                                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                                title="Reset zoom"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Pagination indicator */}
                                        <div className="flex items-center gap-1.5 ml-4">
                                            {images.length <= 10 ? (
                                                images.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedIndex(i)}
                                                        className={`w-2 h-2 rounded-full transition-all ${i === selectedIndex
                                                            ? 'bg-primary w-4'
                                                            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                                            }`}
                                                    />
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    {selectedIndex + 1} / {images.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
