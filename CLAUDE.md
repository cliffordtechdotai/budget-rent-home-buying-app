# Project instructions for Claude Code

This file tells Claude Code how to work in this repo. Read it before making changes.

## What this project is

A free budgeting + house-planning calculator that will grow into a small content site
(calculator + SEO articles + AdSense/affiliate income). Audience: young professionals,
especially teachers, deciding whether to keep renting or buy — and how long to save first.

## Core principles

1. **Privacy first.** All calculation stays client-side. Do not add analytics, trackers,
   or send user financial inputs to any server without asking me first.
2. **Ship the working thing.** Never leave the app in a broken state between changes.
   `budget-dashboard.html` must always open and calculate correctly.
3. **No premature complexity.** Do not add React, a database, or a backend unless a
   specific feature requires it and I've approved it. Prefer the simplest thing that works.
4. **Explain trade-offs, don't just execute.** If I ask for something that has a downside
   (cost, SEO, maintenance), tell me before doing it.

## First tasks (do these in order, confirm each before moving on)

1. **Harden the math.** Add input validation to `budget-dashboard.html`:
   - Guard against negative numbers, blank fields, and absurd values (e.g. 999% rates).
   - Make sure no calculation ever shows `NaN`, `Infinity`, or `$NaN`.
   - Debt payoff already handles "payment too low" — verify it and add similar guards
     elsewhere.
2. **Add tests for the calculation functions.** Extract the pure math functions
   (`calcMonthlyPayment`, `calcNetIncome`, `calcFederalTax`, `calcDebtPayoffMonths`,
   `calcGoalMonthly`, `amortizationInterestPaid`) into a testable module and write unit
   tests. Use a lightweight runner (e.g. `vitest` or plain `node:test`). Known check:
   a $400k loan at 6.5% over 30 years should be ≈ $2,528/mo.
3. **Set up the repo basics.** Add `.gitignore` (node_modules, .DS_Store, .vercel),
   confirm it runs with `npx serve`, and make the first clean commit.

## Later phases (do NOT start without my go-ahead)

- **Next.js migration:** move the calculator into a Next.js app, add an `/articles`
  route that renders markdown files from a `content/` folder.
- **Articles:** each article is one `.md` / `.mdx` file. I will provide the content.
  Your job is to place it, wire it into the article index/nav, and make sure it renders
  with correct metadata (title, description, date) for SEO.
- **Monetization:** add AdSense to the layout and affiliate links inside articles only
  after there are several articles live.
- **Backend:** only if we add accounts, cloud-saved plans, or AI reports. Use Vercel +
  hosted Postgres. Ask me first.

## Coding style

- Keep it readable over clever. This is my first real project and I want to understand it.
- Comment the non-obvious math.
- Small commits with clear messages.

## What to ask me before doing

- Adding any dependency.
- Anything that costs money (paid APIs, hosting tiers, databases).
- Anything that sends user data off-device.
- Big refactors that touch many files at once.
