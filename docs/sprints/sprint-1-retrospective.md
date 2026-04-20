# Sprint 1 Retrospective — MaskLM Web App MVP

**Sprint window**: 2026-04-14 → 2026-04-17
**Partners**: Daiki, Jason
**Outcome**: All 13 tasks in `feature-requirements.md` completed and committed.

## What went well

- **TDD discipline held**: backend tests were written and committed with 
  `[RED]` prefixes before any implementation (see git log for `[RED]`, 
  `[GREEN]`, `[REFACTOR]` sequences on `tests/` and `backend/tests/`).
- **Stateless design paid off immediately**: no session store to debug, no 
  scaling concerns, and the "what if backend restarts mid-mask?" question 
  had a trivial answer (nothing is lost, the mapping lives with the client).
- **`/tdd-feature-v2` skill replaced manual workflow**: every feature 
  cycle went through Phase 0 (GitHub Issue) → RED → GREEN → REFACTOR with 
  auto-generated commit messages. This kept commit history clean and 
  traceable.
- **Playwright MCP as a verification shortcut**: instead of writing E2E 
  tests upfront, the mask → unmask flow was verified interactively via 
  Playwright MCP at the end of Phase 3. Fast feedback without the overhead 
  of full test setup.

## What didn't go well

- **Pivot cost real time**: the original plan was a pip package. Switching 
  to a web app mid-project required rewriting the README, re-scoping the 
  tasks, and abandoning some existing work. A clearer product decision 
  upfront would have saved a day.
- **Spacy model size surprise**: `en_core_web_sm` (~12 MB) was fine; 
  `en_core_web_lg` (~800 MB) would have blown the Fly.io free tier. We 
  caught this at Task 10 (Dockerfile) — late enough that we had to pin 
  `sm` retroactively.
- **Frontend proxy configuration was non-obvious**: Vite's `/api` proxy 
  to `localhost:8000` worked in dev but broke CORS once the backend moved 
  to Fly.io. This was unblocked by adding `ALLOWED_ORIGINS` as an env 
  variable on Fly, but the discovery cost ~2 hours.

## What we'll try in Sprint 2

- **Add real E2E tests** (not just Playwright MCP interactive runs) so 
  regressions are caught by CI.
- **Explicit CORS plan for each environment** (local, Vercel preview, 
  Vercel prod) documented before deploying.
- **Earlier deployment** — we deployed on the last day of the sprint. 
  Next sprint we'll deploy to a staging URL on Day 1.
- **GitHub Issues for every feature** — `/tdd-feature-v2` does this 
  automatically now, but non-TDD work (docs, CI) was tracked only in 
  `progress.txt`. Moving those to Issues will improve visibility.

## Metrics

- Tasks completed: 13 / 13
- TDD cycles: 3 (validation, re-injection, session store — all RED→GREEN→REFACTOR)
- Test count: 36 passing (as of sprint end)
- Coverage on `src/`: 87%
