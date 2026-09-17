import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      colors: {
        ink: "var(--ink)",
        lagoon: "var(--lagoon)",
        paper: "var(--paper)",
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)"
        },
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          raised: "var(--surface-raised)"
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)"
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          muted: "var(--sidebar-muted)",
          line: "var(--sidebar-line)"
        },
        muted: {
          DEFAULT: "var(--text-muted)",
          subtle: "var(--text-subtle)"
        },
        danger: "var(--danger)",
        warning: "var(--warning)",
        success: "var(--success)"
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)"
      },
      borderRadius: {
        xl2: "0.75rem"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
