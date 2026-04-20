# Sprint 2 Retrospective — Production Deployment & Rubric Compliance

**Sprint window**: 2026-04-17 → 2026-04-21
**Partners**: Daiki, Jason

## What went well

- **Deployment split cleanly across owners**: Jason handled Fly.io backend 
  and built the Supabase Auth implementation; Daiki handled Vercel frontend, 
  environment variables, and Supabase URL configuration. Neither blocked 
  the other after the initial CORS conversation.
- **`pre-rubric-work` tag as a safety anchor**: before starting the 
  Claude Code extensibility work, Daiki tagged the current `main` so any 
  experiment on `feat/claude-code-mastery` could be fully reverted. This 
  removed the psychological barrier to making larger changes.
- **Hooks survived real edits**: the `PostToolUse` ruff-format hook fired 
  during CLAUDE.md edits (correctly no-oped on `.md` files) and never 
  blocked work. The Stop hook was set up with async + `stop_hook_active` 
  guard to prevent infinite loops — this defensive design held.
- **OWASP walk-through forced real thinking**: writing an OWASP section 
  in CLAUDE.md wasn't a check-box exercise. It surfaced the fact that 
  `A06: Vulnerable Components` was under-documented and led to pinning 
  `npm audit` / `pip-audit` as a real CI addition.

## What didn't go well

- **Git branch confusion early in the sprint**: at one point we incorrectly 
  believed `main` was behind `dev` (based on a misread GitHub UI message). 
  Cleared up after a proper `git log dev..main --oneline` but it cost ~30 
  minutes of confused debugging.
- **Vercel default preset guessed wrong**: Vercel detected the repo as 
  FastAPI (because `pyproject.toml` is at the root) and pre-selected that 
  preset. Catching this required reading the configuration screen 
  carefully; a less-attentive first deploy would have built the wrong 
  thing.
- **Standup cadence was irregular**: messages happened but they weren't 
  consistently captured in a standup doc. We reconstructed standups 
  from Slack logs at the end of the sprint, which is not ideal.
- **Supabase Redirect URLs forgot production**: the OAuth redirect config 
  initially only had `localhost:5175`. First attempt at Google sign-in 
  on prod bounced to localhost (ERR_CONNECTION_REFUSED). Fixed in minutes 
  once identified but caught us off guard.

## What we'll carry forward

- **Deploy-first when platforms are involved**: especially for OAuth apps, 
  the production URL needs to exist before Redirect URL configuration can 
  be correct. Treat "URL confirmed" as a gate, not an afterthought.
- **Daily standup doc, not retroactive reconstruction**: one markdown file 
  per day of the sprint, appended live. This also gives us better material 
  for the retrospective.
- **Platform presets deserve skepticism**: Vercel, Railway, Fly all try 
  to detect project type. Always verify the preset before hitting deploy.

## Metrics

- Deployment targets achieved: 2 / 2 (Vercel prod, Fly.io prod)
- Claude Code extensibility items added: 5 (hooks, MCP config, sub-agent, 
  CLAUDE.md expansion, OWASP docs)
- New CI jobs added: 5 (ruff format, ruff lint, pip-audit, pnpm audit, 
  Gitleaks)
- Test count: 36 existing passing + 1 E2E spec committed (not yet 
  installed in CI)
- Documentation files added: 4 sprint docs, 1 reflection skeleton, 1 blog 
  skeleton
