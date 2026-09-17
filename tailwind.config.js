/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Vesto Rich Palette ──────────────────────────────────
        // Ink / Navy (primary)
        "primary":                "#0A1628",   // deep ink navy
        "primary-container":      "#112240",   // midnight blue
        "on-primary":             "#FFFFFF",
        "on-primary-container":   "#7A9CC4",
        "primary-fixed":          "#D2E4FF",
        "primary-fixed-dim":      "#A8C4E8",
        "on-primary-fixed":       "#001d37",
        "on-primary-fixed-variant":"#2E4867",
        "inverse-primary":        "#A8C4E8",

        // Gold accent
        "tertiary":               "#7A4800",
        "tertiary-container":     "#5C3200",
        "tertiary-fixed":         "#FDF0D5",   // aged parchment
        "tertiary-fixed-dim":     "#E8B96A",   // warm gold light
        "on-tertiary":            "#FFFFFF",
        "on-tertiary-container":  "#C9922A",   // 18k gold
        "on-tertiary-fixed":      "#2B1700",
        "on-tertiary-fixed-variant":"#7A4800",

        // Secondary / slate
        "secondary":              "#4A5568",   // warmer slate
        "secondary-container":    "#E8EEF6",
        "secondary-fixed":        "#D5E3FC",
        "secondary-fixed-dim":    "#B9C7DF",
        "on-secondary":           "#FFFFFF",
        "on-secondary-container": "#3A485B",
        "on-secondary-fixed":     "#0d1c2e",
        "on-secondary-fixed-variant":"#3a485b",

        // Surfaces — warm parchment tones
        "background":             "#F8F6F1",   // warm parchment
        "surface":                "#F8F6F1",
        "surface-bright":         "#FEFCF8",   // cream
        "surface-card":           "#FEFCF8",   // cream cards
        "surface-container-lowest":"#FFFFFF",
        "surface-container-low":  "#F4F1EA",
        "surface-container":      "#EDE9DF",
        "surface-container-high": "#E6E2D8",
        "surface-container-highest":"#DDD9CF",
        "surface-variant":        "#E4E2D8",
        "surface-dim":            "#D8D5CB",
        "surface-tint":           "#3D5A80",
        "inverse-surface":        "#2C2C28",
        "inverse-on-surface":     "#F2F0E8",

        // Text
        "on-surface":             "#1A1A18",
        "on-surface-variant":     "#42464C",
        "on-background":          "#1A1A18",

        // Semantic
        "success-shamrock":       "#047857",   // deeper forest green
        "error":                  "#BA1A1A",
        "error-container":        "#FFDAD6",
        "on-error":               "#FFFFFF",
        "on-error-container":     "#93000A",

        // Borders & outline
        "outline":                "#74777E",
        "outline-variant":        "#C3C6C8",
        "border-subtle":          "#E8E4DA",   // warm border
        "border-strong":          "#C8C4BA",

        // Gold amber warning
        "warning-amber-soft":     "#FDF0D5",   // matches tertiary-fixed
      },
      borderRadius: {
        "DEFAULT": "0.375rem",
        "lg":  "0.625rem",
        "xl":  "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
        "full": "9999px"
      },
      boxShadow: {
        "card":  "0 1px 4px rgba(10,22,40,0.06), 0 4px 16px rgba(10,22,40,0.04)",
        "card-hover": "0 4px 16px rgba(10,22,40,0.10), 0 1px 4px rgba(10,22,40,0.06)",
        "nav":   "0 1px 0 rgba(10,22,40,0.10), 0 2px 8px rgba(10,22,40,0.06)",
        "hero":  "0 8px 32px rgba(10,22,40,0.18), 0 2px 8px rgba(10,22,40,0.12)",
        "gold":  "0 2px 12px rgba(201,146,42,0.18)",
        "xs":    "0 1px 2px rgba(10,22,40,0.05)",
      },
      spacing: {
        "spacing-2xs": "0.25rem",
        "spacing-xs":  "0.5rem",
        "spacing-sm":  "0.75rem",
        "spacing-md":  "1rem",
        "spacing-lg":  "1.25rem",
        "spacing-xl":  "1.5rem",
        "spacing-2xl": "2rem",
        "spacing-3xl": "2.5rem",
        "13": "3.25rem",
        "18": "4.5rem",
      },
      fontFamily: {
        sans:        ["DM Sans", "sans-serif"],
        "headline":  ["Space Grotesk", "sans-serif"],
        "mono":      ["JetBrains Mono", "Menlo", "monospace"],
        "numeric-metric":        ["Space Grotesk", "sans-serif"],
        "numeric-metric-mobile": ["Space Grotesk", "sans-serif"],
        "label-sm":  ["DM Sans", "sans-serif"],
        "label-lg":  ["DM Sans", "sans-serif"],
        "label-md":  ["DM Sans", "sans-serif"],
        "headline-md": ["Space Grotesk", "sans-serif"],
        "headline-xl": ["Space Grotesk", "sans-serif"],
        "headline-xl-mobile": ["Space Grotesk", "sans-serif"],
        "headline-lg": ["Space Grotesk", "sans-serif"],
        "headline-sm": ["Space Grotesk", "sans-serif"],
        "body-md":   ["DM Sans", "sans-serif"],
        "body-lg":   ["DM Sans", "sans-serif"],
        "body-sm":   ["DM Sans", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0A1628 0%, #112240 55%, #0F1E3A 100%)",
        "gold-gradient": "linear-gradient(135deg, #C9922A 0%, #E8B96A 100%)",
        "parchment":     "linear-gradient(180deg, #F8F6F1 0%, #FEFCF8 100%)",
      },
    }
  },
  plugins: [],
};
