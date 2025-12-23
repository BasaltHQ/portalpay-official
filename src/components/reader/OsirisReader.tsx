"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
    ChevronLeft, ChevronRight, X, Menu, Bookmark, BookmarkCheck,
    Sun, Moon, Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2,
    List, Search, Settings, Download, Share2, Volume2, VolumeX,
    RotateCcw, Home, Eye, EyeOff, Palette, Type, Minus, Plus
} from "lucide-react";

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./osiris-reader.css";

// ============ TYPES ============

export interface OsirisReaderProps {
    pdfUrl: string;
    title?: string;
    author?: string;
    coverUrl?: string;
    mode?: "preview" | "full"; // preview = author preview, full = purchased
    onClose?: () => void;
    initialPage?: number;
    bookId?: string; // For saving progress
}

interface Bookmark {
    page: number;
    note?: string;
    createdAt: number;
}

type ThemeMode = "dark" | "light" | "sepia" | "midnight";
type ViewMode = "single" | "double" | "scroll";

// ============ CONSTANTS ============

const THEMES: Record<ThemeMode, { bg: string; text: string; accent: string; paper: string }> = {
    dark: { bg: "bg-zinc-950", text: "text-zinc-100", accent: "text-cyan-400", paper: "bg-zinc-900" },
    light: { bg: "bg-stone-100", text: "text-stone-900", accent: "text-indigo-600", paper: "bg-white" },
    sepia: { bg: "bg-amber-50", text: "text-amber-950", accent: "text-amber-700", paper: "bg-amber-100/50" },
    midnight: { bg: "bg-slate-950", text: "text-slate-200", accent: "text-violet-400", paper: "bg-slate-900" },
};

const FONT_SIZES = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5];

// ============ MAIN COMPONENT ============

export default function OsirisReader({
    pdfUrl,
    title = "Untitled",
    author,
    coverUrl,
    mode = "full",
    onClose,
    initialPage = 1,
    bookId,
}: OsirisReaderProps) {
    // ===== State =====
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [theme, setTheme] = useState<ThemeMode>("dark");
    const [viewMode, setViewMode] = useState<ViewMode>("single");
    const [zoom, setZoom] = useState(1.0);
    const [fontSizeIndex, setFontSizeIndex] = useState(2);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showUI, setShowUI] = useState(true);
    const [showTOC, setShowTOC] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Animation & Display
    const [pageFlipEnabled, setPageFlipEnabled] = useState(true);
    const [invertColors, setInvertColors] = useState(false);
    const [flipDirection, setFlipDirection] = useState<"left" | "right" | null>(null);

    // Bookmarks
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [showBookmarks, setShowBookmarks] = useState(false);

    // Reading Progress
    const [readingProgress, setReadingProgress] = useState(0);

    // Touch/Gesture
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const pageContainerRef = useRef<HTMLDivElement>(null);
    const hideUITimer = useRef<NodeJS.Timeout | null>(null);

    // Motion values for page flip
    const dragX = useMotionValue(0);
    const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);

    // ===== Effects =====

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Load saved progress and bookmarks
    useEffect(() => {
        if (!bookId) return;
        try {
            const saved = localStorage.getItem(`osiris-reader:${bookId}`);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.page) setCurrentPage(data.page);
                if (data.bookmarks) setBookmarks(data.bookmarks);
                if (data.theme) setTheme(data.theme);
                if (data.zoom) setZoom(data.zoom);
            }
        } catch { }
    }, [bookId]);

    // Save progress
    useEffect(() => {
        if (!bookId || !numPages) return;
        const data = { page: currentPage, bookmarks, theme, zoom };
        localStorage.setItem(`osiris-reader:${bookId}`, JSON.stringify(data));
    }, [currentPage, bookmarks, theme, zoom, bookId, numPages]);

    // Calculate reading progress
    useEffect(() => {
        if (numPages > 0) {
            setReadingProgress((currentPage / numPages) * 100);
        }
    }, [currentPage, numPages]);

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " ") nextPage();
            if (e.key === "ArrowLeft") prevPage();
            if (e.key === "Escape") setShowUI(true);
            if (e.key === "f") toggleFullscreen();
            if (e.key === "b") toggleBookmark();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [currentPage, numPages]);

    // Auto-hide UI
    useEffect(() => {
        if (showUI && !showSettings && !showTOC && !showBookmarks) {
            hideUITimer.current = setTimeout(() => setShowUI(false), 4000);
        }
        return () => {
            if (hideUITimer.current) clearTimeout(hideUITimer.current);
        };
    }, [showUI, showSettings, showTOC, showBookmarks]);

    // ===== Handlers =====

    function onDocumentLoad({ numPages }: { numPages: number }) {
        console.log("[OsirisReader] PDF loaded successfully, pages:", numPages);
        setNumPages(numPages);
        setLoading(false);
    }

    function onDocumentError(err: Error) {
        console.error("[OsirisReader] Failed to load PDF:", pdfUrl);
        console.error("[OsirisReader] Error details:", err.message, err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
    }

    // Determine the actual URL to use (proxy external URLs to bypass CORS)
    const effectivePdfUrl = useMemo(() => {
        if (!pdfUrl) return "";

        // If it's already a relative URL or blob URL, use as-is
        if (pdfUrl.startsWith("/") || pdfUrl.startsWith("blob:")) {
            return pdfUrl;
        }

        // If it's an external URL, proxy it
        try {
            const url = new URL(pdfUrl);
            // Check if it's an Azure/external URL that needs proxying
            if (url.hostname.includes("azure") ||
                url.hostname.includes("blob.core") ||
                url.hostname.includes("azurefd.net")) {
                console.log("[OsirisReader] Using proxy for external URL");
                return `/api/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
            }
        } catch {
            // Invalid URL, just use as-is
        }

        return pdfUrl;
    }, [pdfUrl]);

    // Log PDF URL on mount for debugging
    useEffect(() => {
        console.log("[OsirisReader] Original PDF URL:", pdfUrl);
        console.log("[OsirisReader] Effective URL (after proxy):", effectivePdfUrl);
        if (!pdfUrl) {
            console.error("[OsirisReader] No PDF URL provided!");
            setError("No PDF URL provided");
            setLoading(false);
        }
    }, [pdfUrl, effectivePdfUrl]);

    function nextPage() {
        if (currentPage < numPages) {
            if (pageFlipEnabled) setFlipDirection("right");
            setCurrentPage(p => Math.min(p + (viewMode === "double" ? 2 : 1), numPages));
            setTimeout(() => setFlipDirection(null), 500);
        }
    }

    function prevPage() {
        if (currentPage > 1) {
            if (pageFlipEnabled) setFlipDirection("left");
            setCurrentPage(p => Math.max(p - (viewMode === "double" ? 2 : 1), 1));
            setTimeout(() => setFlipDirection(null), 500);
        }
    }

    function goToPage(page: number) {
        setCurrentPage(Math.max(1, Math.min(page, numPages)));
        setShowTOC(false);
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }

    function toggleBookmark() {
        const exists = bookmarks.find(b => b.page === currentPage);
        if (exists) {
            setBookmarks(prev => prev.filter(b => b.page !== currentPage));
        } else {
            setBookmarks(prev => [...prev, { page: currentPage, createdAt: Date.now() }]);
        }
    }

    const isCurrentPageBookmarked = bookmarks.some(b => b.page === currentPage);

    function handleDragEnd(_: any, info: PanInfo) {
        const threshold = 100;
        if (info.offset.x < -threshold) nextPage();
        else if (info.offset.x > threshold) prevPage();
    }

    function handleTap() {
        setShowUI(prev => !prev);
    }

    // ===== Computed =====

    const themeStyles = THEMES[theme];
    const pageWidth = useMemo(() => {
        if (isMobile) return Math.min(window.innerWidth - 32, 400) * zoom;
        return 600 * zoom;
    }, [isMobile, zoom]);

    // ===== Render =====

    if (error) {
        return (
            <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center text-white">
                <div className="text-6xl mb-6 opacity-30">📖</div>
                <h1 className="text-2xl font-bold mb-2">Unable to Load</h1>
                <p className="text-zinc-400 mb-6">{error}</p>
                <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                    Close
                </button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`fixed inset-0 z-[99999] ${themeStyles.bg} ${themeStyles.text} transition-colors duration-500 overflow-hidden select-none`}
            style={{ fontFamily: "'Crimson Pro', 'Georgia', serif" }}
        >
            {/* ===== Loading Screen ===== */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center"
                    >
                        {/* Animated Book Opening */}
                        <motion.div
                            initial={{ rotateY: -90 }}
                            animate={{ rotateY: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative w-48 h-64 mb-8"
                            style={{ perspective: 1000 }}
                        >
                            {coverUrl ? (
                                <img src={coverUrl} alt={title} className="w-full h-full object-cover rounded-lg shadow-2xl" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 rounded-lg shadow-2xl flex items-center justify-center">
                                    <span className="text-4xl">📖</span>
                                </div>
                            )}
                            {/* Shine Effect */}
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "200%" }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                            />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl font-serif italic text-white/80 mb-2 text-center px-4"
                        >
                            {title}
                        </motion.h2>
                        {author && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-sm text-white/50"
                            >
                                by {author}
                            </motion.p>
                        )}

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="mt-8 flex items-center gap-3 text-white/40"
                        >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs uppercase tracking-widest">Preparing your reading experience...</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== Top Bar ===== */}
            <AnimatePresence>
                {showUI && (
                    <motion.header
                        initial={{ y: -80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -80, opacity: 0 }}
                        transition={{ type: "spring", damping: 25 }}
                        className={`absolute top-0 left-0 right-0 z-40 ${themeStyles.bg}/80 backdrop-blur-xl border-b border-white/5`}
                    >
                        <div className="flex items-center justify-between px-4 py-3">
                            {/* Left Section */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="hidden sm:block">
                                    <h1 className="font-serif text-lg font-medium truncate max-w-[200px] lg:max-w-[400px]">{title}</h1>
                                    {author && <p className="text-xs opacity-50">{author}</p>}
                                </div>
                            </div>

                            {/* Center - Page Info */}
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5">
                                    <input
                                        type="number"
                                        value={currentPage}
                                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                                        className="w-12 bg-transparent text-center font-mono outline-none"
                                        min={1}
                                        max={numPages}
                                    />
                                    <span className="opacity-50">/</span>
                                    <span className="font-mono opacity-50">{numPages}</span>
                                </div>
                            </div>

                            {/* Right Section */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleBookmark}
                                    className={`p-2 rounded-full transition-all ${isCurrentPageBookmarked ? "text-amber-400 bg-amber-400/20" : "hover:bg-white/10"}`}
                                >
                                    {isCurrentPageBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => setShowBookmarks(true)}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block"
                                >
                                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-0.5 bg-white/5">
                            <motion.div
                                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                                style={{ width: `${readingProgress}%` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${readingProgress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </motion.header>
                )}
            </AnimatePresence>

            {/* ===== Main Content Area ===== */}
            <motion.div
                ref={pageContainerRef}
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                onClick={handleTap}
                drag={isMobile ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x: dragX, opacity: dragOpacity }}
            >
                <Document
                    file={effectivePdfUrl}
                    onLoadSuccess={onDocumentLoad}
                    onLoadError={onDocumentError}
                    loading={null}
                    className={`${themeStyles.paper} rounded-lg overflow-hidden transition-all duration-300 osiris-page-edge`}
                    externalLinkTarget="_blank"
                >
                    <div className="osiris-page-3d relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPage}
                                initial={pageFlipEnabled && flipDirection ? {
                                    rotateY: flipDirection === "right" ? 90 : -90,
                                    x: flipDirection === "right" ? "20%" : "-20%",
                                    opacity: 0.3,
                                    scale: 0.95,
                                } : { opacity: 0, scale: 0.98 }}
                                animate={{
                                    rotateY: 0,
                                    x: 0,
                                    opacity: 1,
                                    scale: 1,
                                }}
                                exit={pageFlipEnabled && flipDirection ? {
                                    rotateY: flipDirection === "right" ? -90 : 90,
                                    x: flipDirection === "right" ? "-20%" : "20%",
                                    opacity: 0.3,
                                    scale: 0.95,
                                } : { opacity: 0, scale: 1.02 }}
                                transition={{
                                    type: pageFlipEnabled ? "spring" : "tween",
                                    stiffness: 100,
                                    damping: 20,
                                    duration: pageFlipEnabled ? 0.5 : 0.15,
                                }}
                                className="flex relative"
                                style={{
                                    transformOrigin: flipDirection === "right" ? "left center" : "right center",
                                    transformStyle: "preserve-3d",
                                    // Color inversion filter for dark mode reading
                                    filter: invertColors
                                        ? "invert(1) hue-rotate(180deg) contrast(0.9) brightness(0.9)"
                                        : "none",
                                    // Dynamic shadow based on animation
                                    boxShadow: pageFlipEnabled && flipDirection
                                        ? flipDirection === "right"
                                            ? "20px 0 40px -10px rgba(0,0,0,0.4), 0 0 30px rgba(0,0,0,0.2)"
                                            : "-20px 0 40px -10px rgba(0,0,0,0.4), 0 0 30px rgba(0,0,0,0.2)"
                                        : "0 0 30px rgba(0,0,0,0.3)",
                                }}
                            >
                                {/* Page curl shadow overlay - appears during flip */}
                                {pageFlipEnabled && flipDirection && (
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none z-10"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.5 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            background: flipDirection === "right"
                                                ? "linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 30%, transparent 100%)"
                                                : "linear-gradient(to left, rgba(0,0,0,0.2) 0%, transparent 30%, transparent 100%)",
                                        }}
                                    />
                                )}

                                <Page
                                    pageNumber={currentPage}
                                    width={pageWidth}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="select-text"
                                />
                                {viewMode === "double" && currentPage < numPages && !isMobile && (
                                    <>
                                        {/* Center spine shadow for realism */}
                                        <div className="w-px bg-gradient-to-r from-black/20 via-black/30 to-black/20" />
                                        <Page
                                            pageNumber={currentPage + 1}
                                            width={pageWidth}
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                            className="select-text"
                                        />
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Document>

                {/* Page Turn Hint Gradients */}
                {!isMobile && showUI && (
                    <>
                        <div
                            className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center pl-4"
                            onClick={(e) => { e.stopPropagation(); prevPage(); }}
                        >
                            <ChevronLeft className="w-8 h-8 text-white/50" />
                        </div>
                        <div
                            className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-end pr-4"
                            onClick={(e) => { e.stopPropagation(); nextPage(); }}
                        >
                            <ChevronRight className="w-8 h-8 text-white/50" />
                        </div>
                    </>
                )}
            </motion.div>

            {/* ===== Bottom Bar (Mobile) ===== */}
            <AnimatePresence>
                {showUI && isMobile && (
                    <motion.footer
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", damping: 25 }}
                        className={`absolute bottom-0 left-0 right-0 z-40 ${themeStyles.bg}/80 backdrop-blur-xl border-t border-white/5 pb-safe`}
                    >
                        <div className="flex items-center justify-between px-6 py-4">
                            <button onClick={prevPage} disabled={currentPage <= 1} className="p-3 rounded-full bg-white/10 disabled:opacity-30">
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-serif">{currentPage}</span>
                                <span className="text-xs opacity-50">of {numPages}</span>
                            </div>

                            <button onClick={nextPage} disabled={currentPage >= numPages} className="p-3 rounded-full bg-white/10 disabled:opacity-30">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Page Slider */}
                        <div className="px-6 pb-4">
                            <input
                                type="range"
                                min={1}
                                max={numPages || 1}
                                value={currentPage}
                                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    </motion.footer>
                )}
            </AnimatePresence>

            {/* ===== Settings Panel ===== */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className={`${themeStyles.bg} w-full sm:w-[400px] sm:rounded-2xl rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5" /> Reading Settings
                            </h3>

                            {/* Theme Selection */}
                            <div className="mb-6">
                                <label className="text-sm font-medium opacity-70 mb-3 block">Theme</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(Object.keys(THEMES) as ThemeMode[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTheme(t)}
                                            className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${theme === t ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-black" : ""
                                                } ${THEMES[t].bg} ${THEMES[t].text}`}
                                        >
                                            {t === "dark" && "🌙"}
                                            {t === "light" && "☀️"}
                                            {t === "sepia" && "📜"}
                                            {t === "midnight" && "🌌"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Zoom */}
                            <div className="mb-6">
                                <label className="text-sm font-medium opacity-70 mb-3 block">Zoom: {Math.round(zoom * 100)}%</label>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 rounded-lg bg-white/10">
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={2}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                                    />
                                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 rounded-lg bg-white/10">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* View Mode (Desktop Only) */}
                            {!isMobile && (
                                <div className="mb-6">
                                    <label className="text-sm font-medium opacity-70 mb-3 block">View Mode</label>
                                    <div className="flex gap-2">
                                        {(["single", "double"] as ViewMode[]).map((v) => (
                                            <button
                                                key={v}
                                                onClick={() => setViewMode(v)}
                                                className={`flex-1 py-2 px-4 rounded-lg capitalize transition-all ${viewMode === v ? "bg-cyan-500 text-black font-medium" : "bg-white/10"
                                                    }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Page Flip Animation */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium block">Page Flip Animation</label>
                                        <span className="text-xs opacity-50">Realistic 3D page turn effect</span>
                                    </div>
                                    <button
                                        onClick={() => setPageFlipEnabled(!pageFlipEnabled)}
                                        className={`w-12 h-7 rounded-full transition-all duration-200 relative ${pageFlipEnabled ? "bg-cyan-500" : "bg-white/20"
                                            }`}
                                    >
                                        <motion.div
                                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                                            animate={{ left: pageFlipEnabled ? 24 : 4 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Dark Mode Reading (Invert) */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium block">Dark Mode Reading</label>
                                        <span className="text-xs opacity-50">Invert PDF colors for eye comfort</span>
                                    </div>
                                    <button
                                        onClick={() => setInvertColors(!invertColors)}
                                        className={`w-12 h-7 rounded-full transition-all duration-200 relative ${invertColors ? "bg-purple-500" : "bg-white/20"
                                            }`}
                                    >
                                        <motion.div
                                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                                            animate={{ left: invertColors ? 24 : 4 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors mt-4"
                            >
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== Bookmarks Panel ===== */}
            <AnimatePresence>
                {showBookmarks && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
                        onClick={() => setShowBookmarks(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className={`${themeStyles.bg} w-full sm:w-[400px] sm:rounded-2xl rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Bookmark className="w-5 h-5" /> Bookmarks
                            </h3>

                            {bookmarks.length === 0 ? (
                                <div className="text-center py-12 opacity-50">
                                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>No bookmarks yet</p>
                                    <p className="text-sm mt-1">Tap the bookmark icon to save your place</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {bookmarks.sort((a, b) => a.page - b.page).map((bm) => (
                                        <button
                                            key={bm.page}
                                            onClick={() => { goToPage(bm.page); setShowBookmarks(false); }}
                                            className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold">
                                                    {bm.page}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium">Page {bm.page}</div>
                                                    <div className="text-xs opacity-50">
                                                        {new Date(bm.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setShowBookmarks(false)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors mt-6"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== Mode Label (Preview) ===== */}
            {mode === "preview" && (
                <div className="absolute bottom-4 right-4 z-30 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium">
                    Preview Mode
                </div>
            )}

            {/* ===== Touch Hint (First Load on Mobile) ===== */}
            {isMobile && !loading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 3, duration: 1 }}
                    className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
                >
                    <div className="text-center px-8 py-6 rounded-2xl bg-black/50 backdrop-blur-sm">
                        <div className="text-4xl mb-2">👆</div>
                        <p className="text-sm text-white/70">Swipe left/right to turn pages</p>
                        <p className="text-xs text-white/40 mt-1">Tap to show/hide controls</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
