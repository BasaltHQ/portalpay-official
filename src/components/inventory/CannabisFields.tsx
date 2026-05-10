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
    strain?: string;
    setStrain?: (v: string) => void;
    strainType?: string;
    setStrainType?: (v: string) => void;
    thcPercent?: number;
    setThcPercent?: (v: number) => void;
    cbdPercent?: number;
    setCbdPercent?: (v: number) => void;
    weight?: number;
    setWeight?: (v: number) => void;
    weightUnit?: string;
    setWeightUnit?: (v: string) => void;
    categoryTag?: string;
    setCategoryTag?: (v: string) => void;
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
    strain = "",
    setStrain = () => {},
    strainType = "",
    setStrainType = () => {},
    thcPercent = 0,
    setThcPercent = () => {},
    cbdPercent = 0,
    setCbdPercent = () => {},
    weight = 0,
    setWeight = () => {},
    weightUnit = "g",
    setWeightUnit = () => {},
    categoryTag = "",
    setCategoryTag = () => {},
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

            {!isNonCannabis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-md border border-foreground/[0.05] bg-foreground/[0.02] mb-3">
                    <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold mb-1">Product Details</h4>
                    </div>
                    <div>
                        <label className="microtext text-muted-foreground font-semibold">Strain Name</label>
                        <input
                            type="text"
                            className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                            placeholder="e.g. Blue Dream"
                            value={strain}
                            onChange={(e) => setStrain(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="microtext text-muted-foreground font-semibold">Strain Type</label>
                        <select
                            className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                            value={strainType}
                            onChange={(e) => setStrainType(e.target.value)}
                        >
                            <option value="" className="bg-background text-foreground">Select Type</option>
                            <option value="indica" className="bg-background text-foreground">Indica</option>
                            <option value="sativa" className="bg-background text-foreground">Sativa</option>
                            <option value="hybrid" className="bg-background text-foreground">Hybrid</option>
                            <option value="cbd" className="bg-background text-foreground">CBD-Dominant</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="microtext text-muted-foreground font-semibold">THC %</label>
                            <input
                                type="number"
                                step="0.1"
                                className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                                placeholder="0.0"
                                value={thcPercent || ""}
                                onChange={(e) => setThcPercent(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="microtext text-muted-foreground font-semibold">CBD %</label>
                            <input
                                type="number"
                                step="0.1"
                                className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                                placeholder="0.0"
                                value={cbdPercent || ""}
                                onChange={(e) => setCbdPercent(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="microtext text-muted-foreground font-semibold">Weight</label>
                            <input
                                type="number"
                                step="0.01"
                                className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                                placeholder="0.00"
                                value={weight || ""}
                                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="w-24">
                            <label className="microtext text-muted-foreground font-semibold">Unit</label>
                            <select
                                className="mt-1 w-full h-12 px-2 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                                value={weightUnit}
                                onChange={(e) => setWeightUnit(e.target.value)}
                            >
                                <option value="g" className="bg-background text-foreground">g</option>
                                <option value="oz" className="bg-background text-foreground">oz</option>
                                <option value="mg" className="bg-background text-foreground">mg</option>
                                <option value="ea" className="bg-background text-foreground">ea</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="microtext text-muted-foreground font-semibold">Category Tag</label>
                        <select
                            className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                            value={categoryTag}
                            onChange={(e) => setCategoryTag(e.target.value)}
                        >
                            <option value="" className="bg-background text-foreground">Select Category</option>
                            <option value="flower" className="bg-background text-foreground">Flower</option>
                            <option value="preroll" className="bg-background text-foreground">Preroll</option>
                            <option value="edible" className="bg-background text-foreground">Edible</option>
                            <option value="concentrate" className="bg-background text-foreground">Concentrate</option>
                            <option value="vape" className="bg-background text-foreground">Vape</option>
                            <option value="topical" className="bg-background text-foreground">Topical</option>
                            <option value="tincture" className="bg-background text-foreground">Tincture</option>
                            <option value="seed" className="bg-background text-foreground">Seed / Clone</option>
                        </select>
                    </div>
                </div>
            )}
            
            {!isNonCannabis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-md border bg-green-50/50 dark:bg-green-950/20">
                    <div>
                        <label className="microtext text-muted-foreground font-semibold">METRC Package Tag</label>
                        <input
                            type="text"
                            maxLength={24}
                            className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                            placeholder="1A400000000..."
                            value={metrcTag}
                            onChange={(e) => setMetrcTag(e.target.value.toUpperCase())}
                        />
                    </div>
                    <div>
                        <label className="microtext text-muted-foreground font-semibold">BioTrack Barcode ID</label>
                        <input
                            type="text"
                            className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors focus:ring-green-500"
                            placeholder="e.g. 12345678901234"
                            value={biotrackId}
                            onChange={(e) => setBiotrackId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="microtext text-muted-foreground">Internal Batch Number</label>
                        <input
                            type="text"
                            className="mt-1 w-full h-12 px-4 border border-foreground/[0.05] rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors"
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
