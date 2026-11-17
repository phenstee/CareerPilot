# CareerPilot design system (v2)

Phase 2 proposal, revised on Nov 17 after your note that v1 looked too plain. The direction is the same pipeline-first tool. v2 adds warmth, a second color, expressive type and some motion on top of it.
Mockup: `redesign/mockup/index.html` (open it in a browser), with screenshots in `redesign/mockup/*.png`.

**What changed from v1, in short:**
- A warm paper canvas replaces the flat grey.
- A marigold highlight color joins the pine green. It is used for "soon" deadlines, gaps and one highlighter stroke per marketing page.
- Italic Newsreader becomes the product's "voice": the name in the greeting, key words in headlines, and the wordmark.
- Type sizes are fluid (`clamp()`), so headlines scale smoothly between phone and desktop.
- Controls are pills: buttons, nav and the view switch.
- The board gets rounded columns with tinted stage headers, cards with a colored stage edge, and a hover lift.
- The dashboard has a connected pipeline "journey" and calendar date tiles.
- The landing page has dark pine bands, and the board sits in a dark showcase panel.

---

## 1. The direction: "a tracker, not a landing page"

CareerPilot is a pipeline tool. A student opens it to answer three questions: *what's due, where does each application stand, and what should I prepare next.* The current UI hides those answers behind decoration: icon tiles, eyebrows, nested cards and AI sparkles.

The direction is to **let the pipeline be the product**, the way Odoo's CRM does. The kanban board, the list and the deadline column carry the interface. Color and personality go where they carry meaning, such as a stage, a deadline or a gap, not on decoration.

**What I'm taking from Odoo CRM (your reference).** odoo.com blocks automated access, so I couldn't load the page from here. This section draws on Odoo CRM's well-known product patterns, not a pixel study. If there's a specific screen or section you like, send a screenshot and I'll fold it in.

1. **The board is the dashboard.** Each column header carries the summary: stage name and count, on a tinted band.
2. **One control bar per list page.** Search and filters sit on the left and the view switch (Board / Table) on the right. The same bar appears on every list page.
3. **Dense record cards.** Each card has a title, a secondary line, one deadline chip and the next action.
4. **Real product on the marketing page.** The hero visual is the actual board UI with sample data, labeled as sample data.
5. **(v2) A hand-drawn-feeling accent.** Odoo underlines key words with a highlighter stroke. v2 borrows that, limited to **one stroke per marketing page**, in marigold, so it stays a signature rather than a trope.

**What I'm not taking:** Odoo's plum brand color (too close to the purple you want gone), its doodles and illustrations, and its feature mega-grid.

---

## 2. Typography

**Pairing: Newsreader (titles and voice) + IBM Plex Sans (everything else).** Both are open-source (SIL OFL 1.1) and **self-hosted**: the Latin `.woff2` files live in `frontend/app/fonts/` and load with plain `@font-face`, so there's **no new npm dependency** and builds never fetch from Google Fonts.

- **IBM Plex Sans** for UI and body. It has more character than Inter, stays legible at 13 to 14px, and has tabular figures for counts and dates.
- **Newsreader** for page titles, marketing headlines, big counts (board column counts, pipeline numbers, date tiles) and monograms.
- **Voice italic (new in v2):** Newsreader italic in `accent` marks the one or two words that matter in a heading, such as "Good morning, *Stephen*", "and *prepare for each one.*" or the wordmark "Career*Pilot*". At most one per heading.
- No uppercase tracked eyebrows. The marketing page uses short italic serif kickers ("*Prep*", "*Straight answers*") in their place, in sentence case.

| Token | Font | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display-1` | Newsreader | `clamp(40px, 5.2vw, 64px)` / 1.04 | 500 | -0.025em | Landing hero only |
| `display-2` | Newsreader | `clamp(28px, 3.2vw, 40px)` / 1.1 | 500 | -0.015em | Landing section headings |
| `title-1` | Newsreader | `clamp(26px, 2.6vw, 34px)` / 1.15 | 500 | -0.015em | In-app page title (one per page) |
| `count` | Newsreader | 22 to 26 / 1 | 500 | 0 | Column counts, pipeline numbers, date tiles |
| `title-2` | Plex Sans | 18 / 26 | 600 | 0 | Section headings in-app |
| `title-3` | Plex Sans | 14 / 20 | 600 | 0 | Card titles, column headers, table emphasis |
| `body-lg` | Plex Sans | 17 to 18 / 1.6 | 400 | 0 | Marketing body |
| `body` | Plex Sans | 14 / 22 | 400 | 0 | Default in-app text, inputs, buttons |
| `body-sm` | Plex Sans | 13 / 18 | 400 | 0 | Metadata, table cells, hints |
| `label` | Plex Sans | 13 / 18 | 500 | 0 | Form labels, nav items |
| `caption` | Plex Sans | 12 / 16 | 500 | 0 | Table headers, chips, badges |

Weights in use: 400, 500, 600. Numbers in tables, counts and dates use `font-variant-numeric: tabular-nums`.

---

## 3. Color

A warm paper canvas, **pine green** as the accent, and **marigold** as the highlight. Green carries actions and identity. Marigold carries urgency and emphasis: soon deadlines, gaps to prepare and the single highlighter stroke. Neither is used as a gradient fill or as decoration.

All text pairs meet WCAG AA (4.5:1). Input borders, stage dots and focus rings meet 3:1 non-text contrast. I computed every ratio below with the WCAG relative-luminance formula.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `canvas` | `#F6F3EC` | Page background (warm paper) | |
| `surface` | `#FFFFFF` | Cards, inputs, lists, tables | |
| `sunken` | `#EFEBE2` | Board columns, nav track, chips, table header | |
| `border` | `#E4DFD3` | Hairline dividers, card outlines (decorative) | |
| `border-ui` | `#CBC4B5` | Secondary button outline, dashed empty box, card hover | |
| `border-strong` | `#8A8473` | Input and checkbox boundaries | 3.73 on surface, 3.37 on canvas |
| `text` | `#1C1B17` | Headings, body | 15.6 on canvas |
| `text-2` | `#4B483F` | Secondary lines, inactive nav | 8.3 on canvas |
| `muted` | `#6A665B` | Metadata, hints | 5.2 canvas / 5.7 surface / 4.8 sunken |
| `accent` | `#1F5C4A` | Primary button, links, voice italic, focus | 7.8 white-on, 7.1 on canvas |
| `accent-hover` | `#174538` | Primary hover / pressed | 10.8 white-on |
| `accent-deep` | `#143D31` | Dark bands on the landing page, board showcase panel | |
| `accent-subtle` | `#E3EEE8` | Selected row, "good evidence" rows, monogram tiles | accent on it 6.6 |
| `highlight` | `#F4C04E` | Marigold: highlighter stroke, "soon" date-tile band, gap badge. **Always a fill with dark text, never text on light** | text on it 10.3 |
| `highlight-subtle` | `#FCEFC9` | Soon-deadline chip, "gap" evidence row | `warning` text on it 5.6 |
| `cream` / `cream-muted` | `#F6F3EC` / `#B9C8C0` | Text on `accent-deep` | 10.9 / 6.9 |
| `warning` | `#8A5200` | Text for soon deadlines, stale results | 5.8 on canvas |
| `danger` / `danger-subtle` | `#B3261E` / `#F8E5E3` | Errors, destructive actions | 6.5 on white, 5.4 on subtle |

**Stage colors.** Each stage has a strong color (dot, card edge, 3:1 minimum next to a text label) and a tint (column header band, pipeline node):

| Stage | Strong | Tint |
|---|---|---|
| Saved, Preparing, Withdrawn | `#84847C` | `#ECE8DE` |
| Applied | `#3D6A99` (5.7 on white) | `#E6EDF5` |
| Online assessment, Interview | `#B06A00` (4.3 on white) | `#FBEBD3` |
| Offer | `#1E7B45` (5.3 on white) | `#E3F1E8` |
| Rejected | `#B3261E` (6.5 on white) | `#F8E5E3` |

Rules:
- Red means something failed or will be destroyed. A missing prerequisite is a neutral hint, and an out-of-date result is `warning`.
- One gradient only: the faint stage-colored connector line in the dashboard pipeline (35% opacity). No gradient backgrounds, no glass, and no tinted icon circles.
- Dark `accent-deep` bands appear on the marketing page only, at most two per page. The app stays light.
- Tokens are CSS variables as RGB triplets with Tailwind `<alpha-value>` support (`rgb(var(--accent) / <alpha-value>)`), so opacity modifiers actually work this time.

---

## 4. Space, radius, borders, shadow

- **Spacing:** 4px base. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96. No arbitrary values. In-app sections are 32 to 36 apart. Marketing sections use `clamp(64px, 9vw, 112px)`.
- **Radius (v2, softer):**
  - `full` for buttons, nav, the segmented switch, chips and avatars.
  - `10px` for inputs, selects, record cards and stage header bands.
  - `14px` for board columns.
  - `16px` for panels: the pipeline card, lists and dialogs.
  - `24px` for the landing showcase panel only.
- **Borders:** 1px `border` hairlines separate content. Boxes are reserved for records, lists, inputs and overlays. Sections are still a heading plus whitespace, not a box.
- **Shadows:** two tokens.
  - `shadow-hover: 0 6px 18px -8px rgb(28 27 23 / .25)` appears only on hover of a card or row that is a link.
  - `shadow-overlay: 0 12px 32px -8px rgb(28 27 23 / .25), 0 1px 2px rgb(28 27 23 / .08)` is for menus, dialogs and toasts.
  - Nothing has a shadow at rest.

---

## 5. Components

One version of each, in `components/ui/`. Everything interactive is a real `<button>` or `<a>`, with a visible focus ring: `outline: 2px solid accent; outline-offset: 2px`.

### Buttons
All are pills (`radius: full`).

| Variant | Default | Hover | Notes |
|---|---|---|---|
| Primary | `accent` bg, white text | `accent-hover`, rises 1px | At most one per view |
| Secondary | `surface` bg, 1px `border-ui`, `text` | `sunken` bg | The workhorse |
| Ghost | transparent, `text-2` | `sunken` bg, `text` | Toolbars, tertiary actions |
| Destructive | `surface` bg, `danger` text, `danger` 40% border | `danger-subtle` bg | Filled `danger` only inside the confirm dialog |

Sizes: `sm` 32px, `md` 38px (default), `lg` 44px (marketing CTAs and mobile primary actions). Label weight 500. Icons are optional (16px, leading) and used only when they add meaning, like + on Add job or → on a link that moves you on. Loading replaces the icon with a spinner, keeps the width and disables the button.

### Inputs
38px tall, 1px `border-strong`, radius 10, `surface` bg. Focus: border `accent` plus a 3px ring `accent / 0.18`. Label above (`label`), hint below (`body-sm`, `muted`), error below in `danger` with `aria-invalid` and `aria-describedby`. Every input has a label (visually hidden on filter fields, never missing). Selects and date inputs share the same box. Textareas have a minimum of 4 rows.

### Record cards (board)
- `surface`, 1px `border`, radius 10, padding 12.
- A **3px rounded stage-colored edge** on the left inset.
- Content: title (`title-3`), company, then one deadline chip, then the next action clamped to 2 lines.
- Hover: lifts 2px with `shadow-hover` and the border goes to `border-ui`.
- The whole card is the link, with one focus ring around it.

### Chips and badges
- `caption`, pill, `sunken` bg, `text-2`. Example: "Due Dec 1".
- **Soon** (deadline within 3 days): `highlight-subtle` bg, `warning` text, with a relative date ("Due Nov 20 · In 3 days").
- **Gap**: `highlight` bg, `text`.
- Tones for success and danger use their subtle bg and strong text.
- Stage in a list row is dot plus text ("● Interview"), not a filled pill.

### Tables and lists
- **List panel:** `surface`, radius 16, rows separated by hairlines. Row hover: `canvas` bg.
- **Dashboard rows** lead with a visual anchor: a calendar **date tile** (month band over a serif day number; the band turns marigold when the deadline is soon) or an italic serif **monogram tile** on `accent-subtle`.
- **Table:** header row `sunken`, `caption` text in sentence case, rows 44px with hairline dividers. The first column is the link. Numbers and dates are tabular. Wide tables scroll inside their own container, never the page.

### Navigation
- **Desktop:** a 60px top bar on `canvas` with a bottom hairline.
  - Left: the serif wordmark "Career*Pilot*", then a **pill segmented nav** (a `sunken` track holding Dashboard, Applications, Jobs, Prepare and Profile). The active item is a white pill with a hairline shadow.
  - Right: account (name plus an avatar with an italic serif initial), opening a menu with Settings and Sign out.
- **Why a top bar instead of the sidebar:** the board needs width. The current 256px sidebar is why `/applications` overflows at 1440px.
- **Mobile (<768px):** the wordmark and a menu button. The menu opens a full-height sheet with the same links and a dimmed backdrop. Escape closes it and focus is trapped inside.
- **Grouping:** the four AI pages become one "Prepare" section with tabs (Find jobs, Draft application, Interview prep). Profile and Resume become tabs under "Profile". **Routes don't change**, only nav labels and grouping (see §8).

### Page header
`title-1` (serif, optionally with one voice-italic word) on the left, a one-line live summary beneath in `text-2` (e.g. "6 tracked · 1 due this week"). Actions sit on the right on the same row at ≥768px, and stack full-width on mobile. Detail pages get a text breadcrumb above the title.

### Segmented control
The same pill track as the nav, used for Board / Table and for tabs within Prepare and Profile.

### Empty states
- **Inside a board column:** "Nothing here yet" in a dashed `border-ui` box, radius 10.
- **Page-level:** left-aligned in the space the content would occupy. It has a `title-3` line that says what's missing, one sentence on what to do, and one button.
- No icon circles or illustrations.
- Filtered-to-nothing is its own state: "No applications match these filters", with "Clear filters".

### Loading states
- **Lists and boards:** skeletons in the final layout's shape (`sunken` blocks with the same radii). A gentle opacity pulse, static under `prefers-reduced-motion`.
- **Buttons:** an inline spinner.
- **AI tasks:** an inline status line under the action ("Queued", "Generating…", "Done"), showing the retry count when retrying. Neutral styling; `danger` only on failure.
- No full-page spinners.

### Errors
An inline callout at the top of the affected region: `danger-subtle` bg, radius 10, `danger` text, one sentence on what failed, and a "Try again" button that refetches. Field errors sit under the field. Page-level crashes use `app/error.tsx` in the same style.

### Toasts
Only for confirming an action whose result isn't visible on screen ("Application deleted"). Bottom-right on desktop, bottom-center on mobile. `text` bg, `cream` text, pill radius, `shadow-overlay`. Shows for 4 seconds, is dismissible and uses `role="status"`. Built in-house.

### Dialogs
Native `<dialog>`, radius 16, `shadow-overlay`, backdrop `text / 0.4`. Used for the approved delete confirmations: a title like "Delete this application?", one sentence on what's lost, then Cancel (secondary) and Delete (filled danger). Focus starts on Cancel.

### Motion
- One easing curve, `cubic-bezier(.2, .7, .2, 1)`, with durations of 150 to 180ms.
- **Hover:**
  - Cards lift 2px and gain `shadow-hover`.
  - The primary button rises 1px.
  - "Prepare →" and "Open board →" arrows nudge 2px right.
  - Pipeline nodes get a `sunken` hover background.
- **Overlays:** menus, sheets, dialogs and toasts fade in with a 6px rise.
- Nothing animates on page load. A card changing stage doesn't animate.
- Everything above is disabled under `prefers-reduced-motion`.

---

## 6. Layout

| | Marketing (`/`, `/login`, `/register`) | App (everything else) |
|---|---|---|
| Max width | 1120px | 1280px (board and tables can use the full width) |
| Reading width | 640px for paragraphs | 720px for forms and long text |
| Grid | 12 columns, 24px gutter | 12 columns, 24px gutter, 4 columns / 16px on mobile |
| Side gutter | 16px <640, 24px ≥640, 32px ≥1024 | Same |
| Base text | 17 to 18px body | 14px body, 13px metadata |
| Section spacing | `clamp(64px, 9vw, 112px)` | 32 to 36px between sections, 16px within |
| Density | Generous: one idea per screen-height | Real density: a full pipeline visible at 1440×900 |

The responsive floor is 360px. On mobile the board becomes a horizontal snap-scroller of columns, with a scrollable pill strip of stages and counts above it. Tables scroll inside their container. There is no page-level horizontal scroll at any width. The mockup is checked for this automatically at 390 and 1440, and the build will be checked at 360, 390, 768, 1024 and 1440 before sign-off.

---

## 7. Key screens

The first three are built in the mockup. The fourth is described here.

### A. Applications (`/applications`)
- **Header:** "Applications" (serif) with a live summary beneath ("6 tracked · 1 due this week") and **Add job** on the right.
- **Control bar:** search (company or role), Stage and date filters as compact selects, and a Board/Table pill switch on the right.
- **Board:**
  - One rounded `sunken` column per visible stage.
  - Each column has a **tinted header band** with the stage dot, name and a large serif count.
  - Cards carry the stage-colored edge and a deadline chip (marigold when it's within 3 days), then the next action.
  - Empty columns show "Nothing here yet".
- **Mobile:** a stage pill strip with counts above snap-scrolling columns.

### B. Dashboard (`/dashboard`)
- **Greeting:** "Good morning, *Stephen*" (serif, first name in voice italic). The time-of-day word comes from the browser clock.
- **Sub line:** today's date plus one live fact ("one deadline in the next 3 days").
- **Actions:** **Find jobs** (secondary) and **Add job** (primary).
- **"Your pipeline":** five connected circular nodes (Preparing, Applied, Online assessment, Interview, Offer).
  - Each node shows a serif count, tinted with its stage color when non-zero, plus a dot-and-label caption.
  - A faint stage-colored line connects them.
  - Each node links to Applications.
  - "Open board →" sits on the right.
  - This replaces four stat cards and the bar chart.
- **Two lists**, side by side on desktop and stacked on mobile:
  - **Coming up:** calendar date tiles, role and company, the relative date ("In 3 days" as a marigold chip when it's soon) and the stage.
  - **Recently saved:** uses `recent_jobs`, which the API already returns and the UI ignores today. Each row has a serif monogram tile, the role, company and location, and a "Prepare →" link.
- **Removed:** the "AI career tools" cards and "Quick actions", which duplicate the nav.

### C. Landing (`/`)
- **Top bar:** wordmark, then Sign in (ghost) and Create account (primary).
- **Hero,** left-aligned in two columns.
  - Headline: "Track every internship application in one place, and *prepare for each one.*" The italic phrase carries the page's one marigold highlighter stroke.
  - Sub-paragraph, then Create account and Sign in.
  - On the right, a note with a marigold rule: "The tracker works on its own. AI features are optional and only run when you click Generate. Nothing is ever submitted for you."
- **Showcase:** the real board UI with sample data inside a dark pine panel, labeled "Your applications board" and "Sample data". It is cropped at the bottom so it reads as a window into the product.
- **Prep section:** italic kicker "*Prep*", then "Prep for the posting, not the job title." Beside it, an evidence panel. Strengths are `accent-subtle` rows with an italic serif quote of the evidence; the gap is a `highlight-subtle` row with a "Gap · high" badge.
- **"What the AI does and doesn't do":** a dark pine band with italic kicker "*Straight answers*" and two lists in cream. "Does" items get marigold dots and "Doesn't" items get hollow rings.
- **Footer:** wordmark and one line.

### D. Job prep (`/agents/job-prep`), described only
- Two columns at ≥1024px: the job list on the left (list rows, the selected row in `accent-subtle`) and the workspace on the right.
- The workspace is a **three-step sequence** shown as connected nodes, the same component as the dashboard pipeline: 1 Role analysis, 2 Prep plan, 3 Practice.
  - Each step shows its state: "Ready", "Out of date" (warning) or "Not started".
  - The current step shows its one action.
  - This replaces the three status tiles and two red banners.
- Role analysis output reuses the landing page's evidence rows. "Where you're strong" rows are `accent-subtle` with the evidence quoted in italic serif. "What to prepare" rows are `highlight-subtle`, ordered by priority, with a text priority badge.
- Resume advice moves to a secondary "Resume advice" tab.

---

## 8. Copy changes I'm proposing (all flagged for your approval)

Phase 3 will list every changed string in `summary.md`. The main ones:

| Where | Now | Proposed |
|---|---|---|
| Landing hero | "Your career search, organized." | "Track every internship application in one place, and *prepare for each one.*" |
| Landing pill | "AI-enabled, human-controlled" | Removed |
| Landing sub | "CareerPilot brings jobs, applications, resumes, and interview preparation into one focused workspace…" | "Save postings, move each application through its stages, keep deadlines in view, and get a prep plan and practice questions written for the specific role." |
| Landing hero note (new) | (none) | "The tracker works on its own. AI features are optional and only run when you click Generate. Nothing is ever submitted for you." |
| Landing sections | "Built for focused momentum", "Smart help with a clear human review step", "Your career data. Your decisions." | "Prep for the posting, not the job title", "What the AI does and doesn't do" (kickers "Prep", "Straight answers") |
| Brand tagline | "Career intelligence" / "Career command center" | Removed (wordmark only) |
| Nav | AI Agents, Job Finder, Application Agent, Job Preparation, Resume, Settings | "Prepare" (tabs: Find jobs, Draft application, Interview prep); Resume becomes a tab under Profile; Settings moves to the account menu |
| Dashboard title | "Welcome, Stephen Chen" | "Good morning, Stephen" (afternoon / evening by local time, first name only) |
| Dashboard description | "Your at-a-glance command center for jobs, applications, resume, and AI assistance." | Today's date plus one live fact, e.g. "one deadline in the next 3 days" |
| Dashboard sections | stat cards, "Upcoming deadlines", "AI career tools", "Quick actions" | "Your pipeline", "Coming up", "Recently saved" |
| Applications title | "Application tracker" | "Applications" |
| Applications description | "Move opportunities through every stage and keep the next step visible." | Live summary: "6 tracked · 1 due this week" |
| Empty board column | (empty box) | "Nothing here yet" |
| Page eyebrows | "DASHBOARD", "SMART JOB FINDER", etc. | Removed |
| Agent names | "Smart Job Finder", "Job Application Agent", "Job Preparation Agent" | "Find jobs", "Draft application", "Interview prep" |
| Button | "Generate prep session" | "Generate practice questions" |
| Search result button | "Not interested" (red) | "Hide" (ghost) |

---

## 9. Approved non-visual fixes going into Phase 3

From audit §8 (you said yes):
- Delete confirmations for job, application and resume.
- Career goals and coursework inputs on Profile.
- `/jobs/new` opens the manual job form again instead of redirecting.
- A "Not tracked" option on the job status select.

The Prettier formatting fix lands first, as its own commit.

## 10. Implementation notes

- **Tokens:** `app/globals.css` (CSS variables as RGB triplets) and `tailwind.config.ts` (`rgb(var(--x) / <alpha-value>)`), plus `fontSize` entries for the clamp sizes and `transitionTimingFunction.out`. Remove `lagoon`, `brand-*`, `sidebar-*` and `xl2`.
- **Fonts:** self-hosted `@font-face` in `app/globals.css` for Newsreader (500, normal and italic) and IBM Plex Sans (variable, 400 to 600), exposed as `--font-sans` and `--font-serif`. (`next/font/google` was used first, but its build-time fetch broke the production Docker build in CI.)
- **Primitives in `components/ui/`:**
  - `Button`, `Input` / `Select` / `Textarea` / `Field`.
  - `Card`, `Chip`, `StageDot`, `DateTile`, `Monogram`.
  - `PipelineSteps` (dashboard pipeline and job-prep steps).
  - `EmptyState`, `Skeleton`, `ErrorState`, `Dialog`, `Toast`, `PageHeader`, `Segmented`.
  - Delete the duplicates listed in the audit.
- **Greeting time of day:** computed client-side from the browser clock. This is display only, with no data change.
- No new npm dependencies.
