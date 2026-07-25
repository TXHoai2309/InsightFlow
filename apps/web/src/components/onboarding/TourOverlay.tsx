"use client";

import React from "react";

export interface TourOverlayProps {
  targetRect: DOMRect | null;
  allowInteraction?: boolean;
}

export function TourOverlay({ targetRect, allowInteraction = true }: TourOverlayProps) {
  if (!targetRect) return null;

  return (
    <>
      {/* Target Highlight Spotlight Mask with smooth CSS transitions */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-300 ease-out z-[9990]"
        style={{
          boxShadow: `0 0 0 9999px rgba(15, 23, 42, 0.40)`,
          borderRadius: 14,
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }}
      />

      {/* Non-blocking pointer event layer */}
      {!allowInteraction && (
        <div className="fixed inset-0 z-[9985] bg-transparent" />
      )}
    </>
  );
}
