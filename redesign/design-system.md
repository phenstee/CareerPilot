# CareerPilot design system

Phase 2 proposal. One direction, argued below. Nothing in the app changes until you approve it.
Mockup: `redesign/mockup/index.html` (open it in a browser), with screenshots in `redesign/mockup/*.png`.

---

## 1. The direction: "a tracker, not a landing page"

CareerPilot is a pipeline tool. A student opens it to answer three questions: *what's due, where does each application stand, and what should I prepare next.* The current UI hides those answers behind decoration: icon tiles, eyebrows, nested cards and AI sparkles.

The direction is to **let the pipeline be the product**, the way Odoo's CRM does. The kanban board, the list and the deadline column carry the interface, and everything else gets quieter.

**What I'm taking from Odoo CRM (your reference).** odoo.com blocks automated access, so I couldn't load the page from here. This section draws on Odoo CRM's well-known product patterns, not a pixel study. If there's a specific screen or section you like, send a screenshot and I'll fold it in.

1. **The board is the dashboard.** Each column header carries the summary: stage name, count, and a thin bar. You don't need separate stat cards above it.
2. **One control bar per list page.** The title and primary action sit on the left. Search and filters sit in the middle. The view switch (Board / Table) sits on the right. The same bar appears on every list page.
3. **Dense, quiet record cards.** Each card has a title, a secondary line and one row of metadata. State shows as a small colored dot or text, never a filled pill on every card. No shadows.
4. **Real product on the marketing page.** The hero visual is the actual board UI with sample data, labeled as sample data. Copy says what each screen does.

**What I'm not taking:** Odoo's plum brand color (too close to the purple you want gone), its hand-drawn highlighter strokes and doodles (charming once, now a template trope), and its feature mega-grid.

**Why this beats the alternatives.** A more "editorial" magazine look would suit the marketing page and fight the app, which is mostly lists and forms. A pure Linear-style dark tool would feel cold for students. Pipeline-first with one serif for titles gives the app real density and still has enough character to not look generated.

---

## 2. Typography

**Pairing: Newsreader (titles) + IBM Plex Sans (everything else).** Both are on Google Fonts and load through `next/font/google`, which ships with Next.js, so there's **no new npm dependency**. Fonts download at build time.

- **IBM Plex Sans** for UI and body. It has more character than Inter, which is the default font of every generated app. It stays very legible at 13 to 14px, has true tabular figures for counts and dates, and its slightly engineered shapes suit a tool for tech students.
- **Newsreader** (500 weight) only for page titles and marketing headlines. One serif at the top of each page gives the editorial, considered feel with no decoration. It is never used for body text, buttons or data.
- No uppercase tracked eyebrows anywhere. Sentence case everywhere. Hierarchy comes from size, weight and space.

| Token | Font | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display-1` | Newsreader | 56 / 60 (mobile 40 / 44) | 500 | -0.02em | Landing hero only |
| `display-2` | Newsreader | 36 / 42 (mobile 28 / 34) | 500 | -0.015em | Landing section headings |
| `title-1` | Newsreader | 28 / 34 (mobile 24 / 30) | 500 | -0.01em | In-app page title (one per page) |
| `title-2` | Plex Sans | 18 / 26 | 600 | 0 | Section headings in-app |
| `title-3` | Plex Sans | 14 / 20 | 600 | 0 | Card titles, column headers, table emphasis |
| `body-lg` | Plex Sans | 18 / 28 | 400 | 0 | Marketing body |
| `body` | Plex Sans | 14 / 22 | 400 | 0 | Default in-app text, inputs, buttons |
| `body-sm` | Plex Sans | 13 / 18 | 400 | 0 | Metadata, table cells, hints |
| `label` | Plex Sans | 13 / 18 | 500 | 0 | Form labels, nav items, button text (sm) |
| `caption` | Plex Sans | 12 / 16 | 500 | 0 | Table headers, badges, counts |

Weights in use: 400, 500, 600. No 700, and no bold-everything. Numbers in tables, counts and dates use `font-variant-numeric: tabular-nums`.

---

## 3. Color

Neutral, slightly warm-grey canvas with **one accent: deep pine green**. Green reads as "on track / go" without being the default blue SaaS accent, and it doesn't collide with the purple/indigo you want gone. The accent is used only for primary actions, the active nav item, focus rings and links. It is never decoration.

All text pairs meet WCAG AA (4.5:1). Input borders and focus rings meet 3:1 non-text contrast. I computed every ratio below.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `canvas` | `#F7F7F5` | Page background | |
| `surface` | `#FFFFFF` | Cards, inputs, top bar, tables | |
| `surface-sunken` | `#F0F0EC` | Kanban columns, table header, code/preview wells | |
| `border` | `#E3E3DE` | Hairline dividers, card outlines (decorative) | |
| `border-strong` | `#8C8C84` | Input and checkbox boundaries | 3.39 on surface, 3.16 on canvas |
| `text-primary` | `#1B1B18` | Headings, body | 16.1 on canvas |
| `text-secondary` | `#4A4A44` | Secondary lines, inactive nav | 8.3 on canvas |
| `text-muted` | `#66665E` | Metadata, hints, captions | 5.4 canvas / 5.8 surface / 5.1 sunken |
| `accent` | `#1F5C4A` | Primary button, links, active nav, focus | 7.8 white-on-accent, 7.3 on canvas |
| `accent-hover` | `#174538` | Primary hover/pressed | 10.8 white-on |
| `accent-subtle` | `#E7F0EC` | Selected row/card background | accent text on it 6.7 |
| `success` / `success-subtle` | `#1D6B3B` / `#E7F2EB` | Saved, offer, completed | 5.7 |
| `warning` / `warning-subtle` | `#8A5200` / `#FBF0DC` | Stale results, deadlines within 3 days | 5.7 |
| `danger` / `danger-subtle` | `#B3261E` / `#FBEAE8` | Errors, destructive actions | 5.6 (6.5 on white) |

**Stage colors** are dots only, always next to a text label, so they need 3:1 not 4.5:1:

| Stage | Dot |
|---|---|
| Saved, Preparing, Withdrawn | `#84847C` (neutral) |
| Applied | `#3D6A99` (5.7) |
| Online assessment, Interview | `#B06A00` (4.3) |
| Offer | `#1E7B45` (5.3) |
| Rejected | `#B3261E` (6.5) |

Rules:
- Red means something failed or will be destroyed. "Generate the role analysis first" is a neutral hint, and "this result is out of date" is `warning`.
- No gradients, no tinted icon squares, no colored section bands. The marketing page alternates `canvas` and `surface` at most.
- Tokens are defined as CSS variables with Tailwind `<alpha-value>` support (`rgb(var(--accent) / <alpha-value>)`), so opacity modifiers actually work this time.

---

## 4. Space, radius, borders, shadow

- **Spacing:** 4px base. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96 (Tailwind 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24). No arbitrary values. In-app sections are 32 apart, marketing sections 96 (64 on mobile).
- **Radius:** `4px` for buttons, inputs, badges and chips. `6px` for cards, menus and popovers. `8px` for dialogs. `full` for avatars and dots only. Nothing is `rounded-2xl`.
- **Borders:** 1px `border` hairlines do the separating. A section is a heading plus whitespace plus, where needed, a divider, not a box. Boxes are reserved for **records** (an application card, a job row group), **inputs** and **overlays**.
- **Shadows:** one token, `shadow-overlay: 0 8px 24px rgb(27 27 24 / 0.12), 0 1px 2px rgb(27 27 24 / 0.08)`, used only for menus, dialogs and toasts. Cards have no shadow, and hover changes only the border color.

---

## 5. Components

One version of each, in `components/ui/`. Everything interactive is a real `<button>` or `<a>`, with a visible focus ring: `outline: 2px solid accent; outline-offset: 2px`.

### Buttons
| Variant | Default | Hover | Notes |
|---|---|---|---|
| Primary | `accent` bg, white text | `accent-hover` | At most one per view |
| Secondary | `surface` bg, 1px `#CFCFC8` border, `text-primary` | `surface-sunken` bg | The workhorse |
| Ghost | transparent, `text-secondary` | `surface-sunken` bg, `text-primary` | Toolbars, tertiary actions |
| Destructive | `surface` bg, `danger` text, `danger` 40% border | `danger-subtle` bg | Filled `danger` only inside the confirm dialog |

Sizes: `sm` 32px (toolbars, table rows), `md` 36px (default), `lg` 44px (marketing CTAs, and the minimum touch size on mobile primary actions). Label is `label`/`body` weight 500. An icon is optional, 16px, leading, and only when it adds meaning (external link, delete). Loading replaces the icon with a 16px spinner, keeps the width and disables the button.

### Inputs
36px tall, 1px `border-strong`, radius 4, `surface` bg. Focus: border `accent` plus a 3px ring `accent / 0.2`. Label above (`label`), hint below (`body-sm`, `text-muted`), error below in `danger` with `aria-invalid` and `aria-describedby`. Every input has a visible label, including filter fields, where the label is visually small but present. Selects and date inputs share the same box. Textareas have a minimum of 4 rows and resize vertically.

### Cards
Only for records. 1px `border`, radius 6, padding 12 (dense board card) or 16. No shadow, no icon tile. Title is `title-3`, then a secondary line, then one metadata row in `body-sm`/`text-muted`. Hover: border `#CFCFC8`. The whole card is the link, with one focus ring around it.

### Tables and lists
- **Table:** `surface` bg, header row `surface-sunken`, `caption` text in sentence case (not uppercase), rows 44px with 1px dividers, hover `surface-sunken`. The first column is the link. Numbers and dates are right-aligned and tabular. Wide tables scroll horizontally inside their own container, never the page.
- **List:** the same row anatomy without the header. Used on the dashboard and in job pickers.

### Navigation
- **Desktop:** a 56px top bar on `surface` with a bottom hairline. From the left: wordmark, then Dashboard, Applications, Jobs, Prepare, Profile. Account menu on the right (name, Settings, Sign out). Active item: `text-primary` with a 2px `accent` underline. Inactive: `text-secondary`.
- **Why top bar instead of the sidebar:** the board needs width. The current 256px sidebar is the reason `/applications` overflows at 1440px.
- **Mobile (<768px):** the same bar with the wordmark and a menu button, which opens a full-height sheet with the same links plus a dimmed backdrop. Escape closes it and focus is trapped inside.
- **Grouping:** the four AI pages become one "Prepare" section with tabs (Find jobs, Draft application, Interview prep). Profile and Resume become tabs under "Profile". **Routes don't change.** Only the nav labels and grouping do (see §8 copy changes).

### Page header
`title-1` (serif) on the left, with an optional one-line description in `text-secondary`. Actions sit on the right on the **same row** at ≥768px, and wrap below on mobile. No eyebrow. Detail pages get a text breadcrumb above the title ("Applications / Backend Engineering Intern") in place of an "All applications" button.

### Status and badges
- **Stage:** dot plus text ("● Interview"). No pill background.
- **Badge** (for meta like "Sample", "Stale", "Internship"): `caption`, radius 4, `surface-sunken` bg, `text-secondary`. Tones `warning`, `danger` and `success` use their subtle bg and strong text.

### Empty states
Left-aligned inside the space the content would occupy. A `title-3` line that says what's missing, one sentence on what to do, and one button. No icon circle, no illustration, no dashed box. Filtered-to-nothing is a separate state: "No applications match these filters," with a "Clear filters" button.

### Loading states
- **Lists and boards:** skeleton rows or cards in the final layout's shape (`surface-sunken` blocks). A gentle opacity pulse, which becomes static under `prefers-reduced-motion`.
- **Buttons:** an inline spinner (see Buttons).
- **AI tasks:** an inline status line under the action, "Queued, Generating…, Done", with the retry count when retrying. Neutral styling, `danger` only on failure.
- No full-page spinners.

### Errors
An inline callout at the top of the affected region: `danger-subtle` bg, `danger` text, one sentence on what failed, and a "Try again" button that refetches. Field-level errors sit under the field. Page-level crashes use `app/error.tsx` in the same style.

### Toasts
Only for confirming an action whose result isn't visible on screen (e.g., "Application deleted"). Bottom-right on desktop, bottom-center on mobile. `text-primary` bg, white text, radius 6, `shadow-overlay`. 4 seconds, dismissible, `role="status"`. Built in-house, no library.

### Dialogs
Native `<dialog>` (no dependency), radius 8, `shadow-overlay`, backdrop `text-primary / 0.4`. Used for delete confirmations (approved): title "Delete this application?", one sentence on what's lost, Cancel (secondary) and Delete (filled danger). Focus starts on Cancel.

### Motion
Color and border transitions take 120ms ease-out. Menus, sheets and dialogs fade in with a 4px rise over 160ms. A board card moving stage: no animation (it isn't drag and drop). Nothing animates on page load. Everything is disabled under `prefers-reduced-motion`.

---

## 6. Layout

| | Marketing (`/`, `/login`, `/register`) | App (everything else) |
|---|---|---|
| Max width | 1120px | 1280px (board and tables can use the full width) |
| Reading width | 640px for paragraphs | 720px for forms and long text |
| Grid | 12 columns, 24px gutter | 12 columns, 24px gutter, 4 columns / 16px on mobile |
| Side gutter | 16px <640, 24px ≥640, 32px ≥1024 | Same |
| Base text | 18px body | 14px body, 13px metadata |
| Section spacing | 96px (64 mobile) | 32px between sections, 16px within |
| Density | Generous: one idea per screen-height | Real density: a full pipeline visible at 1440×900 |

Responsive floor is 360px. The board becomes a horizontal snap-scroller of 280px columns with the stage counts visible in a sticky tab strip above it. Tables scroll inside their container. No page-level horizontal scroll at any width (verified at 360, 390, 768, 1024 and 1440 before sign-off).

---

## 7. Key screens

The first three are built in the mockup. The fourth is described here.

### A. Applications (`/applications`)
- Header row: "Applications" (serif), the count "4 tracked" in `text-muted`, and an **Add job** primary button on the right.
- Control bar: search (company or role) on the left, Stage and Applied-date filters as compact controls, and a Board/Table segmented switch on the right.
- Board: one column per visible stage, `surface-sunken` background, radius 6. Each column header shows the stage dot, name, count and a thin 2px bar showing that column's share of all tracked applications. Each card shows the role (`title-3`), company, and one meta row: the deadline ("Due Dec 4", `warning` when within 3 days), then the next action truncated to one line. Empty columns show "None" in `text-muted`, not an empty box.
- Mobile: stage tabs with counts become a sticky strip, and columns snap-scroll.

### B. Dashboard (`/dashboard`)
- "Dashboard" (serif) and today's date. Actions: **Find jobs** (secondary) and **Add job** (primary).
- **Pipeline strip:** one bordered row split into five segments (Preparing, Applied, Online assessment, Interview, Offer), each with a large tabular number and a label. Each links to Applications. This replaces four stat cards and the bar chart.
- Two lists side by side (stacked on mobile):
  - **Upcoming deadlines:** date column (e.g. "Dec 4", plus "in 3 days" in warning tone when close), role, company and stage dot.
  - **Recently saved jobs:** uses `recent_jobs`, which the API already returns but the UI ignores today. Each row has a "Prepare" link.
- Removed: the "AI career tools" cards and "Quick actions". They duplicate the nav.

### C. Landing (`/`)
- Top bar: wordmark, then Sign in (ghost) and Create account (primary).
- Hero, left-aligned and not centered. Headline: "Track every internship application in one place, and prepare for each one." Sub: one paragraph on exactly what it does. CTA: Create account. Under it, the real board UI with sample data, labeled "Sample data".
- Three sections, alternating text and product crop: the pipeline, prep for a specific posting (role analysis with evidence and gaps), and interview practice with feedback.
- "What the AI does and doesn't do": a plain two-column list. It drafts application previews, prep plans and practice questions when you click Generate. It doesn't submit applications, fill external forms, or change your profile.
- Footer: wordmark, one line, sign-in link.

### D. Job prep (`/agents/job-prep`), described only
- Two columns at ≥1024px: job list on the left (list rows, selected row `accent-subtle`), workspace on the right.
- The workspace is a **three-step sequence**, shown as a numbered text list at the top: 1 Role analysis, 2 Prep plan, 3 Practice. Each step shows its state ("Ready", "Out of date", "Not started") and the one action for the current step. This replaces the three status tiles and two red banners.
- Role analysis output: a "Where you're strong" list with each claim and its evidence quoted beneath in `text-muted`, and a "What to prepare" list ordered by priority with a text priority ("High"), not a colored pill. Disclosure rows use `<details>`.
- Resume advice moves to a secondary "Resume advice" tab, so it stops competing with prep.

---

## 8. Copy changes I'm proposing (all flagged for your approval)

Phase 3 will list every string changed in `summary.md`. Main ones:

| Where | Now | Proposed |
|---|---|---|
| Landing hero | "Your career search, organized." | "Track every internship application in one place, and prepare for each one." |
| Landing pill | "AI-enabled, human-controlled" | Removed |
| Landing sub | "CareerPilot brings jobs, applications, resumes, and interview preparation into one focused workspace…" | "Save postings, move each application through its stages, keep deadlines in view, and get a prep plan and practice questions written for the specific role." |
| Landing sections | "Built for focused momentum", "Smart help with a clear human review step", "Your career data. Your decisions." | "One column per stage", "Prep for the posting, not the job title", "Practice answers, get specific feedback", "What the AI does and doesn't do" |
| Brand tagline | "Career intelligence" / "Career command center" | Removed (wordmark only) |
| Nav | AI Agents, Job Finder, Application Agent, Job Preparation, Resume, Settings | "Prepare" (tabs: Find jobs, Draft application, Interview prep); Resume becomes a tab under Profile; Settings moves to the account menu |
| Dashboard description | "Your at-a-glance command center for jobs, applications, resume, and AI assistance." | Removed (title + date) |
| Dashboard title | "Welcome, Stephen Chen" | "Dashboard", with the date beneath |
| Page eyebrows | "DASHBOARD", "SMART JOB FINDER", etc. | Removed |
| Agent names | "Smart Job Finder", "Job Application Agent", "Job Preparation Agent" | "Find jobs", "Draft application", "Interview prep" |
| Button | "Generate prep session" | "Generate practice questions" |
| Search result button | "Not interested" (red) | "Hide" (ghost) |

---

## 9. Approved non-visual fixes going into Phase 3

From audit §8 (you said yes): delete confirmations for job, application and resume; career goals and coursework inputs on Profile; `/jobs/new` opens the manual job form again instead of redirecting; and a "Not tracked" option on the job status select. The Prettier formatting fix lands first, as its own commit.

## 10. Implementation notes

- Tokens: `app/globals.css` (CSS variables as RGB triplets) and `tailwind.config.ts` (`rgb(var(--x) / <alpha-value>)`). Remove `lagoon`, `brand-*`, `sidebar-*` and `xl2`.
- Fonts: `next/font/google` in `app/layout.tsx`, exposed as `--font-sans` / `--font-serif`.
- Primitives in `components/ui/`: `Button`, `Input`/`Select`/`Textarea`/`Field`, `Card`, `Badge`, `StageDot`, `EmptyState`, `Skeleton`, `ErrorState`, `Dialog`, `Toast`, `PageHeader`, `Tabs`. Delete the duplicates listed in the audit.
- No new npm dependencies.
