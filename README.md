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

Single self-contained file: `budget-dashboard.html`. Open it in any modern browser
(Chrome/Edge recommended for the file save/load feature). No build step.

## Tech direction

- **Now:** static HTML/CSS/JS. Deploys to Vercel as-is.
- **Next:** migrate to Next.js to add markdown-driven article pages under `/articles`.
- **Later (only when a feature needs it):** a hosted Postgres (Neon/Supabase) for user
  accounts, cloud-saved scenarios, or AI report generation.

## Running locally

Just open the HTML file, or serve the folder:

```bash
npx serve .
```

## Deploying

Connect the repo to Vercel, or drag-and-drop the folder at vercel.com. No config needed
for the static version.

## Disclaimer

Tax and mortgage figures are estimates for planning only — not financial or tax advice.
