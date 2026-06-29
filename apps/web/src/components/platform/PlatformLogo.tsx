import type { Platform } from "@/types/dashboard";

type PlatformLogoProps = {
  platform: Platform | string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

type SvgStyle = {
  color?: string;
};

const TILE_SIZE_CLASSES: Record<NonNullable<PlatformLogoProps["size"]>, string> = {
  sm: "h-9 w-9 rounded-xl p-2",
  md: "h-11 w-11 rounded-2xl p-2.5",
  lg: "h-14 w-14 rounded-2xl p-3.5",
};

const SVG_SIZE_CLASSES: Record<NonNullable<PlatformLogoProps["size"]>, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

function normalizePlatform(platform: string) {
  const normalized = String(platform || "").toLowerCase();
  if (normalized === "threads") return "thread";
  if (normalized === "googlemap") return "google_maps";
  if (normalized === "befood") return "be";
  return normalized;
}

function getTileClassName(platform: string) {
  switch (platform) {
    default:
      return "";
  }
}

function getSvgClassName(platform: string, sizeClass: string) {
  return sizeClass;
}

function getSvgStyle(platform: string): SvgStyle {
  switch (platform) {
    case "tiktok":
      return { color: "var(--color-platform-tiktok)" };
    case "thread":
      return { color: "var(--color-platform-thread)" };
    default:
      return {};
  }
}

function renderPlatformSvg(platform: string, sizeClass: string) {
  switch (platform) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" role="img" aria-label="Facebook" className={sizeClass}>
          <circle cx="12" cy="12" r="10" fill="#1877F2" />
          <path
            fill="#FFFFFF"
            d="M13.38 19.5v-6.18h2.07l.31-2.41h-2.38V9.38c0-.7.19-1.17 1.2-1.17h1.28V6.08c-.22-.03-.98-.08-1.85-.08-1.83 0-3.08 1.12-3.08 3.18v1.73H9.17v2.41h1.76v6.18h2.45Z"
          />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" role="img" aria-label="TikTok" className={sizeClass}>
          <path
            fill="#25F4EE"
            d="M14.06 4.5c.34 1.08.96 2.05 1.84 2.75a5.3 5.3 0 0 0 2.84 1.1v2.43a7.7 7.7 0 0 1-4.68-1.6v4.63a5.2 5.2 0 1 1-5.2-5.2c.34 0 .67.03.99.1v2.52a2.78 2.78 0 1 0 1.79 2.58V4.5h2.42Z"
          />
          <path
            fill="#FE2C55"
            d="M13.25 3.5c.34 1.08.96 2.05 1.84 2.75a5.3 5.3 0 0 0 2.84 1.1v2.43a7.7 7.7 0 0 1-4.68-1.6v4.63a5.2 5.2 0 1 1-5.2-5.2c.34 0 .67.03.99.1v2.52a2.78 2.78 0 1 0 1.79 2.58V3.5h2.42Z"
            opacity="0.9"
          />
          <path
            fill="currentColor"
            d="M13.66 3.98c.36 1.2 1.06 2.3 2.06 3.08a5.88 5.88 0 0 0 3.14 1.2v2.68a8.42 8.42 0 0 1-5.2-1.72v4.55a5.78 5.78 0 1 1-5.78-5.78c.4 0 .78.04 1.16.12v2.78a3.1 3.1 0 1 0 2.2 2.96V3.98h2.42Z"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" role="img" aria-label="YouTube" className={sizeClass}>
          <path
            fill="#FF0000"
            d="M21.58 7.2a2.97 2.97 0 0 0-2.09-2.1C17.66 4.6 12 4.6 12 4.6s-5.66 0-7.49.5A2.97 2.97 0 0 0 2.42 7.2C1.92 9.03 1.92 12 1.92 12s0 2.97.5 4.8a2.97 2.97 0 0 0 2.09 2.1c1.83.5 7.49.5 7.49.5s5.66 0 7.49-.5a2.97 2.97 0 0 0 2.09-2.1c.5-1.83.5-4.8.5-4.8s0-2.97-.5-4.8Z"
          />
          <path fill="#FFFFFF" d="m10.16 15.35 4.72-2.73-4.72-2.73v5.46Z" />
        </svg>
      );
    case "thread":
      return (
        <svg viewBox="0 0 24 24" role="img" aria-label="Threads" className={sizeClass}>
          <path
            fill="currentColor"
            d="M15.63 10.6c-.18-.08-.37-.16-.57-.22-.1-2.06-1.48-3.24-3.76-3.24-2.45 0-4.14 1.53-4.32 3.9h2.18c.13-1.09.88-1.72 2.04-1.72 1.05 0 1.7.5 1.9 1.45-.55-.08-1.1-.11-1.68-.11-3.02 0-4.92 1.42-4.92 3.74 0 2.2 1.74 3.6 4.44 3.6 2.91 0 4.98-1.54 4.98-4.34 0-.34-.03-.67-.1-.97.78.43 1.21 1.1 1.21 1.9 0 1.42-1.18 2.43-2.86 2.43-1.05 0-1.94-.35-2.53-1l-1.62 1.3c.9 1.08 2.37 1.69 4.14 1.69 3 0 5.08-1.83 5.08-4.46 0-1.83-1.01-3.28-2.63-3.95Zm-4.48 5.2c-1.28 0-2.08-.52-2.08-1.39 0-.94.9-1.52 2.65-1.52.57 0 1.1.04 1.6.13-.2 1.7-1.05 2.78-2.17 2.78Z"
          />
        </svg>
      );
    case "google_maps":
      return (
        <svg viewBox="0 0 24 24" role="img" aria-label="Google Maps" className={sizeClass}>
          <path fill="#EA4335" d="M12 2.6a6.2 6.2 0 0 0-6.2 6.2c0 4.6 6.2 12.6 6.2 12.6s6.2-8 6.2-12.6A6.2 6.2 0 0 0 12 2.6Z" />
          <path fill="#FBBC04" d="M8.54 10.18a3.46 3.46 0 1 0 6.92 0 3.46 3.46 0 0 0-6.92 0Z" />
          <path fill="#4285F4" d="M12 6.72a3.46 3.46 0 0 1 3.46 3.46c0 .7-.21 1.35-.56 1.9l2.43 2.44A6.17 6.17 0 0 0 18.2 8.8 6.2 6.2 0 0 0 12 2.6v4.12Z" />
          <path fill="#34A853" d="M9 12.08a3.44 3.44 0 0 1-.46-1.9A3.46 3.46 0 0 1 12 6.72V2.6a6.2 6.2 0 0 0-6.2 6.2c0 2.39 1.67 5.56 3.74 8.32L12 14.68l-3-2.6Z" />
        </svg>
      );
    case "be":
      return (
        <svg viewBox="0 0 24 24" role="img" aria-label="Be" className={sizeClass}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#FFD400" />
          <path
            fill="#111111"
            d="M8.25 15.9V8.2h1.92v2.65c.35-.38.92-.72 1.78-.72 1.76 0 2.9 1.24 2.9 2.96 0 1.86-1.21 3.06-3.03 3.06-.86 0-1.5-.3-1.93-.8l-.08.55H8.25Zm3.15-1.36c.9 0 1.48-.58 1.48-1.46 0-.87-.58-1.45-1.48-1.45-.88 0-1.49.58-1.49 1.45 0 .88.6 1.46 1.49 1.46Zm4.18-1.55c0-1.72 1.24-2.86 2.94-2.86 1.72 0 2.85 1.2 2.85 2.99v.42h-3.97c.14.64.67 1.01 1.37 1.01.5 0 .91-.17 1.28-.5l1.01.99c-.6.7-1.46 1.08-2.43 1.08-1.82 0-3.05-1.17-3.05-3.13Zm1.87-.58h2.12c-.1-.6-.51-.95-1.04-.95-.57 0-.96.34-1.08.95Z"
          />
        </svg>
      );
    case "news":
      return (
        <svg viewBox="0 0 24 24" role="img" aria-label="News" className={sizeClass}>
          <rect x="3" y="4.5" width="18" height="15" rx="3" fill="#475569" />
          <rect x="6" y="7.4" width="5.2" height="4.6" rx="1" fill="#FFFFFF" />
          <rect x="12.6" y="7.8" width="5.2" height="1.2" rx="0.6" fill="#E2E8F0" />
          <rect x="12.6" y="10.1" width="4.3" height="1.2" rx="0.6" fill="#E2E8F0" />
          <rect x="6" y="13.8" width="11.8" height="1.2" rx="0.6" fill="#E2E8F0" />
          <rect x="6" y="16.1" width="9.8" height="1.2" rx="0.6" fill="#E2E8F0" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" role="img" aria-label="Platform" className={sizeClass}>
          <circle cx="12" cy="12" r="9" fill="currentColor" />
          <path
            fill="#FFFFFF"
            d="M12 6.5c3.4 0 6.17 2.67 6.17 5.96 0 3.3-2.77 5.97-6.17 5.97-3.4 0-6.17-2.68-6.17-5.97 0-3.29 2.77-5.96 6.17-5.96Zm0 1.52c-1.08 0-1.96 1.7-1.96 3.8 0 2.1.88 3.8 1.96 3.8s1.96-1.7 1.96-3.8c0-2.1-.88-3.8-1.96-3.8Zm-4.23 3.04c.22 0 .44.02.64.05-.05.33-.08.68-.08 1.05 0 .37.03.72.08 1.05-.2.03-.42.05-.64.05-.44 0-.85-.06-1.22-.18a4.22 4.22 0 0 1 0-1.84c.37-.12.78-.18 1.22-.18Zm8.46 0c.44 0 .85.06 1.22.18.08.3.12.6.12.92 0 .31-.04.62-.12.92-.37.12-.78.18-1.22.18-.22 0-.44-.02-.64-.05.05-.33.08-.68.08-1.05 0-.37-.03-.72-.08-1.05.2-.03.42-.05.64-.05Z"
          />
        </svg>
      );
  }
}

export function PlatformLogo({
  platform,
  size = "md",
  className = "",
}: PlatformLogoProps) {
  const normalizedPlatform = normalizePlatform(platform);
  const tileClassName = TILE_SIZE_CLASSES[size];
  const svgClassName = getSvgClassName(
    normalizedPlatform,
    SVG_SIZE_CLASSES[size],
  );
  const svgStyle = getSvgStyle(normalizedPlatform);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${tileClassName} ${getTileClassName(normalizedPlatform)} ${className}`.trim()}
    >
      <span style={svgStyle}>
        {renderPlatformSvg(normalizedPlatform, svgClassName)}
      </span>
    </span>
  );
}
