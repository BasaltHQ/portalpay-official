'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function VideoSection({ sectionConfig }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const url = s.url || '';
  const maxWidthMap: Record<string, string> = { medium: '800px', large: '1000px', full: '100%' };
  const maxW = maxWidthMap[s.maxWidth || 'large'] || '1000px';
  const ratioMap: Record<string, string> = { '16:9': '56.25%', '4:3': '75%', '1:1': '100%', '9:16': '177.78%' };
  const padding = ratioMap[s.aspectRatio || '16:9'] || '56.25%';

  // Parse YouTube/Vimeo
  const getEmbedUrl = (raw: string): string | null => {
    const ytMatch = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=${s.autoplay ? 1 : 0}&mute=${s.autoplay ? 1 : 0}&loop=${s.loop ? 1 : 0}`;
    const vimeoMatch = raw.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${s.autoplay ? 1 : 0}&muted=${s.autoplay ? 1 : 0}&loop=${s.loop ? 1 : 0}`;
    return null;
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <section style={{ maxWidth: maxW, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {s.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>{s.heading}</h2>}
      {s.description && <p style={{ color: 'var(--tmpl-text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>{s.description}</p>}
      <div style={{ position: 'relative', paddingBottom: padding, borderRadius: 'var(--tmpl-border-radius)', overflow: 'hidden', backgroundColor: '#000' }}>
        {embedUrl ? (
          <iframe src={embedUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen" allowFullScreen />
        ) : url ? (
          <video src={url} controls autoPlay={s.autoplay} muted={s.autoplay} loop={s.loop} poster={s.posterImage} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tmpl-text-muted)' }}>Add a video URL</div>
        )}
      </div>
    </section>
  );
}
