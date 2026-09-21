/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    // ── Optical spacing scale (6px base, intentional non-even steps) ──
    spacing: {
      px:   "1px",
      0:    "0px",
      0.5:  "2px",
      1:    "3px",    // micro — icon gap, tight label spacing
      1.5:  "5px",
      2:    "6px",    // base unit
      2.5:  "8px",
      3:    "10px",   // compact padding
      3.5:  "12px",
      4:    "14px",   // default gap
      5:    "18px",   // card padding tight
      6:    "22px",   // card padding comfortable
      7:    "28px",   // section gap
      8:    "32px",
      9:    "38px",
      10:   "40px",   // generous section gap
      11:   "46px",
      12:   "52px",
      13:   "56px",
      14:   "60px",
      16:   "68px",   // hero padding
      18:   "76px",   // navbar height
      20:   "84px",
      24:   "100px",
      28:   "120px",
      32:   "140px",
      36:   "160px",
      40:   "180px",
      48:   "220px",
      56:   "260px",
      64:   "300px",
      72:   "340px",
      80:   "380px",
      96:   "440px",
    },
    extend: {
      colors: {
        // ── Vesto Palette ── intentionally desaturated, never pure black/white
        // Ink (primary) — blue-black, not pure black
        ink:          "#0D1824",   // deepened ink — more blue-black than #0A1628
        "ink-2":      "#1A2A3E",   // mid ink
        "ink-3":      "#243447",   // lifted ink — for hover states on dark bg

        // Canvas (background) — aged paper, never pure white
        canvas:       "#F5F2EC",   // cooler than before — more intentional
        "canvas-2":   "#EFEBE3",   // slightly darker canvas for recessed areas
        cream:        "#FDFAF5",   // lightest surface — elevated cards
        "cream-2":    "#F9F6F0",   // card surface

        // Gold — the only warm colour in the palette, must earn its place
        gold:         "#B8821E",   // deeper, less orange — more like aged 22k
        "gold-2":     "#D4A032",   // mid gold — CTA hover
        "gold-3":     "#E9BE68",   // light gold — gradients, glows
        "gold-bg":    "#FBF0D8",   // extremely subtle gold tint for backgrounds
        "gold-border":"rgba(184,130,30,0.22)", // gold border, restrained

        // Slate (secondary text, labels)
        slate:        "#3D4A5C",   // warm slate — not cold grey
        "slate-2":    "#5E6E82",   // mid slate
        "slate-3":    "#8A98A8",   // light slate — placeholders, tertiary

        // Semantic — muted, never saturated primaries
        success:      "#1A6645",   // dark forest — money positive
        "success-bg": "#EBF5F0",
        warning:      "#8C5A00",
        "warning-bg": "#FBF0D8",
        danger:       "#8C1A1A",
        "danger-bg":  "#FBE8E8",
        info:         "#1A3A5C",
        "info-bg":    "#E8EFF8",

        // Borders — warm, never cool grey
        border:       "rgba(13,24,36,0.09)",
        "border-2":   "rgba(13,24,36,0.16)",
        "border-3":   "rgba(13,24,36,0.28)",

        // Legacy aliases — keep old class names working during transition
        "primary":                "#0D1824",
        "primary-container":      "#1A2A3E",
        "secondary":              "#3D4A5C",
        "background":             "#F5F2EC",
        "surface":                "#F5F2EC",
        "surface-card":           "#FDFAF5",
        "surface-bright":         "#FDFAF5",
        "surface-container-lowest":"#FFFFFF",
        "surface-container-low":  "#EFEBE3",
        "surface-container":      "#E8E3D9",
        "on-surface":             "#0D1824",
        "on-surface-variant":     "#3D4A5C",
        "success-shamrock":       "#1A6645",
        "error":                  "#8C1A1A",
        "border-subtle":          "rgba(13,24,36,0.09)",
        "on-primary":             "#FFFFFF",
      },

      borderRadius: {
        // Intentionally off-grid radii — nothing is a round 8/16/24
        "none":  "0",
        "micro": "3px",    // tight — pill text on dark bg, small tags
        "sm":    "5px",    // inputs, small buttons
        DEFAULT: "7px",    // default interactive elements
        "md":    "11px",   // cards, modals
        "lg":    "15px",   // large cards
        "xl":    "20px",   // hero sections, large modals
        "2xl":   "28px",   // pill buttons
        "3xl":   "40px",   // floating elements
        "full":  "9999px",
      },

      boxShadow: {
        // ── 5-level elevation system ──
        // Each level: tight shadow (crisp edge) + soft ambient (depth)
        // All tinted with ink, never pure black
        "e0":  "none",
        "e1":  "0 1px 2px rgba(13,24,36,0.06), 0 1px 4px rgba(13,24,36,0.04)",
        "e2":  "0 1px 3px rgba(13,24,36,0.08), 0 3px 10px rgba(13,24,36,0.06)",
        "e3":  "0 2px 6px rgba(13,24,36,0.10), 0 6px 20px rgba(13,24,36,0.07)",
        "e4":  "0 4px 12px rgba(13,24,36,0.12), 0 12px 36px rgba(13,24,36,0.09)",
        "e5":  "0 8px 24px rgba(13,24,36,0.16), 0 24px 60px rgba(13,24,36,0.10)",
        // Semantic
        "card":       "0 1px 3px rgba(13,24,36,0.08), 0 3px 10px rgba(13,24,36,0.06)",
        "card-hover": "0 2px 6px rgba(13,24,36,0.10), 0 8px 24px rgba(13,24,36,0.08)",
        "gold":       "0 2px 8px rgba(184,130,30,0.20), 0 1px 3px rgba(184,130,30,0.14)",
        "gold-lg":    "0 4px 20px rgba(184,130,30,0.26), 0 2px 6px rgba(184,130,30,0.18)",
        "hero":       "0 8px 32px rgba(13,24,36,0.22), 0 2px 8px rgba(13,24,36,0.14)",
        "nav":        "0 1px 0 rgba(13,24,36,0.08), 0 2px 12px rgba(13,24,36,0.06)",
        "inset":      "inset 0 1px 3px rgba(13,24,36,0.08)",
      },

      fontFamily: {
        sans:     ["DM Sans", "system-ui", "sans-serif"],
        display:  ["Space Grotesk", "sans-serif"],
        mono:     ["JetBrains Mono", "Menlo", "Consolas", "monospace"],
        // Legacy aliases
        headline: ["Space Grotesk", "sans-serif"],
        "headline-md": ["Space Grotesk", "sans-serif"],
        "headline-xl": ["Space Grotesk", "sans-serif"],
        "headline-lg": ["Space Grotesk", "sans-serif"],
        "headline-sm": ["Space Grotesk", "sans-serif"],
        "body-md":   ["DM Sans", "sans-serif"],
        "body-lg":   ["DM Sans", "sans-serif"],
        "body-sm":   ["DM Sans", "sans-serif"],
        "label-sm":  ["DM Sans", "sans-serif"],
        "label-md":  ["DM Sans", "sans-serif"],
        "label-lg":  ["DM Sans", "sans-serif"],
      },

      fontSize: {
        // ── Optical type scale ── not mathematically perfect, optically right
        "2xs":  ["10px",  { lineHeight: "14px", letterSpacing: "0.02em" }],
        "xs":   ["11px",  { lineHeight: "16px", letterSpacing: "0.01em" }],
        "sm":   ["13px",  { lineHeight: "19px", letterSpacing: "0.003em" }],
        "base": ["15px",  { lineHeight: "22px", letterSpacing: "0em" }],
        "md":   ["16px",  { lineHeight: "24px", letterSpacing: "-0.005em" }],
        "lg":   ["18px",  { lineHeight: "26px", letterSpacing: "-0.010em" }],
        "xl":   ["21px",  { lineHeight: "28px", letterSpacing: "-0.015em" }],
        "2xl":  ["24px",  { lineHeight: "30px", letterSpacing: "-0.020em" }],
        "3xl":  ["28px",  { lineHeight: "34px", letterSpacing: "-0.025em" }],
        "4xl":  ["34px",  { lineHeight: "40px", letterSpacing: "-0.030em" }],
        "5xl":  ["42px",  { lineHeight: "48px", letterSpacing: "-0.035em" }],
        "6xl":  ["52px",  { lineHeight: "56px", letterSpacing: "-0.040em" }],
        "7xl":  ["64px",  { lineHeight: "68px", letterSpacing: "-0.045em" }],
        "8xl":  ["80px",  { lineHeight: "84px", letterSpacing: "-0.050em" }],
      },

      lineHeight: {
        "hero":    "0.95",   // tightest — large display numbers
        "display": "1.02",   // headlines
        "tight":   "1.15",   // subheadings
        "snug":    "1.30",   // compact body
        "normal":  "1.50",   // default body
        "relaxed": "1.65",   // long-form reading
        "loose":   "1.80",   // max breathing room
      },

      letterSpacing: {
        "tightest": "-0.050em",
        "tighter":  "-0.035em",
        "tight":    "-0.020em",
        "snug":     "-0.010em",
        "normal":   "0em",
        "wide":     "0.010em",
        "wider":    "0.025em",
        "widest":   "0.080em",
        "caps":     "0.120em",   // for all-caps labels
      },

      transitionDuration: {
        "instant": "80ms",
        "fast":    "140ms",
        "base":    "200ms",
        "slow":    "320ms",
        "slower":  "480ms",
        "crawl":   "700ms",
      },

      transitionTimingFunction: {
        // Spring approximations using cubic-bezier
        "spring":        "cubic-bezier(0.34, 1.48, 0.64, 1)",   // gentle overshoot — for scale
        "spring-soft":   "cubic-bezier(0.25, 1.20, 0.50, 1)",   // softer spring — for opacity/translate
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",       // snappy deceleration
        "ease-in-expo":  "cubic-bezier(0.7, 0, 0.84, 0)",       // sharp acceleration
        "ease-out-quart":"cubic-bezier(0.25, 1, 0.5, 1)",       // smooth deceleration
        "ease-in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)",  // symmetric smooth
      },

      backgroundImage: {
        "ink-gradient":  "linear-gradient(160deg, #0D1824 0%, #1A2A3E 55%, #131E30 100%)",
        "gold-gradient": "linear-gradient(135deg, #B8821E 0%, #D4A032 45%, #E9BE68 100%)",
        "canvas-gradient":"linear-gradient(180deg, #F5F2EC 0%, #FDFAF5 100%)",
        "noise":         "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
      },

      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(184,130,30,0)" },
          "50%":      { boxShadow: "0 0 0 6px rgba(184,130,30,0.16)" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "stagger-1": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      animation: {
        "fade-up":    "fade-up 240ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in":    "fade-in 200ms cubic-bezier(0.25, 1, 0.5, 1) both",
        "scale-in":   "scale-in 200ms cubic-bezier(0.34, 1.48, 0.64, 1) both",
        "slide-up":   "slide-up 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "shimmer":    "shimmer 1.6s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2.4s ease-in-out infinite",
        "spin-slow":  "spin-slow 3s linear infinite",
        // Staggered entrance variants
        "fade-up-1":  "fade-up 240ms 60ms  cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-up-2":  "fade-up 240ms 120ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-up-3":  "fade-up 240ms 180ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-up-4":  "fade-up 240ms 240ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-up-5":  "fade-up 240ms 300ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    }
  },
  plugins: [],
};
