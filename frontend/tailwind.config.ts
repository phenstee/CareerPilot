import type { Config } from "tailwindcss";

// Colors are RGB triplets in app/globals.css so opacity modifiers
// (e.g. `bg-accent/10`) work. See redesign/design-system.md §3.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    borderRadius: {
      none: "0",
      sm: "6px",
      DEFAULT: "8px",
      md: "8px",
      lg: "10px",
      xl: "14px",
      "2xl": "16px",
      "3xl": "24px",
      full: "9999px"
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"]
      },
      fontSize: {
        meta: ["0.8125rem", { lineHeight: "1.125rem" }],
        body: ["0.9375rem", { lineHeight: "1.5rem" }],
        wordmark: ["1.375rem", { lineHeight: "1", letterSpacing: "-0.01em" }],
        count: ["1.375rem", { lineHeight: "1.75rem" }],
        micro: ["0.625rem", { lineHeight: "1rem" }],
        "display-1": [
          "clamp(2.5rem, 5.2vw, 4rem)",
          { lineHeight: "1.04", letterSpacing: "-0.025em" }
        ],
        "display-2": [
          "clamp(1.75rem, 3.2vw, 2.5rem)",
          { lineHeight: "1.1", letterSpacing: "-0.015em" }
        ],
        "title-1": [
          "clamp(1.625rem, 2.6vw, 2.125rem)",
          { lineHeight: "1.15", letterSpacing: "-0.015em" }
        ]
      },
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        sunken: token("sunken"),
        line: {
          DEFAULT: token("line"),
          ui: token("line-ui"),
          strong: token("line-strong")
        },
        ink: {
          DEFAULT: token("ink"),
          2: token("ink-2")
        },
        muted: token("muted"),
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          deep: token("accent-deep"),
          subtle: token("accent-subtle")
        },
        highlight: {
          DEFAULT: token("highlight"),
          subtle: token("highlight-subtle")
        },
        cream: {
          DEFAULT: token("cream"),
          muted: token("cream-muted")
        },
        warning: {
          DEFAULT: token("warning"),
          subtle: token("warning-subtle")
        },
        danger: {
          DEFAULT: token("danger"),
          subtle: token("danger-subtle"),
          hover: token("danger-hover")
        },
        success: {
          DEFAULT: token("success"),
          subtle: token("success-subtle")
        },
        stage: {
          prep: token("stage-prep"),
          "prep-tint": token("stage-prep-tint"),
          applied: token("stage-applied"),
          "applied-tint": token("stage-applied-tint"),
          interview: token("stage-interview"),
          "interview-tint": token("stage-interview-tint"),
          offer: token("stage-offer"),
          "offer-tint": token("stage-offer-tint"),
          rejected: token("stage-rejected"),
          "rejected-tint": token("stage-rejected-tint")
        }
      },
      minHeight: {
        control: "38px"
      },
      height: {
        control: "38px",
        chip: "22px",
        bar: "60px"
      },
      maxWidth: {
        app: "80rem",
        narrow: "60rem",
        marketing: "70rem"
      },
      maxHeight: {
        /** Scrolling pick lists (job picker). */
        list: "34rem"
      },
      gridTemplateColumns: {
        /** Fixed side column plus flexible main column. */
        sidebar: "18rem minmax(0, 1fr)",
        /** Main content slightly wider than its companion panel. */
        split: "minmax(0, 1.3fr) minmax(0, 1fr)",
        /** Leading element (tile, number) plus content. */
        lead: "auto minmax(0, 1fr)",
        /** Leading element, content, trailing action. */
        "lead-trail": "auto minmax(0, 1fr) auto",
        /** Line-number gutter plus text. */
        gutter: "1.75rem minmax(0, 1fr)"
      },
      ringWidth: {
        3: "3px"
      },
      padding: {
        track: "3px"
      },
      boxShadow: {
        hover: "0 6px 18px -8px rgb(28 27 23 / 0.25)",
        overlay:
          "0 12px 32px -8px rgb(28 27 23 / 0.25), 0 1px 2px rgb(28 27 23 / 0.08)",
        pill: "0 1px 2px rgb(28 27 23 / 0.1)"
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.2, 0.7, 0.2, 1)"
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" }
        },
        rise: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        pulse: "pulse 1.6s ease-in-out infinite",
        rise: "rise 160ms cubic-bezier(0.2, 0.7, 0.2, 1)"
      }
    }
  },
  plugins: []
};

export default config;
