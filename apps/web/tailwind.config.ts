import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── InsightFlow New Design System Tokens ─────────────── */
        primary: "#4234B6",
        "primary-container": "#5B4FCF",
        secondary: "#5F52A8",
        "secondary-container": "#B0A2FF",
        tertiary: "#4536AE",
        error: "#BA1A1A",
        "error-container": "#FFDAD6",
        background: "#FAF8FF",
        surface: "#FAF8FF",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F4F3FA",
        "surface-container": "#EEEDF4",
        "surface-container-high": "#E9E7EE",
        "on-surface": "#1A1B20",
        "on-surface-variant": "#474554",
        outline: "#787585",
        "outline-variant": "#C8C4D6",
        "footer-bg": "#24106B",

        /* ── Semantic CSS-Variable tokens (Dark Mode-aware) ────── */
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
        "max-container": "1440px",
        "stack-gap": "16px",
        "edge-margin": "24px",
        "section-gap": "80px",
        gutter: "20px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      fontSize: {
        "headline-lg-mobile": [
          "24px",
          { lineHeight: "32px", fontWeight: "700" },
        ],
        "label-xs": ["12px", { lineHeight: "16px", fontWeight: "600" }],
        "label-sm": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
        "hero-lg": [
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
        sm: "0px 4px 20px rgba(30, 31, 36, 0.08)",
        hover: "0px 8px 30px rgba(30, 31, 36, 0.12)",
      },
      borderRadius: {
        xl: "16px",
        lg: "12px",
        md: "8px",
      }
    },
  },
  plugins: [],
};
export default config;
