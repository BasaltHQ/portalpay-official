"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

export type ShopDiscoveryEditorProps = {
  keywords: string[];
  categories: string[];
  onKeywordsChange: (k: string[]) => void;
  onCategoriesChange: (c: string[]) => void;
};

export default function ShopDiscoveryEditor({
  keywords,
  categories,
  onKeywordsChange,
  onCategoriesChange,
}: ShopDiscoveryEditorProps) {
  const [kwInput, setKwInput] = useState("");
  const [catInput, setCatInput] = useState("");

  const handleKwKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = kwInput.trim();
      if (val && keywords.length < 5 && !keywords.includes(val)) {
        onKeywordsChange([...keywords, val]);
      }
      setKwInput("");
    }
  };

  const handleCatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = catInput.trim();
      if (val && categories.length < 3 && !categories.includes(val)) {
        onCategoriesChange([...categories, val]);
      }
      setCatInput("");
    }
  };

  const removeKw = (idx: number) => {
    onKeywordsChange(keywords.filter((_, i) => i !== idx));
  };

  const removeCat = (idx: number) => {
    onCategoriesChange(categories.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-semibold">Store Discoverability</h3>
        <p className="microtext text-muted-foreground">
          Help AI agents and customers find your shop globally. Add descriptive tags and categories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categories (Max 3)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {c}
                <button type="button" onClick={() => removeCat(i)} className="hover:bg-primary/20 rounded p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
            placeholder={categories.length >= 3 ? "Limit reached" : "Enter category and press Enter"}
            value={catInput}
            onChange={(e) => setCatInput(e.target.value)}
            onKeyDown={handleCatKeyDown}
            disabled={categories.length >= 3}
          />
          <p className="microtext text-muted-foreground">Examples: Coffee, Food, Digital Art, SaaS</p>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Keywords / Tags (Max 5)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {keywords.map((k, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary/10 text-secondary-foreground text-xs font-medium border border-secondary/20">
                {k}
                <button type="button" onClick={() => removeKw(i)} className="hover:bg-secondary/20 rounded p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
            placeholder={keywords.length >= 5 ? "Limit reached" : "Enter keyword and press Enter"}
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={handleKwKeyDown}
            disabled={keywords.length >= 5}
          />
          <p className="microtext text-muted-foreground">Examples: organic, fast delivery, local</p>
        </div>
      </div>
    </div>
  );
}
