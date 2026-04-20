# Shipping a Privacy-First LLM Middleware in Two Weeks with Claude Code

> **Target venue**: Medium or dev.to
> **Target length**: 1,500–2,500 words
> **Target audience**: Developers curious about AI-assisted workflow, 
> not privacy experts

This is a skeleton. Each section has a goal, a rough word budget, and a 
list of concrete moments from the actual project to mine for examples. 
Replace the prompts with real prose before publishing.

## Opening hook (~150 words)

Goal: convince a skeptical developer to keep reading past the first paragraph.

Ideas to work from:
- The HIPAA / NDA / resume screening problem: real people can't send raw PII 
  to frontier LLMs, but they want to use them.
- Your own "aha" moment from the project — was there one?
- Contrarian take: "we didn't use Next.js, and it was fine"

## The architecture decision that made everything else cheap (~300 words)

Goal: explain why the stateless backend is the pivotal choice.

- Client holds the mapping. Server processes text and forgets.
- What this buys you: no session store to leak, no DB to secure, trivial 
  horizontal scaling, "what if the backend restarts mid-mask" answers 
  itself.
- Tradeoff: the client sends the mapping back on unmask. Slightly more 
  bytes over the wire. Worth it.

## Claude Code as the delivery mechanism (~500 words)

Goal: show, don't tell, how Claude Code changed day-to-day work.

Concrete moments to pick 2–3 of:
- The `/tdd-feature-v2` skill and how Phase 0 (GitHub Issue) changed 
  the rhythm
- The PostToolUse ruff-format hook ending the "did I remember to 
  format?" class of bugs
- The security-reviewer sub-agent and what it flagged (if anything)
- The moment CLAUDE.md's "no PII in logs" rule pre-empted a careless 
  print statement
- The `pre-rubric-work` safety tag as a psychology hack

## The deployment chapter (~400 words)

Goal: honest about what took longer than expected.

Moments:
- CORS configuration mismatch between local, preview, and prod
- The Vercel preset misdetection as FastAPI
- The Supabase Redirect URL bouncing to localhost on first prod sign-in
- What a "production ready" auth flow actually needed

## What we'd do differently (~200 words)

Goal: show the project isn't pretending to be perfect.

Candidates:
- Deploy on Day 1, not on Day N
- Daily standup docs written live, not reconstructed
- Enable parallel worktrees earlier
- Decide the stack pre-approval, not mid-pivot

## Close (~150 words)

Goal: give the reader one concrete thing to try.

- Link to the repo
- Link to the deployed app
- Suggest trying `/tdd-feature-v2` on their own project, or setting up 
  a single PostToolUse hook to auto-format their target language

---

## Concrete details to weave in (cheat sheet)

- `mask-lm.vercel.app` — production URL
- `masklm-api.fly.dev` — backend URL
- 87% coverage on `src/`
- 36 passing tests pre-E2E
- Presidio + spaCy `en_core_web_sm` as the NER engine
- 12 tasks in `feature-requirements.md` completed in Sprint 1
- Typed placeholders: `[NAME_1]`, `[EMAIL_1]`, `[PHONE_1]`, `[EMPLOYER_1]`
- Sprint 1 window: Apr 14 → Apr 17
- Sprint 2 window: Apr 17 → Apr 21
- `pre-rubric-work` tag as the explicit "safe to revert to" marker
- Two hooks: PostToolUse ruff-format, Stop pytest (async, non-blocking)
- Two MCP servers: GitHub, Playwright
- One sub-agent: security-reviewer
