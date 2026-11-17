# CareerPilot redesign: Phase 3 summary

Branch `claude/project-thread-qukzx4`, draft PR #1. One commit per step, listed at the end.

All screenshots are in `redesign/after/` at 1440px and 390px (2x pixel density). The matching "before" shots, at 1x, are in `redesign/before/` with the same file names. Every page was also checked at 360px, with no horizontal overflow.

No backend, API, route, auth or data-fetching code changed. No dependencies were added. The two fonts are self-hosted `.woff2` files in `frontend/app/fonts/` (both SIL OFL, licenses alongside), loaded with plain `@font-face`. I switched to this from `next/font/google` because that broke the production Docker build in CI.

---

## 1. Verification

Run from `frontend/` on the final tree.

```
$ npm run lint
> careerpilot-frontend@0.1.0 lint
> eslint .
exit 0

$ npm run typecheck
> careerpilot-frontend@0.1.0 typecheck
> tsc --noEmit
exit 0

$ npm run format:check
> careerpilot-frontend@0.1.0 format:check
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
exit 0

$ npm run test
> careerpilot-frontend@0.1.0 test
> vitest run
 RUN  v4.1.10 /home/user/CareerPilot/frontend
 Test Files  6 passed (6)
      Tests  18 passed (18)
exit 0

$ npm run build
> careerpilot-frontend@0.1.0 build
> next build
▲ Next.js 16.3.0-preview.9 (Turbopack)
✓ Compiled successfully in 6.5s
  Finished TypeScript in 5.0s ...
✓ Generating static pages using 3 workers (18/18) in 333ms
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /agents
├ ƒ /agents/job-application
├ ƒ /agents/job-finder
├ ƒ /agents/job-prep
├ ƒ /api/auth/fallback-login
├ ƒ /api/auth/fallback-register
├ ƒ /applications
├ ƒ /applications/[id]
├ ƒ /applications/[id]/interview
├ ƒ /dashboard
├ ƒ /jobs
├ ƒ /jobs/[id]
├ ƒ /jobs/new
├ ƒ /login
├ ƒ /profile
├ ƒ /register
├ ƒ /resume
└ ƒ /settings
ƒ Proxy (Middleware)
exit 0
```

`format:check` passing needed a one-off Prettier pass over 21 files that were already unformatted before the redesign. That pass is its own commit (`daf206d`), so the redesign diffs stay readable.

---

## 2. Flows clicked through

These were run as scripted Playwright sessions against the local app (real backend, mock AI provider). Anything the tests changed was put back afterwards.

| Flow | What was checked | Result |
|---|---|---|
| Sign in | Empty submit shows field errors, `aria-invalid` and a summary. Real sign-in redirects to `/dashboard`. | Pass |
| Applications | Board to Table toggle. A filter with no matches shows the filtered-empty state. Clear filters. | Pass |
| Add job | Empty submit shows errors. Create redirects to the job's page. "Not tracked" shows. Setting Applied removes "Not tracked". | Pass |
| Delete job | Dialog opens with focus on Cancel. Escape closes it. Confirm deletes and returns to `/jobs`. | Pass |
| Application detail | Edit notes, then Save changes shows "Saved" and survives a reload (notes restored after). Delete dialog is centred, and Cancel closes it. Practice interview link opens. | Pass |
| Find jobs | A profile search returns results. Hide removes a card. No page errors. | Pass |
| Profile | Edit opens with career goals and coursework prefilled. An empty project name and year 1800 show inline errors, and nothing is sent. Cancel returns to the summary without saving. Adding a course and a skill chip saves and shows on the summary (then reverted). Checked at 1440 and 390. | Pass |
| Resume | Delete dialog: focus starts on Cancel, Escape closes it. Confirm deletes and shows the empty state. The upload control shows a focus ring on Tab. A non-PDF is rejected with a message. The resume row was restored from a backup afterwards. | Pass |
| Missing records | `/jobs/<unknown id>` and `/applications/<unknown id>` reach their error state in about 1.3s. | Pass |
| 404 | An unknown route shows the new not-found page. | Pass |

**Not click-tested in this pass:**
- Generating a role analysis, prep plan, application preview, practice questions or answer feedback. These pages were checked in their empty and "not started" states, and the result components were restyled, but I didn't generate new results.
- Uploading a real PDF.
- Submitting the register form.
- The mobile menu's focus trap.

---

## 3. Before and after, page by page

| Page | Before | After | Files |
|---|---|---|---|
| Landing `/` | Icon-tile feature grid, sparkle pill, fake "This week" stat card. | Serif hero with one marigold highlight. A cropped sample board in a dark pine panel, labelled "Sample data". A prep evidence panel and a dark "What the AI does and doesn't do" band. | `landing-*` |
| Sign in / Register | Black side panel with "Career command center", checkmark list, uppercase eyebrow. | Pine side panel with the wordmark, a serif line, two tilted sample cards and three plain trust points. The form uses the shared fields with inline errors and a password hint. | `login-*`, `register-*` |
| Dashboard | Welcome title, five stat cards, "AI career tools" and "Quick actions" grids. | A greeting plus today's date and one live fact. Pipeline steps link to the board. "Coming up" uses date tiles (the month band turns marigold within 3 days). "Recently saved" has Prepare links. | `dashboard-*` |
| Applications | Plain columns and an icon header. | A control bar (on mobile, "More filters" hides the extra filters). Tinted stage column headers with serif counts, cards with a stage edge and deadline chips, and "Nothing here yet" in empty columns. On mobile the board scrolls horizontally with a stage jump strip. The table uses stage labels. | `applications-board-*`, `applications-table-*` |
| Saved jobs | Card grid. | A list with monograms and a Prepare link per row. Filtered and first-run empty states. | `jobs-*` |
| Add a job | Opened the agent page, not a form. | The manual JobForm again (approved fix), with required markers, inline errors and "e.g." placeholders. | `job-new-*` |
| Job detail | Stacked panels and a status select that said "Preparing" for untracked jobs. | The job title is the page title. A sticky "Tracking" panel with a "Not tracked" option (approved fix). A "Prepare" links panel, and a delete confirmation that says what else gets deleted. | `job-detail-*` |
| Application detail | Long form, no delete confirmation. | Header with a stage label and actions, the form in one panel, and a stage history timeline. Delete confirmation (approved fix). | `application-detail-*` |
| Interview practice | Generic panels. | Session sidebar, the question in serif with "Why it's asked:", and feedback with its groups open. | `interview-*` |
| Prepare overview | Three icon-tile agent cards. | A numbered three-step list and a "You stay in charge." note. | `agents-*` |
| Find jobs | Bordered form and red "Not interested". | Segmented mode switch and pill filter toggles. Result cards with Save job, View posting and a ghost Hide. Evidence and gaps as lists, not chips. | `agent-job-finder-*`, `agent-job-finder-results-*` |
| Draft application | Status tiles and banners. | Job list plus a workspace with a meta line. The cover letter is set in serif on a paper panel, with a plain notice that nothing is submitted. | `agent-job-application-*` |
| Interview prep | Three status tiles and two red banners. | A three-step sequence (Role analysis, Prep plan, Checklist), "Prep plan" and "Resume advice" tabs, and a "Checklist and practice" panel. | `agent-job-prep-*` |
| Profile | Summary had an eyebrow, icon dates and dashes. The edit form had no career goals or coursework input and never showed validation errors. | Summary: a pine header with initial, name and school line; career goals as a quote; skill groups; projects and experience as dated lists. Edit form: four sections, **new Career goals and Relevant coursework inputs** (approved fix), inline errors, labelled chip inputs and a sticky Save/Cancel bar. | `profile-*`, `profile-edit-*` |
| Resume | Icon tile and uppercase metric box. Delete had no confirmation, and a load error looked like "no resume". | File header with a paper glyph, size and characters read. "What CareerPilot read" preview. **Delete confirmation** (approved fix), a real error state with retry, and an empty state that says what works. | `resume-*` |
| Settings | Three boxed cards with icon links. | Settings rows: Account, Your data (where each kind of data lives, with links) and AI features. | `settings-*` |
| Not found / Error | Icon-tile card with an eyebrow. | Wordmark bar, an italic kicker, a serif headline and plain next steps. `error.tsx` also referenced a colour token that didn't exist (`bg-danger-soft`); that's gone. | `not-found-*` |

**System-level changes:**
- **Tokens** live in `globals.css` and `tailwind.config.ts`. The last arbitrary grid and size values became named tokens: `grid-cols-sidebar`, `split`, `lead`, `lead-trail`, `gutter`, and `max-h-list`.
- **Duplicates removed:** six root-level components (page-header, badge, empty-state, loading-state, logout-button, stat-card) were deleted, along with the local EmptyState, TextField and LoadingState copies inside the profile, agent and resume files. Each primitive now has one version in `components/ui/`.
- **The top-bar shell** replaces the sidebar. Prepare and Profile have section tabs, and Settings and Sign out are in the account menu.
- **Confirm dialog** now uses `!m-auto`. Without it, a dialog placed inside a `space-y-*` parent was pinned to the top of the screen. That showed up on Resume.

---

## 4. Copy changes (please review)

Every changed string, grouped by page. "Removed" means the text is gone with nothing in its place.

**Global and nav**
- Nav "AI Agents", "Job Finder", "Application Agent", "Job Preparation" → "Prepare" with tabs: Overview, Find jobs, Draft application, Interview prep.
- Resume moves to a tab under Profile. Settings moves to the account menu.
- Taglines "Career intelligence" and "Career command center" → removed (wordmark only).
- Page eyebrows ("DASHBOARD", "SMART JOB FINDER", etc.) → removed.
- Metadata description rewritten to match the landing sub-line.

**Landing**
- Hero "Your career search, organized." → "Track every internship application in one place, and *prepare for each one.*"
- Pill "AI-enabled, human-controlled" → removed.
- Sub-line → "Save postings, move each application through its stages, keep deadlines in view, and get a prep plan and practice questions written for the specific role."
- New note: "The tracker works on its own. AI features are optional and only run when you click Generate. Nothing is ever submitted for you."
- "Get started" / "Start your career workspace" / "Create your account" → "Create account".
- Sections "Built for focused momentum", "Smart help with a clear human review step" and "Your career data. Your decisions." → "Prep for the posting, not the job title." (kicker "Prep") and "What the AI does and doesn't do" (kicker "Straight answers").
- The does / doesn't lists are new copy. I changed the mockup's "Run in the background" to **"Run on its own. Nothing is generated until you ask."** Generation does run as a background task after you click, so the mockup wording would have been inaccurate.
- Footer "Organized job search for early-career candidates." → "An application tracker and prep workspace for students applying to internships and co-ops."

**Sign in / Register**
- Side panel: "A focused workspace for the next step in your career." → "Every application in one place, and *a plan for each one.*"
- Trust points → "The tracker works without any AI at all", "AI suggestions are based on your own profile and resume", "Nothing in your data changes until you review it". Removed "Human review built in".
- Sign in description "Continue to your private career workspace." → "Welcome back. Your tracker is where you left it."
- Register description "Start with secure account access. Profile and tracker data come next." → "It takes a minute. You can fill in your profile after."
- New password hint on register: "At least 8 characters."
- Invalid-form message "Please fix the highlighted fields and try again." → "Some fields need attention. They're marked above."
- Fallback error "Unable to authenticate." → "That didn't work. Try again."

**Dashboard**
- Title "Welcome, Stephen Chen" → "Good morning / afternoon / evening, Stephen".
- Description → today's date plus one fact: "one deadline in the next 3 days", "next deadline in X", or "no upcoming deadlines".
- Actions "Applications" and "AI Agents" → "Find jobs" and "Add job".
- Sections → "Your pipeline", "Coming up", "Recently saved". Empty states: "No upcoming deadlines…" and "No saved jobs yet…".

**Applications**
- "Application tracker" → "Applications". Description → live "N tracked · N due this week".
- "Save job" → "Add job". Removed the "Saved jobs" button.
- Filter placeholders "Company" and "Role". Visible "Applied" label on the date filters.
- Empty column → "Nothing here yet". Table "Not set" → "Not yet" / "None". New empty and filtered-empty copy.

**Jobs**
- "Saved job postings" → "Saved jobs". "New job" → "Add job". New description.
- "Job details" → the job's own title.
- "Prepare application" / "Prepare for job" → "Draft application" / "Interview prep". "Open job" → "Open posting".
- "Application status" → "Tracking", plus the "Not tracked" option.
- "Job URL" → "Posting URL", plus a description hint. New copy for the "Add a job" page.
- Delete dialog: "…will be removed from your saved jobs, along with its application, stage history and prep results. This can't be undone." (or "…along with any prep results" when untracked).

**Application detail**
- "Save application" → "Save changes". New "Saved" status and "View job" link.
- Contacts hint, "Started in X".
- Delete dialog: "Your stage history, notes, contacts and interview practice for X will be deleted. The saved job stays."

**Interview practice**
- "Practice session" → "Interview practice". "Generate prep session" → "Generate practice questions".
- "Practice answer" → "Your answer". "Submit for feedback" → "Get feedback". "Answer feedback" → "Feedback on your answer".
- "Why it's asked:" label, and new empty-state copy.

**Prepare**
- Overview "Choose an AI workflow" → "Prepare for *each role*", with new step copy and the "You stay in charge." aside.
- Find jobs: new title and description. "Search instructions" → "What are you looking for?". "Not interested" → "Hide". "Mock result" → "Sample result". "Search strategy" → "How it searched:". Section names "Skills it asks for" and "What you can point to".
- Draft application: "Prepare an application preview" → "Draft an application", plus a new description. New notice: "CareerPilot hasn't submitted anything or filled in any form on another site. Read everything before you use it."
- Interview prep: "Prepare for a saved job" → "Interview prep". "Quick review" → "Checklist and practice". "Mock interview" → "Practice questions". "Start mock interview" → "Open interview practice".
- Insights: removed the "AI snapshot" label. "Top strengths" → "Where you're strong". "Focus before interview" → "Focus before the interview".
- Task status → "Queued…", "Generating…", "Temporary issue, retrying (n of m)…", "Done.".

**Profile**
- "Career profile" → "Profile". New description: "What CareerPilot knows about you. Job search, application drafts and interview prep all read from here, along with the resume on the Resume tab."
- Removed the Resume card ("Upload or replace the PDF used by matching…" / "Manage resume"). The Resume tab replaces it.
- Removed the "Saved profile" eyebrow. "Unnamed profile" → "Your profile". "Not set" → "Not added yet".
- Edit form section titles: "About you", "What you're looking for", "Skills and coursework", "Projects", "Experience" (was "Experiences"), each with a one-line description.
- New fields: "Career goals" (hint "A sentence or two in your own words.") and "Relevant coursework" (hint "One course per line, or separate them with commas.").
- First-run line: "Start with your target roles and skills. Job matching and interview prep use them first, and everything else can be added later."
- Empty lists: "No projects yet. Class, personal and hackathon projects all count." and "No experience yet. Jobs, internships, research and volunteer roles all count."
- End-date hints: "Leave empty if it's ongoing." / "Leave empty if you're still there."
- Graduation-year errors: "Enter a year, like 2027." and "Enter a year between 1900 and 2100." (Zod's default text was shown before, and only in theory, since errors weren't rendered.)
- "Unable to save profile." → "Your profile didn't save. Try again."
- Load error → "Your profile couldn't be loaded. If this keeps happening, sign out and back in."
- The remove button now reads "Remove" (was a trash icon), and chip suggestions read "Add "X"".

**Resume**
- "Resume workspace" → "Resume". Description → "One PDF. CareerPilot reads its text and uses it alongside your profile for matching, drafts and interview prep."
- "Uploaded resume", "PDF ready" and "Text extraction completed…" → removed. The filename is the heading, with "Uploaded {date} · {size} · {n} characters of text read".
- "Extracted text preview" / "First readable lines" → "What CareerPilot read" / "Start of the text". New hint: "If this looks garbled, the PDF is probably a scan…".
- "No resume uploaded yet." → "No resume yet. Upload a PDF whose text you can select. Scanned images won't work. 5 MB max."
- Privacy line "CareerPilot stores extracted text for later AI analysis only when you explicitly request AI features." → "CareerPilot stores the text it reads from your PDF, and only uses it for AI analysis when you ask for an AI feature." **Please check this matches what the backend actually does.**
- Client-side errors: "Upload a PDF resume." → "That file isn't a PDF. Upload your resume as a PDF."; "Resume PDF must be 5 MB or smaller." → "That PDF is over 5 MB. Upload a smaller file."
- New "Uploading…" state and delete dialog: "Delete your resume? {file} and the text read from it will be removed. This can't be undone."

**Settings**
- "Account and data" → "Settings", with a new description.
- "AI and your control" → "AI features": "The Prepare tools write suggestions and drafts for you to read. Anything that would change your saved data is shown to you for review first." "Open AI agents" → "Go to Prepare".
- "Data controls" paragraph → a "Your data" list saying what each area stores (Profile, Resume, Saved jobs, Applications), including "The PDF file itself isn't kept."

**Errors**
- 404 "This page is not available…" → "Page not found" / "There's nothing at this address." / "The link may be out of date, or the job or application it pointed to was deleted." Buttons "Go to dashboard" and "Applications" (was "AI agents").
- Error page "Something went wrong" is kept as the kicker, plus "This page didn't finish loading." "Dashboard" → "Go to dashboard".

---

## 5. Small interaction additions (flagging in case you'd rather not)

These only change local UI state. No data or API behavior changed.
- **Cancel** on the profile edit form (only shown once a profile exists) and on the job edit form. It discards edits and returns to the read view.
- **Delete confirmations** for job, application and resume (approved §8).
- On Resume, a delete error now shows inside the dialog rather than in the page banner.

---

## 6. Left undone / known issues

- **Seed deadlines are stale.** The seed data's deadlines are in August 2026, which is before today, so "Coming up" and the deadline chips look empty or past on a fresh seed. For the screenshots I moved deadlines in my **local** database only (+3, +9, +14 and +21 days). The seed is backend code, so I didn't touch it. Tell me if you want a seed fix in a separate PR.
- **The profile Save bar** is sticky to the bottom of the window. Full-page screenshots therefore show it floating mid-page; in a browser it sits at the bottom edge.
- **AI result screens** were restyled but not regenerated in this pass (see §2).
- **No dark mode.** The original didn't have one either.
- `frontend/AGENTS.md` and `frontend/CLAUDE.md` are generated by `next dev` and deliberately left uncommitted.

## 7. Worth checking by hand

1. Open the mobile menu at 390px. Tab cycles inside it, Escape closes it, and the page doesn't scroll behind it.
2. Upload a real resume PDF and replace it.
3. Generate a role analysis, then a prep plan, on one job and read the result layout.
4. Generate practice questions and submit one answer for feedback.
5. The resume privacy line in §4.
6. The landing page's "doesn't" list, against what the product promises.

## 8. Commits

```
e39f220 Interview prep: don't repeat the plan hint under the disabled-reason callout
288ec52 Replace remaining arbitrary grid and size values with named tokens
ebda481 Error and 404 pages: wordmark bar, serif headline, plain next steps
25bf94e Sign in and register: pine side panel, wordmark, shared fields with visible errors
6bbd3f2 Landing: serif hero with highlight, sample board showcase, prep evidence, AI does/doesn't band
346f475 Settings: account, data locations and AI note as settings rows
d6dbd9d Resume: file header, extracted-text preview, delete confirmation, error state; keep dialog centred
f22d7f7 Profile: summary header, sectioned edit form, career goals and coursework inputs, visible validation
654bd72 Prepare section and interview practice
a84f21d Application detail: header, form panel, stage timeline, confirm delete
59c194b Jobs: saved list, job detail, manual add-job form
f2464c9 Applications: tinted stage columns, deadline chips, control bar
5050143 Dashboard: greeting, pipeline, Coming up, Recently saved
136c7a6 Shared primitives and top-bar layout shell
c3bf0e2 Design tokens and fonts
daf206d Format frontend with Prettier
f50fdf9 Redesign: v2 design direction with more warmth and character
```
