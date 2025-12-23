"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PublishingFormat, BookCondition } from "@/types/inventory";

interface PublishingFieldsProps {
    title: string;
    setTitle: (val: string) => void;
    author: string;
    setAuthor: (val: string) => void;
    publisher: string;
    setPublisher: (val: string) => void;
    isbn: string;
    setIsbn: (val: string) => void;
    publicationDate: string;
    setPublicationDate: (val: string) => void;
    format: PublishingFormat;
    setFormat: (val: PublishingFormat) => void;
    pageCount: number;
    setPageCount: (val: number) => void;
    language: string;
    setLanguage: (val: string) => void;
    edition: string;
    setEdition: (val: string) => void;
    genres: string[];
    setGenres: (val: string[]) => void;
    condition: BookCondition;
    setCondition: (val: BookCondition) => void;
    downloadUrl: string;
    setDownloadUrl: (val: string) => void;
    previewUrl: string;
    setPreviewUrl: (val: string) => void;
    drmEnabled: boolean;
    setDrmEnabled: (val: boolean) => void;
}

const PUBLISHING_FORMATS: PublishingFormat[] = [
    'Hardcover', 'Paperback', 'Ebook', 'Audiobook', 'Magazine', 'Journal', 'Other'
];

const BOOK_CONDITIONS: BookCondition[] = [
    'New', 'Like New', 'Very Good', 'Good', 'Acceptable'
];

export function PublishingFields({
    title, setTitle,
    author, setAuthor,
    publisher, setPublisher,
    isbn, setIsbn,
    publicationDate, setPublicationDate,
    format, setFormat,
    pageCount, setPageCount,
    language, setLanguage,
    edition, setEdition,
    genres, setGenres,
    condition, setCondition,
    downloadUrl, setDownloadUrl,
    previewUrl, setPreviewUrl,
    drmEnabled, setDrmEnabled
}: PublishingFieldsProps) {
    const [newGenre, setNewGenre] = React.useState("");

    function addGenre() {
        const trimmed = newGenre.trim();
        if (!trimmed) return;
        setGenres([...(genres || []), trimmed]);
        setNewGenre("");
    }

    function removeGenre(index: number) {
        setGenres((genres || []).filter((_, i) => i !== index));
    }

    return (
        <div className="md:col-span-2 rounded-md border p-3 space-y-4">
            <div className="text-sm font-medium border-b pb-2">Publishing-Specific Fields</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                    <label className="microtext text-muted-foreground">Book Title (if different from Item Name)</label>
                    <input
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="Book Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Author */}
                <div>
                    <label className="microtext text-muted-foreground">Author(s)</label>
                    <input
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="J.K. Rowling"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                    />
                </div>

                {/* Publisher */}
                <div>
                    <label className="microtext text-muted-foreground">Publisher</label>
                    <input
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="Penguin Books"
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                    />
                </div>

                {/* ISBN */}
                <div>
                    <label className="microtext text-muted-foreground">ISBN (10 or 13)</label>
                    <input
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background font-mono"
                        placeholder="978-3-16-148410-0"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                    />
                </div>

                {/* Publication Date */}
                <div>
                    <label className="microtext text-muted-foreground">Publication Date</label>
                    <input
                        type="date"
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        value={publicationDate}
                        onChange={(e) => setPublicationDate(e.target.value)}
                    />
                </div>

                {/* Format */}
                <div className="md:col-span-2">
                    <label className="microtext text-muted-foreground">Format</label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PUBLISHING_FORMATS.map((f) => {
                            const isEbook = f === 'Ebook';
                            const isSelected = format === f;
                            return (
                                <button
                                    key={f}
                                    type="button"
                                    disabled={!isEbook}
                                    onClick={() => isEbook && setFormat(f)}
                                    className={`relative px-3 py-2 rounded-lg border text-sm font-medium transition-all ${isEbook
                                            ? isSelected
                                                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                                : 'bg-background hover:bg-muted border-primary/50 text-primary'
                                            : 'bg-muted/30 border-muted text-muted-foreground cursor-not-allowed opacity-60'
                                        }`}
                                >
                                    {f}
                                    {!isEbook && (
                                        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30 rounded-full whitespace-nowrap">
                                            Soon
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Currently, only eBook format is available. Physical formats coming soon!</p>
                </div>

                {/* Condition */}
                <div>
                    <label className="microtext text-muted-foreground">Condition</label>
                    <select
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value as BookCondition)}
                    >
                        <option value="">Select Condition</option>
                        {BOOK_CONDITIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Edition */}
                <div>
                    <label className="microtext text-muted-foreground">Edition</label>
                    <input
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="e.g. 1st Edition"
                        value={edition}
                        onChange={(e) => setEdition(e.target.value)}
                    />
                </div>

                {/* Language */}
                <div>
                    <label className="microtext text-muted-foreground">Language</label>
                    <input
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="e.g. English"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    />
                </div>

                {/* Page Count */}
                <div>
                    <label className="microtext text-muted-foreground">Page Count</label>
                    <input
                        type="number"
                        min={0}
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="350"
                        value={pageCount || ""}
                        onChange={(e) => setPageCount(e.target.value ? parseInt(e.target.value) : 0)}
                    />
                </div>
            </div>

            {/* Genres */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="microtext text-muted-foreground">Genres / Topics</label>
                    <span className="microtext text-muted-foreground">
                        {(genres || []).length} item{(genres || []).length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <input
                        className="flex-1 h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="Add genre (press Enter)"
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addGenre();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={addGenre}
                        className="h-9 px-3 rounded-md border text-sm"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(genres || []).map((g, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-1 rounded-full border px-3 py-1 bg-background"
                        >
                            <span className="text-sm">{g}</span>
                            <button
                                type="button"
                                onClick={() => removeGenre(index)}
                                className="ml-1 h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {(genres || []).length === 0 && (
                        <div className="text-xs text-muted-foreground">
                            No genres added.
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t pt-4 mt-4">
                <div className="text-sm font-medium mb-3">Digital Content</div>

                {/* Download URL */}
                <div className="mb-3">
                    <label className="microtext text-muted-foreground">Download URL (Ebook)</label>
                    <input
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="https://..."
                        value={downloadUrl}
                        onChange={(e) => setDownloadUrl(e.target.value)}
                    />
                </div>

                {/* Preview URL */}
                <div className="mb-3">
                    <label className="microtext text-muted-foreground">Preview URL (Sample)</label>
                    <input
                        className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                        placeholder="https://..."
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                    />
                </div>

                {/* DRM Switch */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="drm-enabled"
                        className="rounded"
                        checked={drmEnabled}
                        onChange={(e) => setDrmEnabled(e.target.checked)}
                    />
                    <label htmlFor="drm-enabled" className="text-sm cursor-pointer select-none">
                        DRM Enabled (Digital Rights Management)
                    </label>
                </div>
            </div>
        </div>
    );
}
