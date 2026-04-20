# Sprint 2 Planning — Production Deployment & Rubric Compliance

**Sprint window**: 2026-04-17 → 2026-04-21
**Partners**: Daiki, Jason
**Goal**: Deploy MaskLM to production with auth, wire up CI/CD to Vercel and 
Fly.io, and satisfy the CS7180 Project 3 rubric requirements for Claude Code 
extensibility (hooks, MCP, sub-agents, skills) and team process documentation.

## Scope

### Production deployment
- Supabase Auth — email/password and Google OAuth
- Fly.io backend deploy (`masklm-api.fly.dev`)
- Vercel frontend deploy (`mask-lm.vercel.app`)
- Environment variable management across three envs (local, preview, prod)
- CORS allowlist tightening per environment

### Claude Code extensibility (rubric-driven)
- `.mcp.json` — project-scoped MCP servers (GitHub, Playwright)
- `.claude/agents/security-reviewer.md` — PII + OWASP review sub-agent
- `.claude/settings.json` hooks — PostToolUse ruff-format, Stop pytest
- `CLAUDE.md` expansion — document hooks, skills, MCP, sub-agents, OWASP Top 10

### CI/CD
- New workflow: lint (ruff, ESLint), security (pip-audit, pnpm audit, Gitleaks)
- E2E Playwright test file committed (installation deferred)

### Documentation
- Mermaid architecture diagram in README
- Sprint 1 + Sprint 2 planning and retrospective docs
- Individual reflections (one per partner)
- Technical blog post
- Video demo

## Out of scope for Sprint 2

- Blog post publication and video recording are Daiki's individual 
  deliverables and happen outside the shared branch work
- localStorage encryption — still post-MVP
- `/chat` LLM proxy — still post-MVP
- Fuzzy re-injection — still post-MVP

## Division of labor

- Jason: Supabase Auth implementation, backend Fly.io deploy, CI workflow 
  updates (`ci.yml`, `deploy-fly.yml`)
- Daiki: Vercel deploy and env var setup, Supabase URL configuration, 
  `.claude/` extensibility work, sprint documentation, reflection, blog post, 
  video

## Risks and mitigations

- Risk: CORS blocks the frontend once backend is on Fly — Mitigation: 
  `ALLOWED_ORIGINS` env var with explicit allowlist per environment
- Risk: Supabase OAuth redirect points at localhost after deploy — 
  Mitigation: update Supabase Site URL and Redirect URLs allowlist to 
  Vercel prod + preview pattern + local dev
- Risk: rubric items missed due to last-minute rush — Mitigation: explicit 
  rubric-category-to-task mapping in this plan; dedicated sprint document 
  commits as audit trail
