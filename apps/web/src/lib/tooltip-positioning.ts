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
  tooltipWidth = 380,
  tooltipHeight = 240,
  viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280,
  viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800,
  preferredPlacement = "auto",
  headerOffset = 72,
  screenPadding = 16,
}: CalculateTooltipPositionOptions): TooltipPositionResult {
  if (viewportWidth < 640) {
    return {
      placement: "center",
      style: {
        position: "fixed",
        left: `${screenPadding}px`,
        bottom: `${Math.max(screenPadding, 12)}px`,
        width: `${Math.max(280, viewportWidth - screenPadding * 2)}px`,
        maxHeight: `${Math.min(tooltipHeight, viewportHeight * 0.62)}px`,
        zIndex: 9999,
      },
    };
  }

  // Max-width constraint: 360px - 420px
  const constrainedWidth = Math.min(Math.max(tooltipWidth, 360), 420);
  const actualWidth = Math.min(constrainedWidth, viewportWidth - screenPadding * 2);

  // Max-height constraint: min(420px, calc(100vh - 48px))
  const constrainedMaxHeight = Math.min(420, viewportHeight - 48);
  const actualHeight = Math.min(Math.max(tooltipHeight, 180), constrainedMaxHeight);

  // Available spaces in 4 cardinal directions
  const spaceBelow = viewportHeight - targetRect.bottom - screenPadding;
  const spaceAbove = targetRect.top - headerOffset - screenPadding;
  const spaceRight = viewportWidth - targetRect.right - screenPadding;
  const spaceLeft = targetRect.left - screenPadding;

  let placement: "top" | "bottom" | "left" | "right" | "center" = "bottom";

  const fitsTop = spaceAbove >= actualHeight + 12;
  const fitsBottom = spaceBelow >= actualHeight + 12;
  const fitsRight = spaceRight >= actualWidth + 12;
  const fitsLeft = spaceLeft >= actualWidth + 12;

  if (preferredPlacement !== "auto") {
    if (preferredPlacement === "top" && fitsTop) placement = "top";
    else if (preferredPlacement === "bottom" && fitsBottom) placement = "bottom";
    else if (preferredPlacement === "right" && fitsRight) placement = "right";
    else if (preferredPlacement === "left" && fitsLeft) placement = "left";
    else {
      // Fallback chain: bottom -> top -> right -> left -> center
      if (fitsBottom) placement = "bottom";
      else if (fitsTop) placement = "top";
      else if (fitsRight) placement = "right";
      else if (fitsLeft) placement = "left";
      else placement = "center";
    }
  } else {
    // Determine best fit automatically
    if (fitsBottom) placement = "bottom";
    else if (fitsTop) placement = "top";
    else if (fitsRight) placement = "right";
    else if (fitsLeft) placement = "left";
    else if (spaceBelow >= spaceAbove) placement = "bottom";
    else placement = "top";
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
    maxHeight: `${Math.max(180, Math.min(constrainedMaxHeight, viewportHeight - top - screenPadding))}px`,
    zIndex: 9999,
  };

  return { style, placement };
}
