# CareerPilot frontend audit

Phase 1, no code changes. Audited at `main` @ `df9a817` on 2026-11-17.
Screenshots: `redesign/before/` (36 PNGs, every route at 1440px and 390px, plus the applications table view and job finder with results).

## 0. Context worth knowing first

This is not a first-generation "vibecoded" UI. The git history shows two earlier redesign passes:

- `0cf6e5d` (Sep 3): "Redesign CareerPilot frontend with design system and AI insights"
- `df9a817` (Sep 17): "Restyle frontend with editorial, hairline-bordered design language… Ramp-inspired flat aesthetic"

So the obvious tells (purple gradients, glassmorphism, glowing blobs) are already gone. What's left is subtler and, in my view, the real reason it still reads as a template: **every element gets the same treatment.** Every block is a white bordered box, every heading has an uppercase eyebrow, every feature has an icon in a tinted square, every list item is its own bordered card. There's no hierarchy because nothing is allowed to be plain. A third pass that only swaps colors and fonts would fail the same way. The fix is structural: fewer containers, real type hierarchy, tables and lists instead of card grids.

## 1. Stack

| Concern | What's there |
|---|---|
| Framework | Next.js 16.3 (preview) App Router, React 19.2, TypeScript |
| Styling | Tailwind 3.4 + a hand-written component layer in `app/globals.css` (`.button`, `.surface`, `.form-control`, `.badge`, `.callout-*`, `.page-*`) |
| Component library | None (no shadcn/Radix). Icons: `lucide-react` |
| Data | TanStack Query 5, `lib/api.ts` (1,129 lines) wraps every backend call |
| Forms | react-hook-form + zod (auth, job form, profile); plain `useState` elsewhere |
| Auth | HttpOnly cookie; `proxy.ts` redirects unauthenticated users on protected prefixes; server pages call `getCurrentUser()` |
| Tokens | CSS variables in `app/globals.css:5-37`, mapped in `tailwind.config.ts:22-54` |
| Fonts | `Inter` is *named* in `tailwind.config.ts:13` and `globals.css:51` but **never loaded** (no `next/font`, no `@font-face`). Users without Inter installed get system-ui. The screenshots here look like Inter only because this machine has it installed. |
| Tests | Vitest, 5 files / 14 tests, all in `lib/` (no component tests). Lint, typecheck and tests all pass today. |

## 2. Routes and their main components

All in-app pages are `AppShell` + `PageHeader` + one large client component.

| Route | Page file | Main component(s) | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | inline | Marketing page: hero + fake dashboard mock, 4-up feature grid, checklist, CTA band, footer |
| `/login`, `/register` | `app/login/page.tsx`, `app/register/page.tsx` | `AuthShell`, `AuthForm` | Dark split panel + form card |
| `/dashboard` | `app/dashboard/page.tsx` | `DashboardSummary` | 4 stat cards, pipeline bars, next actions, 3 "AI tools" cards, 3 "quick actions" cards |
| `/jobs` | `app/jobs/page.tsx` | `JobsList` | Filter bar + one card per job |
| `/jobs/new` | `app/jobs/new/page.tsx` | redirect | Redirects to `/agents/job-finder`. "New job" / "Save job" buttons therefore never open a manual form, even though `JobForm` supports create. Flagging, not changing (it's routing). |
| `/jobs/[id]` | `app/jobs/[id]/page.tsx` | `JobDetail`, `JobForm` (edit mode) | 5 stacked buttons, status select, description |
| `/applications` | `app/applications/page.tsx` | `ApplicationsView` | Filters, Board/Table toggle, kanban |
| `/applications/[id]` | `app/applications/[id]/page.tsx` | `ApplicationDetail` | Edit form + stage history |
| `/applications/[id]/interview` | `…/interview/page.tsx` | `InterviewPractice`, `insights.tsx` | Session list, question stepper, feedback |
| `/agents` | `app/agents/page.tsx` | `AgentsHome` | 3 agent cards + trust callout |
| `/agents/job-finder` | `…/job-finder/page.tsx` | `JobSearchAgent` | Mode toggle, filters, result cards |
| `/agents/job-application` | `…/job-application/page.tsx` | `JobApplicationAgent`, `agent-result-ui.tsx` | Job picker + generated preview |
| `/agents/job-prep` | `…/job-prep/page.tsx` | `JobPreparationAgent`, `insights.tsx` | Job picker + role analysis / plan / resume advice / checklist |
| `/profile` | `app/profile/page.tsx` | `ProfileForm` (view + edit modes) | |
| `/resume` | `app/resume/page.tsx` | `ResumeManager` | |
| `/settings` | `app/settings/page.tsx` | inline | Read-only account info + links |
| 404 / error | `app/not-found.tsx`, `app/error.tsx` | inline | |

## 3. "Vibecoded" tells, with locations

1. **Icon in a tinted square, everywhere.** `h-10 w-10 rounded-lg bg-brand-50 text-brand-600` appears in `app/page.tsx:168`, `stat-card.tsx:21`, `dashboard-summary.tsx:225`, `agents-home.tsx:51`, `app/profile/page.tsx:23`, `resume-manager.tsx:141`, `interview-practice.tsx:139`, `not-found.tsx:9`, plus brand marks. The icons add no information (a briefcase next to "Saved jobs").
2. **4-up feature grid with icon tiles** on the landing page (`app/page.tsx:13-38, 150-181`), the exact pattern on your avoid list. The dashboard repeats it twice ("AI career tools" and "Quick actions", `dashboard-summary.tsx:40-80, 212-271`), which also duplicates the sidebar nav.
3. **Sparkles as the "AI" signifier.** `Sparkles` is used 12 times: landing pill, dashboard tool cards (decorative, top-right corner), every "Generate" button, `InsightSummary` "AI snapshot" label, `RecommendationPanel`, feedback panel. The "AI-enabled, human-controlled" pill (`app/page.tsx:52-55`) is a textbook template hero badge.
4. **Fake product mock with invented numbers in the hero** (`app/page.tsx:98-147`: "Applications 7, Interviews 2, Saved jobs 14, On track"). Same category as fake stats.
5. **Everything is a bordered white box, nested.** `.surface` is used ~40 times; cards sit inside cards (job prep: page > `PrimaryActionCard` > `StatusTile`s; dashboard pipeline card > grey inner box; resume card > metric card > preview card). The full-page job-prep screenshot has ~25 bordered rectangles.
6. **Uppercase tracked eyebrows on every heading.** `.page-eyebrow` plus inline `uppercase tracking-[0.08em|0.1em|0.12em]` (23 arbitrary tracking values). Page headers show "DASHBOARD" above "Welcome, Stephen Chen", which is the sidebar telling you what you just clicked.
7. **Same visual weight for everything.** 91 `font-semibold`, 38 `font-bold`, only 14 `font-medium`. Card titles, labels, nav items, table cells and buttons are all semibold 14px. Page titles jump straight to ~40px bold, with nothing in between.
8. **Generic, abstract copy.** "Your at-a-glance command center", "Career intelligence", "Career command center", "Built for focused momentum", "Prepare with confidence", "Smart help with a clear human review step", "Your career data. Your decisions." None of it says what the product concretely does.
9. **Callout overuse with the wrong semantics.** Red `callout-error` is used for things that aren't errors: "Generate role analysis first" (`job-preparation-agent.tsx:362`), every stale-data notice (`StaleNotice` reuses `ErrorCallout`, `agent-result-ui.tsx:281`), "Profile needs more detail" (`job-search-agent.tsx:247`), and the "Final manual review" reassurance (`job-application-agent.tsx:264`). The job-prep page shows two red banners on a perfectly normal state.
10. **Chips everywhere.** Profile evidence sentences ("The title aligns with the requested role category.") render as tiny all-caps-weight badges (`job-search-agent.tsx:519`), which is unreadable for full sentences.

## 4. Inconsistencies

### Colors
- **`lagoon` and `brand-600` are the same color under two names** (`globals.css:16,21`). Both used: `lagoon` in 6 files, `brand-*` everywhere else.
- **None of the opacity-modifier classes compile.** Tokens are plain `var(--x)` without `<alpha-value>`, so Tailwind silently drops every `/NN` class. I compiled the CSS and confirmed these produce no rules: `bg-danger/10`, `bg-warning/10`, `bg-success/10` (`insights.tsx:22-23, 165, 214`), `bg-brand-50/60`, `bg-brand-50/40` (`insights.tsx:71, 250`, `agents-home.tsx:75`, `app/page.tsx:216`), `bg-surface-muted/60|70`, `border-border/70`, `bg-surface/95`, `text-sidebar-muted/70`, `hover:border-lagoon/50` (settings links have no hover), `ring-lagoon/20`, `text-brand-600/60`. Visible consequences: the priority badges and gap/evidence icon tiles have no background, and **the mobile nav overlay has no dim backdrop** (`app-shell.tsx:201`, `bg-ink/35` missing).
- **`bg-danger-soft` doesn't exist** as a Tailwind color (`app/error.tsx:17`), so the error page icon has no background.
- `.skeleton` hardcodes `#e9e6dc` (`globals.css:295`); `::selection` and `.form-control:focus` hardcode `rgba(60,75,219,…)`.

### Contrast (WCAG AA)
- `--text-subtle` `#98937e` is **2.83:1 on the page background, 3.08:1 on white, 2.68:1 on `surface-muted`**. AA needs 4.5:1. It's used 62 times for real text: every eyebrow, dates, hints, metadata, "Source: …" lines.
- Input borders (`--border-strong` `#d3cdba` on white) are **1.59:1**; WCAG 1.4.11 wants 3:1 for input boundaries.
- Everything else I checked passes (text-muted 5.27, white on brand 6.52, badge pairs 4.7 to 7.5).

### Type and spacing
- 9 text sizes plus 2 arbitrary (`text-[0.68rem]`, `lg:text-[3.4rem]`), 3 different eyebrow trackings, `leading-[1.08]`, `tracking-[-0.035em]`.
- Page title uses `clamp(1.85rem, 3.6vw, 2.5rem)`: 40px on desktop for "Settings" or "Job details" is louder than the content below it.
- 19 arbitrary layout values, mostly one-off grid templates (`lg:grid-cols-[1.05fr_0.95fr]`, `[1.1fr_0.9fr]`, `[1.3fr_1fr]`, `[300px_1fr]` vs `[320px_1fr]` vs `[1fr_340px]` for the same "side panel" idea).
- Padding is `p-3/p-4/p-5/p-6/p-8` with `sm:p-6` variants applied inconsistently to the same kind of card.

### Duplicated components

| Concept | Copies |
|---|---|
| Empty state | `components/empty-state.tsx` (**unused**), `agent-result-ui.tsx:EmptyState`, `profile-form.tsx:EmptyState`, plus ~8 inline dashed boxes |
| Loading state | `components/loading-state.tsx`, `agent-result-ui.tsx:LoadingState`, plus 8 inline `Loader2` spinners in a bordered box |
| Status tile | `job-application-agent.tsx:StatusTile`, `job-preparation-agent.tsx:StatusTile` (identical) |
| Task status | `agent-result-ui.tsx:TaskStatusNotice` and `interview-practice.tsx:InterviewTaskStatus` (same logic, different markup) |
| Text field / textarea | `job-form.tsx`, `profile-form.tsx`, `job-search-agent.tsx:TextInput`, plus inline labels in 4 files |
| Logout | `logout-button.tsx` (**unused**) and `app-shell.tsx:AccountFooter` |
| Brand mark | 4 versions with 3 different icons: `Compass` (app shell), `BriefcaseBusiness` (landing, auth), `Bot` (landing footer) |
| `formatDate` | 6 local copies with slightly different formats |
| Nav markup | Desktop and mobile sidebars are copy-pasted (`app-shell.tsx:146` vs `217`) |

### Buttons
- One `.button` system exists, but ad-hoc buttons bypass it: view toggle (`applications-view.tsx:139-156`), job picker rows, session list rows, chip toggles (`.badge` used as a button), mode cards (`.surface` used as a button), nav links.
- "Not interested" uses the destructive style (`job-search-agent.tsx:491`). Dismissing a search result isn't destructive.
- Job detail has 5 equal-weight secondary buttons stacked at 390px (`job-detail.tsx:144-183`, see `before/job-detail-390.png`).

## 5. Layout and responsive bugs (seen in screenshots)

- **`/applications` scrolls horizontally at 1440px.** The board has `min-w-[76rem]` inside a padded container next to a 16rem sidebar; the page renders 1536px wide (`before/applications-board-1440.png`). The "Rejected" column is cut off.
- **Page header actions orphan onto their own row.** `.page-header` is always `flex-col`, so buttons float alone on the right under the description (every page at 1440px).
- **Application detail header**: Delete sits between the title and the primary action and the three items space out awkwardly (`application-detail.tsx:142-171`).
- Kanban at 390px is a horizontal scroller of 15rem columns with no hint that it scrolls.
- The job finder shows "Internship - Internship" because employment type and experience level are printed side by side and often match (`job-search-agent.tsx:436`).

## 6. State handling gaps (loading / empty / error)

| Page | Gap |
|---|---|
| Resume | No error state. If `getResume` fails, it falls through to "No resume uploaded yet." (`resume-manager.tsx:86-97`), which is wrong and could prompt a re-upload. |
| Job detail | Delete mutation has no error handling; status update error is a bare red line. |
| Dashboard | Error is a red box with no retry. |
| Jobs / Applications | Loading is a centered spinner in an empty box (no skeleton, no layout preservation). Empty state can't tell "no data yet" from "filters matched nothing". |
| Profile edit | Zod errors on project/experience fields are **never displayed**. A project with an empty name silently blocks Save with no message. |
| Interview / agents | Loading copy says "Generating…" with no indication of how long; acceptable, but the red-vs-blue semantics are inconsistent. |
| All deletes | Job, application, resume and profile items delete immediately with **no confirmation**. |

## 7. Accessibility notes

- Good: global `:focus-visible` outline exists, real `<button>`/`<a>` used almost everywhere, auth inputs are wrapped in `<label>`, `aria-pressed` on toggles, reduced-motion media query.
- Gaps: filter inputs rely on `aria-label` + placeholder with no visible label; text-subtle contrast (above); input border contrast (above); `SuggestionChipField` wraps a `<span>` label that isn't associated with its input; the mobile drawer doesn't trap focus or close on Escape; `<details>`/`<summary>` rows remove the marker with `list-none` but keep the default focus ring, which is fine.

## 8. Things I'd want your call on (not visual, so I won't touch them without a yes)

1. **Delete confirmations.** Adding a confirm step changes behavior slightly. I'd recommend it for job, application and resume delete.
2. **Profile form is missing `career_goals` and `coursework` inputs.** They're in the schema and payload (`profile-form.tsx:59-60, 256-257`) but have no UI, so users can't edit them. Adding two fields is UI-only, but it changes what the page lets you do.
3. **`/jobs/new` redirects to the job finder**, so there's no way to paste in a job you found elsewhere, even though `JobForm` supports create. Restoring that is a routing change.
4. **Job detail's status select defaults to "Preparing" for untracked jobs**, so choosing "Preparing" fires no change event and you can't add a job to the tracker as Preparing (`job-detail.tsx:108-111`). Fixing it needs an empty "Not tracked" option, which is a small logic change.

## 9. About the product (my inferences, please confirm or correct)

Your brief left this section as template placeholders. From the README, seed data and code:

- **What it does:** A workspace for tracking job applications through stages, keeping a structured profile and resume, and using AI (mock by default) to find roles, draft application materials, analyze fit, and run typed interview practice. Nothing is submitted externally; every AI output is a draft for review.
- **Who uses it:** University students applying for internships and co-ops in tech, skewing Canadian (Waterloo/Toronto school and city suggestions, "co-op" as an employment type).
- **The feeling:** I'm assuming "calm, focused, trustworthy, a bit editorial, not AI startup," which matches your example text and the previous commit's stated direction.
- **Reference sites:** I have none. This matters most for Phase 2. Please send 2 or 3 URLs. If you don't have any, I'll work from principles you'd recognise from Linear's in-app density, Stripe docs' typography and Ramp's restraint, but I'd rather study the ones you actually like.
