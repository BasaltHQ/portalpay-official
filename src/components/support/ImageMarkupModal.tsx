"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, Undo2, Trash2, Save, Pencil } from "lucide-react";

interface ImageMarkupModalProps {
    imageUrl: string;
    onSave: (newUrl: string) => void;
    onClose: () => void;
}

export function ImageMarkupModal({ imageUrl, onSave, onClose }: ImageMarkupModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);

    // Use proxy URL so the image is served from same-origin (no CORS issues)
    const proxyUrl = `/api/support/image-proxy?url=${encodeURIComponent(imageUrl)}&format=binary`;

    // Load image onto canvas when it loads via the hidden img element
    const handleImageLoad = (img: HTMLImageElement) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const maxW = 1200;
        const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        setLoaded(true);
        setError("");
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ("touches" in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = "#ef4444"; // Red
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        ctx.closePath();
        // Save state to history
        setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas!.width, canvas!.height)]);
    };

    const undo = () => {
        if (history.length <= 1) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        const newHistory = history.slice(0, -1);
        setHistory(newHistory);
        const lastState = newHistory[newHistory.length - 1];
        ctx.putImageData(lastState, 0, 0);
    };

    const clear = () => {
        if (history.length <= 1) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !history[0]) return;

        ctx.putImageData(history[0], 0, 0);
        setHistory([history[0]]);
    };

    const save = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setSaving(true);
        setError("");
        try {
            // Convert canvas to blob
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, "image/png", 0.95);
            });
            if (!blob) throw new Error("Failed to create image");

            // Upload to public images API
            const fd = new FormData();
            fd.append("file", blob, "markup.png");
            fd.append("target", "support");

            const res = await fetch("/api/public/images", {
                method: "POST",
                body: fd,
            });
            const data = await res.json();
            if (!res.ok || !data.ok || !data.images?.[0]?.url) {
                throw new Error(data.error || "Upload failed");
            }

            onSave(data.images[0].url);
        } catch (e: any) {
            setError(e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
            <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:max-w-4xl sm:max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header - Premium glass effect */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
                            <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm sm:text-base">Annotate Image</h3>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Draw on the image to highlight areas
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-gradient-to-b from-muted/5 to-muted/20">
                    {/* Hidden image loader - uses proxy URL to avoid CORS */}
                    <img
                        src={proxyUrl}
                        alt=""
                        className="hidden"
                        onLoad={(e) => handleImageLoad(e.currentTarget)}
                        onError={() => setError("Failed to load image")}
                    />
                    {!loaded && !error && (
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-sm">Loading image...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center gap-2 text-red-500">
                            <Pencil className="w-8 h-8 opacity-50" />
                            <p className="text-sm text-center">{error}</p>
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className={`max-w-full max-h-full cursor-crosshair touch-none rounded-lg shadow-xl ${!loaded ? "hidden" : ""}`}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>

                {/* Footer Actions - Mobile responsive */}
                <div className="p-3 sm:p-4 border-t border-white/10 shrink-0 bg-gradient-to-t from-muted/10 to-transparent">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {/* Drawing tools */}
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <button
                                onClick={undo}
                                disabled={history.length <= 1}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg border border-white/10 bg-muted/30 hover:bg-muted/50 transition-colors disabled:opacity-30"
                            >
                                <Undo2 className="w-4 h-4" />
                                <span className="text-sm">Undo</span>
                            </button>
                            <button
                                onClick={clear}
                                disabled={history.length <= 1}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-30 text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm">Clear</span>
                            </button>
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-lg border border-white/10 bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={save}
                                disabled={saving || !loaded}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 text-sm font-medium"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Save</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Small button to trigger markup modal on image thumbnails
export function MarkupButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="absolute bottom-1 right-1 w-6 h-6 bg-background/90 backdrop-blur-sm border rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors group shadow-sm"
            title="Annotate image"
        >
            <Pencil className="w-3 h-3 text-muted-foreground group-hover:text-red-500" />
        </button>
    );
}
