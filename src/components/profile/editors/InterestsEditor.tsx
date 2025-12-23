"use client";

import React, { useState } from "react";

interface Interest {
  name: string;
  category: string;
}

interface InterestsEditorProps {
  interests: Interest[];
  onAdd: (interest: Interest) => void;
  onRemove: (index: number) => void;
}

const categories = ['General', 'Technology', 'Arts', 'Sports', 'Music', 'Gaming', 'Food', 'Travel', 'Business', 'Science'];

const categoryColors: Record<string, string> = {
  'General': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  'Technology': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'Arts': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'Sports': 'bg-green-500/20 text-green-300 border-green-500/40',
  'Music': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  'Gaming': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  'Food': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'Travel': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'Business': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  'Science': 'bg-teal-500/20 text-teal-300 border-teal-500/40'
};

export function InterestsEditor({ interests, onAdd, onRemove }: InterestsEditorProps) {
  const [newInterest, setNewInterest] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");

  const handleAdd = () => {
    if (!newInterest.trim()) return;
    onAdd({ name: newInterest.trim(), category: selectedCategory });
    setNewInterest("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="text-sm font-medium block">Add Interest</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 h-9 px-3 py-1 border rounded-md bg-background text-sm"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="e.g., Artificial Intelligence"
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select
            className="h-9 px-3 border rounded-md bg-background text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">
          Your Interests ({interests.length}/25)
        </label>
        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  categoryColors[interest.category] || categoryColors.General
                }`}
              >
                {interest.name}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No interests added yet.</p>
        )}
      </div>
    </div>
  );
}
