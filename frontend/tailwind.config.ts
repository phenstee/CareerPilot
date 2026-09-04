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
        coral: "var(--coral)",
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
        ai: {
          DEFAULT: "var(--ai)",
          soft: "var(--ai-soft)",
          deep: "var(--ai-deep)"
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
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03)",
        lift: "0 12px 30px rgba(24, 20, 42, 0.10), 0 3px 8px rgba(24, 20, 42, 0.06)",
        glow: "0 0 0 3px rgba(86, 100, 245, 0.14)"
      },
      borderRadius: {
        xl2: "1rem"
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
