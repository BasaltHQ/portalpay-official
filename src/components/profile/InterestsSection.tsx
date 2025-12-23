"use client";

import React from "react";

interface Interest {
  name: string;
  category: string;
}

interface InterestsSectionProps {
  interests: Interest[];
}

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

function StarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>
    </svg>
  );
}

export function InterestsSection({ interests }: InterestsSectionProps) {
  if (!interests || interests.length === 0) return null;

  return (
    <div className="glass-pane rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <StarIcon size={18} />
        Interests
      </h2>
      <div className="flex flex-wrap gap-2">
        {interests.map((interest, i) => (
          <span 
            key={i} 
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${categoryColors[interest.category] || categoryColors.General}`}
          >
            {interest.name}
          </span>
        ))}
      </div>
    </div>
  );
}
