"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface PortalPayVideoProps {
  className?: string;
}

export default function PortalPayVideo({ className = "" }: PortalPayVideoProps) {
  const [showModal, setShowModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleFullscreenChange = () => {
      // If video enters fullscreen, exit it and show modal instead
      if (document.fullscreenElement === video) {
        document.exitFullscreen();
        setShowModal(true);
      }
    };

    video.addEventListener('fullscreenchange', handleFullscreenChange);
    video.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('fullscreenchange', handleFullscreenChange);
      video.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <>
      {/* Preview Video with controls - Only show when modal is closed */}
      {!showModal && (
        <video
          ref={videoRef}
          className={`w-full rounded-lg shadow-lg ${className}`}
          controls
          playsInline
          preload="metadata"
          style={{
            accentColor: "var(--primary)"
          }}
        >
          <source src="https://engram1.blob.core.windows.net/portalpay/Videos/PortalPay25LQ.mp4" type="video/mp4" />
        </video>
      )}

      {/* Modal - Only show when open - Rendered via Portal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowModal(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
            style={{ zIndex: 10000 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Video container */}
          <div
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              className="w-full h-full object-contain"
              controls
              playsInline
              autoPlay
              style={{
                accentColor: "var(--primary)"
              }}
            >
              <source src="https://engram1.blob.core.windows.net/portalpay/Videos/PortalPay25.mp4" type="video/mp4" />
            </video>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
