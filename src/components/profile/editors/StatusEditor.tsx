"use client";

import React from "react";

interface StatusEditorProps {
  message: string;
  mood: string;
  onMessageChange: (value: string) => void;
  onMoodChange: (value: string) => void;
}

const moodEmojis = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🔥', label: 'Excited' },
  { emoji: '💼', label: 'Professional' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🎉', label: 'Celebrating' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '💪', label: 'Motivated' }
];

export function StatusEditor({
  message,
  mood,
  onMessageChange,
  onMoodChange
}: StatusEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-2">Status Message</label>
        <textarea
          className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background text-sm"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={280}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {message.length}/280 characters
        </p>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Current Mood</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {moodEmojis.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => onMoodChange(m.label)}
              className={`p-3 rounded-md border text-center transition-colors ${
                mood === m.label
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-foreground/5'
              }`}
            >
              <div className="text-2xl mb-1">{m.emoji}</div>
              <div className="text-xs">{m.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
