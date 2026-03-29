'use client';
import React from 'react';

interface CannabisFieldsProps {
    metrcTag: string;
    setMetrcTag: (v: string) => void;
    biotrackId: string;
    setBiotrackId: (v: string) => void;
    complianceBatchNumber: string;
    setComplianceBatchNumber: (v: string) => void;
    isNonCannabis: boolean;
    setIsNonCannabis: (v: boolean) => void;
}

export default function CannabisFields({
    metrcTag,
    setMetrcTag,
    biotrackId,
    setBiotrackId,
    complianceBatchNumber,
    setComplianceBatchNumber,
    isNonCannabis,
    setIsNonCannabis,
}: CannabisFieldsProps) {
    return (
        <div className="md:col-span-2 border-t pt-4 my-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-500">Cannabis Compliance</h4>
                    <p className="microtext text-muted-foreground">Attach regulatory tags to sync with METRC or BioTrack.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isNonCannabis}
                        onChange={(e) => setIsNonCannabis(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Non-Cannabis Item</span>
                </label>
            </div>

            {!isNonCannabis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-md border bg-green-50/50 dark:bg-green-950/20">
                    <div>
                        <label className="microtext text-muted-foreground font-semibold">METRC Package Tag</label>
                        <input
                            type="text"
                            maxLength={24}
                            className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background focus:ring-green-500"
                            placeholder="1A400000000..."
                            value={metrcTag}
                            onChange={(e) => setMetrcTag(e.target.value.toUpperCase())}
                        />
                    </div>
                    <div>
                        <label className="microtext text-muted-foreground font-semibold">BioTrack Barcode ID</label>
                        <input
                            type="text"
                            className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background focus:ring-green-500"
                            placeholder="e.g. 12345678901234"
                            value={biotrackId}
                            onChange={(e) => setBiotrackId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="microtext text-muted-foreground">Internal Batch Number</label>
                        <input
                            type="text"
                            className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                            placeholder="Optional tracking info"
                            value={complianceBatchNumber}
                            onChange={(e) => setComplianceBatchNumber(e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <div className="p-3 rounded-md border border-dashed bg-foreground/5 dark:bg-foreground/10 text-center">
                    <span className="text-sm text-muted-foreground">
                        Item flagged as non-cannabis accessory (e.g., Lighters, Papers). Compliance syncing will be skipped.
                    </span>
                </div>
            )}
        </div>
    );
}
