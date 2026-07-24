# House Planner

A free, privacy-first budgeting and house-planning calculator. Everything runs in the
browser — no accounts, no server, no data leaves the user's machine. Plans can be saved
to and loaded from a local file.

## What it does

- **Take-home pay** — enter net directly, or estimate it from gross salary + state
  (federal brackets + FICA + state rate). Single or couple.
- **Down payment savings** — monthly savings compounded at a HYSA rate, plus what % of
  take-home is being saved.
- **Monthly expenses** — presets for single / couple, fully editable.
- **Debt payoff** — time to debt-free from balance, rate, and monthly payment.
- **Savings goals** — monthly amount needed to hit a target (e.g. college) by a date.
- **Mortgage** — 15yr vs 30yr side by side, with closing costs and % of income check.
- **Rent vs Buy** — total cost of renting vs buying over N years, with a verdict.

## Current state

Next.js app with:
- Dashboard calculator at `/` (same UI and math as before, now in React)
- Article pages at `/articles` (read `.md` files from `content/articles/`)
- Privacy policy at `/privacy`
- Built for Vercel (zero-config deployment)

## Tech stack

- **Framework:** Next.js 16+ with React
- **Articles:** Markdown with frontmatter (title, date, description, image)
- **Styling:** CSS Modules + globals
- **Build:** `npm run build` → `.next/` folder (ready for Vercel)
- **Privacy:** All calculation stays client-side. No backend, no data collection.

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run dev server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Deploying

Connect the repo to Vercel — it auto-detects Next.js and deploys with zero config.

## Adding articles

1. Create a `.md` file in `content/articles/`:
   ```markdown
   ---
   title: "Article Title"
   date: "2026-07-24"
   description: "One-line SEO summary"
   image: "/articles/optional-image.jpg"
   ---

   Article body in Markdown...
   ```

2. Images go in `public/articles/`

3. Run `npm run build` and deploy — the article appears automatically at `/articles/slug-name`

## Disclaimer

Tax and mortgage figures are estimates for planning only — not financial or tax advice.
