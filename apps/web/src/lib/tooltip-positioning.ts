import type React from "react";

export interface CalculateTooltipPositionOptions {
  targetRect: DOMRect;
  tooltipWidth?: number;
  tooltipHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  preferredPlacement?: "top" | "bottom" | "left" | "right" | "auto";
  headerOffset?: number;
  screenPadding?: number;
}

export interface TooltipPositionResult {
  style: React.CSSProperties;
  placement: "top" | "bottom" | "left" | "right" | "center";
}

/**
 * Calculates position of tour tooltip ensuring it stays completely within the viewport
 * without clipping, overflowing offscreen, or obscuring top headers.
 */
export function calculateTooltipPosition({
  targetRect,
  tooltipWidth = 360,
  tooltipHeight = 220,
  viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280,
  viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800,
  preferredPlacement = "auto",
  headerOffset = 72,
  screenPadding = 16,
}: CalculateTooltipPositionOptions): TooltipPositionResult {
  const actualWidth = Math.min(tooltipWidth, viewportWidth - screenPadding * 2);
  const actualHeight = Math.min(tooltipHeight, viewportHeight - screenPadding * 2);

  // Available spaces in 4 cardinal directions
  const spaceBelow = viewportHeight - targetRect.bottom - screenPadding;
  const spaceAbove = targetRect.top - headerOffset - screenPadding;
  const spaceRight = viewportWidth - targetRect.right - screenPadding;
  const spaceLeft = targetRect.left - screenPadding;

  let placement: "top" | "bottom" | "left" | "right" | "center" = "bottom";

  if (preferredPlacement !== "auto") {
    placement = preferredPlacement;
  } else {
    // Determine best fit automatically
    if (spaceBelow >= actualHeight + 12) {
      placement = "bottom";
    } else if (spaceAbove >= actualHeight + 12) {
      placement = "top";
    } else if (spaceRight >= actualWidth + 12) {
      placement = "right";
    } else if (spaceLeft >= actualWidth + 12) {
      placement = "left";
    } else if (spaceBelow > spaceAbove) {
      placement = "bottom";
    } else {
      placement = "top";
    }
  }

  let top = 0;
  let left = 0;

  switch (placement) {
    case "bottom":
      top = targetRect.bottom + 12;
      left = targetRect.left;
      break;

    case "top":
      top = targetRect.top - actualHeight - 12;
      left = targetRect.left;
      break;

    case "right":
      top = targetRect.top;
      left = targetRect.right + 12;
      break;

    case "left":
      top = targetRect.top;
      left = targetRect.left - actualWidth - 12;
      break;

    default:
      top = viewportHeight / 2 - actualHeight / 2;
      left = viewportWidth / 2 - actualWidth / 2;
      placement = "center";
      break;
  }

  // Constrain top & left within viewport bounds
  top = Math.max(headerOffset + screenPadding, Math.min(viewportHeight - actualHeight - screenPadding, top));
  left = Math.max(screenPadding, Math.min(viewportWidth - actualWidth - screenPadding, left));

  const style: React.CSSProperties = {
    position: "fixed",
    top: `${top}px`,
    left: `${left}px`,
    width: `${actualWidth}px`,
    maxHeight: `${Math.min(actualHeight, viewportHeight - top - screenPadding)}px`,
    zIndex: 9999,
  };

  return { style, placement };
}
