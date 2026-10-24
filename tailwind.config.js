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
        // Stitch approved color scheme
        "forest": "#064E3B",
        "emerald": "#1E6B4F",
        "accent": "#A7D977",
        "cream": "#F8F7E9",
        "cream-light": "#E8F3E6",
        "dark-text": "#12372A",

        // Stitch Design System Tokens
        "primary": "#003527",
        "primary-container": "#064e3b",
        "primary-fixed": "#b0f0d6",
        "primary-fixed-dim": "#95d3ba",
        "on-primary": "#ffffff",
        "on-primary-container": "#80bea6",
        "on-primary-fixed": "#002117",
        "on-primary-fixed-variant": "#0b513d",

        "secondary": "#1d6b4f",
        "secondary-container": "#a7f2ce",
        "secondary-fixed": "#a7f2ce",
        "secondary-fixed-dim": "#8cd6b3",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#257154",
        "on-secondary-fixed": "#002115",
        "on-secondary-fixed-variant": "#005139",

        "tertiary": "#1a3400",
        "tertiary-container": "#284d00",
        "tertiary-fixed": "#bef28d",
        "tertiary-fixed-dim": "#a3d574",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#8fbf61",
        "on-tertiary-fixed": "#0e2000",
        "on-tertiary-fixed-variant": "#2a5000",

        "surface": "#e7fff2",
        "surface-bright": "#e7fff2",
        "surface-dim": "#bbe3d0",
        "surface-variant": "#c3ebd8",
        "surface-container": "#cff7e3",
        "surface-container-low": "#d4fde9",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#c9f1de",
        "surface-container-highest": "#c3ebd8",
        "surface-tint": "#2b6954",

        "background": "#e7fff2",
        "on-background": "#002116",
        "on-surface": "#002116",
        "on-surface-variant": "#404944",
        "inverse-surface": "#12372a",
        "inverse-on-surface": "#d1fae6",
        "inverse-primary": "#95d3ba",

        "outline": "#707974",
        "outline-variant": "#bfc9c3",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
        heading: ["'Space Grotesk'", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
        "gutter": "1.5rem",
        "gutter-mobile": "1rem",
        "margin": "3rem",
        "margin-tablet": "2rem",
        "margin-mobile": "1.25rem",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      }
    },
  },
  plugins: [],
}
