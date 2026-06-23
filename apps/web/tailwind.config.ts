import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  /**
   * darkMode: 'class' — class="dark" on <html> toggles Dark Mode.
   * ThemeContext.tsx manages this class + persists to localStorage.
   */
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── Material Design 3 tokens (giữ nguyên) ─────────────── */
        surface: "#f9f9ff",
        "surface-dim": "#cfdaf2",
        "surface-bright": "#f9f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f3ff",
        "surface-container": "#e7eeff",
        "surface-container-high": "#dee8ff",
        "surface-container-highest": "#d8e3fb",
        "on-surface": "#111c2d",
        "on-surface-variant": "#464554",
        "inverse-surface": "#263143",
        "inverse-on-surface": "#ecf1ff",
        outline: "#767586",
        "outline-variant": "#c7c4d7",
        "surface-tint": "#494bd6",
        primary: "#4648d4",
        "on-primary": "#ffffff",
        "primary-container": "#6063ee",
        "on-primary-container": "#fffbff",
        "inverse-primary": "#c0c1ff",
        secondary: "#4b41e1",
        "on-secondary": "#ffffff",
        "secondary-container": "#645efb",
        "on-secondary-container": "#fffbff",
        tertiary: "#904900",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#b55d00",
        "on-tertiary-container": "#fffbff",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#e1e0ff",
        "primary-fixed-dim": "#c0c1ff",
        "on-primary-fixed": "#07006c",
        "on-primary-fixed-variant": "#2f2ebe",
        "secondary-fixed": "#e2dfff",
        "secondary-fixed-dim": "#c3c0ff",
        "on-secondary-fixed": "#0f0069",
        "on-secondary-fixed-variant": "#3323cc",
        "tertiary-fixed": "#ffdcc5",
        "tertiary-fixed-dim": "#ffb783",
        "on-tertiary-fixed": "#301400",
        "on-tertiary-fixed-variant": "#703700",
        background: "#f9f9ff",
        "on-background": "#111c2d",
        "surface-variant": "#d8e3fb",

        /* ── Semantic CSS-Variable tokens (Dark Mode-aware) ──────
           Dùng các class này trong component để tự động đồng bộ
           khi chuyển đổi Light/Dark Mode.                         */
        "app-bg": "var(--color-bg-primary)",
        "app-surface": "var(--color-bg-surface)",
        "app-surface-raised": "var(--color-bg-surface-raised)",
        "app-surface-high": "var(--color-bg-surface-high)",
        "app-border": "var(--color-border)",
        "app-border-strong": "var(--color-border-strong)",
        "app-text": "var(--color-text-primary)",
        "app-text-secondary": "var(--color-text-secondary)",
        "app-text-muted": "var(--color-text-muted)",
        "app-brand": "var(--color-brand)",
        "app-brand-subtle": "var(--color-brand-subtle)",

        /* ── Chart tokens ──────────────────────────────────────── */
        "chart-positive": "var(--chart-positive)",
        "chart-negative": "var(--chart-negative)",
        "chart-neutral": "var(--chart-neutral)",
      },
      spacing: {
        "max-container": "1200px",
        "stack-gap": "16px",
        "edge-margin": "24px",
        "section-gap": "80px",
        gutter: "20px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        "headline-lg-mobile": [
          "24px",
          { lineHeight: "32px", fontWeight: "700" },
        ],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
        "display-lg": [
          "48px",
          { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "label-md": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" },
        ],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
      },
      boxShadow: {
        soft: "0px 4px 12px rgba(36, 16, 107, 0.04)",
        hover: "0px 8px 24px rgba(36, 16, 107, 0.08)",
        "card-dark": "0px 4px 20px -2px rgba(0, 0, 0, 0.30)",
      },
    },
  },
  plugins: [],
};
export default config;
