"use client";

import React from "react";

export interface TourOverlayProps {
  targetRect: DOMRect | null;
  allowInteraction?: boolean;
}

export function TourOverlay({ targetRect, allowInteraction = true }: TourOverlayProps) {
  if (!targetRect) return null;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : targetRect.right;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : targetRect.bottom;
  const top = Math.max(0, targetRect.top - 6);
  const left = Math.max(0, targetRect.left - 6);
  const right = Math.min(viewportWidth, targetRect.right + 6);
  const bottom = Math.min(viewportHeight, targetRect.bottom + 6);
  const blockerClass = "fixed z-[9985] bg-transparent";

  return (
    <>
      {/* Target Highlight Spotlight Mask with smooth CSS transitions */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-300 ease-out z-[9990]"
        style={{
          boxShadow: `0 0 0 9999px rgba(15, 23, 42, 0.40)`,
          borderRadius: 14,
          top,
          left,
          width: Math.max(0, right - left),
          height: Math.max(0, bottom - top),
        }}
      />

      {/* Non-blocking pointer event layer */}
      {allowInteraction ? (
        <>
          <div className={blockerClass} style={{ top: 0, left: 0, right: 0, height: top }} />
          <div className={blockerClass} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
          <div className={blockerClass} style={{ top, left: 0, width: left, height: bottom - top }} />
          <div className={blockerClass} style={{ top, left: right, right: 0, height: bottom - top }} />
        </>
      ) : (
        <div className="fixed inset-0 z-[9985] bg-transparent" />
      )}
    </>
  );
}
