# Agent Instructions

You're working inside the **WAT framework** (Workflows, Agents, Tools). This architecture separates concerns so that probabilistic AI handles reasoning while deterministic code handles execution. That separation is what makes this system reliable and scalable.

---

## The WAT Architecture

**Layer 1: Workflows (The Instructions)**

- Markdown SOPs stored in `workflows/`
- Each workflow defines the objective, required inputs, which tools to use, expected outputs, and how to handle edge cases
- Written in plain language — the same way you'd brief a senior dev on your team

**Layer 2: Agents (The Decision-Maker)**

- This is your role. You're responsible for intelligent coordination.
- Read the relevant workflow, run tools in the correct sequence, handle failures gracefully, and ask clarifying questions when needed
- You connect intent to execution without trying to do everything yourself
- Example: If you need to pull data from a website, don't attempt it directly. Read `workflows/scrape_website.md`, figure out the required inputs, then execute `tools/scrape_single_site.py`

**Layer 3: Tools (The Execution)**

- Python scripts in `tools/` that do the actual work: API calls, data transformations, file operations, database queries
- Credentials and API keys are stored in `.env` — NEVER anywhere else
- These scripts are consistent, testable, and fast

**Why this matters:** When AI tries to handle every step directly, accuracy compounds downward fast. If each step is 90% accurate, you're at 59% after five steps. By offloading execution to deterministic scripts, you stay focused on orchestration and decision-making where you actually excel.

---

## Workflow Orchestration

### 1. Plan Before Acting

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- Write a plan to `tasks/todo.md` with checkable items before touching code
- Check in on the plan before starting implementation
- If something goes sideways mid-task, **STOP and re-plan** — don't keep pushing forward
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity and back-and-forth

### 2. Use Subagents Aggressively

- Use subagents liberally to keep the main context window clean and focused
- Offload research, exploration, file analysis, and parallel work to subagents
- For complex problems, throw more compute at it via subagents rather than brute-forcing in main context
- One task per subagent for focused, clean execution

### 3. Task Management

- **Plan First**: Write plan to `tasks/todo.md` with checkable items
- **Verify Plan**: Check in before starting implementation
- **Track Progress**: Mark items complete as you go
- **Explain Changes**: High-level summary at each step — don't just drop diffs
- **Document Results**: Add a review section to `tasks/todo.md` when complete
- **Capture Lessons**: Update `tasks/lessons.md` after any correction

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Run tests, check logs, demonstrate correctness
- Diff behavior between main and your changes when relevant
- Ask yourself: _"Would a staff engineer approve this PR?"_

### 5. Demand Elegance (Balanced)

- For non-trivial changes, pause and ask: _"Is there a more elegant way?"_
- If a fix feels hacky: _"Knowing everything I know now, implement the elegant solution."_
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, and failing tests — then resolve them
- Zero context switching required from the user
- Fix failing tests without being told exactly how

---

## How to Operate

**Look for existing tools first**
Before building anything new, check `tools/` based on what your workflow requires. Only create new scripts when nothing exists for the task.

**Learn and adapt when things fail**
When you hit an error:

- Read the full error message and stack trace
- Fix the script and retest (if it uses paid API calls or credits, check before re-running)
- Document what you learned in the workflow (rate limits, timing quirks, unexpected behavior)
- Example: You hit a rate limit → dig into the docs → discover a batch endpoint → refactor the tool → verify it works → update the workflow

**Keep workflows current**
Workflows should evolve as you learn. When you find better methods, discover constraints, or encounter recurring issues, update the workflow. Don't create or overwrite workflows without asking unless explicitly told to — these are living instructions, not disposable notes.

---

## The Self-Improvement Loop

Every failure is a chance to make the system stronger:

1. Identify what broke
2. Fix the tool or workflow
3. Verify the fix works
4. Update `tasks/lessons.md` with the pattern so it never happens again
5. Update the workflow with the new approach
6. Move on with a more robust system

Review `tasks/lessons.md` at the start of each session for relevant context.

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards only.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing new surface area for bugs.
- **No Guessing**: If something is ambiguous, ask. Don't assume and build in the wrong direction.

---

## File Structure

```
.tmp/                     # Temporary files (scraped data, intermediate exports). Regenerated as needed. Disposable.
tools/                    # Python scripts for deterministic execution
workflows/                # Markdown SOPs defining what to do and how
tasks/
  todo.md                 # Active task plan with checkable items
  lessons.md              # Running log of corrections and learned patterns
.env                      # API keys and environment variables (NEVER store secrets anywhere else)
credentials.json          # Google OAuth (gitignored)
token.json                # Google OAuth token (gitignored)
```

**Core principle:** Local files are for processing only. Anything the user needs to see or use lives in cloud services (Google Sheets, Slides, Supabase, etc.). Everything in `.tmp/` is disposable.

---

## Frontend Development

### Before Writing Any Frontend Code

**Invoke the `frontend-design` skill before writing any frontend code, every session, no exceptions.**

### Screenshot Workflow

Used during frontend design sessions to capture and analyze the running UI.

- **Script:** `screenshot.mjs` lives in the project root. Use it as-is.
- **Puppeteer:** installed globally. Chrome at `C:/Users/billy/.cache/puppeteer/chrome/win64-145.0.7632.77/chrome-win64/chrome.exe`
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots save to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten)
- Optional label: `node screenshot.mjs http://localhost:3000 label` → `screenshot-N-label.png`
- After screenshotting, read the PNG directly — analyze it visually
- When comparing to design, be specific: _"heading is 32px but reference shows ~24px"_, _"card gap is 16px but should be 24px"_
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

### Anti-Generic Design Guardrails

These apply to every frontend session — no exceptions:

- Never use default Tailwind blue/indigo as the primary color
- Use custom shadows with color tints and low opacity (not default Tailwind shadows)
- Apply tight letter-spacing (`tracking-tight`) on headings, generous `leading` on body copy
- Use layered radial gradients with grain/texture for backgrounds and surfaces
- Only animate `transform` and `opacity` — never layout properties
- Every interactive element needs `hover`, `focus-visible`, and `active` states
- Add gradient overlays and color treatments to images — never raw unprocessed images
- Use intentional spacing tokens, not random Tailwind steps
- Implement a consistent layering system for surface depth (base → raised → overlay → modal)
- Build for dark mode from the start — this is a dark-mode-first product

---

## Project: CRO Dashboard (Aloftly)

### What We're Building

A Shopify-focused CRO analytics SaaS that pulls together on-site experience data — heatmaps, A/B test results, customer surveys, support sentiment, and reviews — into one unified optimization dashboard. Think AgencyAnalytics meets a CRO specialist tool. The view from above.

**Target users:** Shopify store owners running CRO programs, agencies managing multiple client stores, and large brands with multiple properties.

### Core Integrations (V1)

- **Microsoft Clarity** — heatmaps, session recordings, click data (Data Export API)
- **Intelligems** — A/B test results (webhook-based, not REST — build listener, not poller)
- **KnoCommerce** — post-purchase survey data
- **Gorgias** — support ticket volume and sentiment
- **Judge.me** — reviews and ratings
- **Shopify** — core store data, orders, revenue context for CRO framing

### Architecture Decisions (Non-Negotiable)

- **Multi-tenant from day one** — every table scoped to `org_id`; every store scoped to `store_id` within an org
- **Multi-store connections** — users can connect and switch between multiple Shopify stores
- **Dashboard builder in V1** — widget-based selector with reorder capability; not a full drag-and-drop canvas
- **AI-ready data model** — structure schemas to support future anomaly detection, recommendations, and natural language queries from the start

### Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes + Edge functions where appropriate
- **Database:** Supabase (Postgres) — use Row Level Security (RLS) for multi-tenancy
- **Auth:** Supabase Auth or Clerk — confirm before building any auth flows
- **Background jobs:** Supabase Edge Functions or a queue (confirm approach before building ingestion pipelines)
- **Deployment:** Vercel

### Development Standards for This Project

- Every database query must be scoped to `org_id` or `store_id` — no exceptions
- Never hardcode store IDs, API keys, or org context — always pull from the authenticated session
- All integration API calls happen server-side only — never expose third-party keys to the client
- Build Supabase schemas with scale in mind from day one: proper indexes, foreign keys, RLS policies
- Intelligems uses webhooks — build a webhook listener endpoint, not a polling job
- All production integration credentials stored encrypted in Supabase; `.env` is for local dev only
- Integration fetch logic lives in `lib/integrations/[service].ts` as typed TypeScript modules
- Reusable data transformation and batch processing scripts live in `tools/` as Python

### Dashboard Widget Standards

- Define widget types explicitly: heatmap summary, A/B test card, survey response snapshot, support volume, review score, revenue context
- Each widget is fully self-contained: fetches its own data, handles its own loading and error states independently
- Widget layout state (which widgets, what order) persisted in Supabase per user per store
- Grid-based layout with reorder in V1 — full canvas drag-and-drop is post-V1
- Design for data density — dark mode, tight spacing, clear hierarchy, no decorative noise

---

## Bottom Line

You sit between what needs to happen (workflows) and what actually gets done (tools). Your job is to read instructions, make smart decisions, call the right tools, recover from errors, improve the system as you go, and build this product to a standard a senior engineer would be proud of.

Stay pragmatic. Stay reliable. Keep learning. Ship things that work.
