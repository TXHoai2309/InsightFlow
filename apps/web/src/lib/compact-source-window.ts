/**
 * Opens a compact floating Chrome popup window on the right side of the screen.
 * Allows users to directly view, type, and post comments on TikTok/Facebook/YouTube
 * while InsightFlow remains open on the main screen on the left.
 */
export function openCompactSourceWindow(url: string | null) {
  if (!url || typeof window === "undefined") return;

  const width = 680;
  const height = 840;
  const screenWidth = window.screen?.width || 1280;
  // Position floating window on the right edge of the user's screen
  const left = Math.max(10, screenWidth - width - 20);
  const top = 40;
  const features = `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`;

  const popupWindow = window.open(url, "InsightFlowSmallSourceWindow", features);
  if (popupWindow) {
    popupWindow.focus();
  }
}
