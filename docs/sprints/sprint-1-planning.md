# Sprint 1 Planning — MaskLM Web App MVP

**Sprint window**: 2026-04-14 → 2026-04-17
**Partners**: Daiki, Jason
**Goal**: Pivot MaskLM from a pip package plan to a stateless web app, ship a 
working mask → unmask UI with backend CI and deployable artifacts.

## Scope

Tasks 0 through 12 in `feature-requirements.md`:

- Task 0: Write initial README (pre-pivot)
- Task 1: Project scaffolding — `.gitignore`, `pyproject.toml`, uv
- Task 2: Frontend scaffold — Vite + React + TypeScript
- Task 3: Backend API tests (TDD RED phase)
- Task 4: Backend API implementation (TDD GREEN phase)
- Task 5: Frontend API client + TypeScript types
- Task 6: Main mask/unmask page with Liquid Glass UI
- Task 7: Session history with localStorage
- Task 8: Liquid Glass CSS styling
- Task 9: GitHub Actions CI pipeline
- Task 10: Backend Dockerfile
- Task 11: Frontend Vercel config
- Task 12: Integration test + security audit

## Acceptance criteria per task

Each task has a `verified by` clause in `feature-requirements.md`. Sprint is 
complete when all 13 tasks are checked off and CI is green on `main`.

## Out of scope for Sprint 1

- Supabase auth (deferred to Sprint 2)
- Production deployment (deferred to Sprint 2)
- localStorage encryption (deferred post-MVP)
- Multilingual NER (post-MVP)

## Division of labor

- Jason: implementation across full stack (backend routes, frontend components, 
  Vite config, Dockerfile)
- Daiki: planning, TDD cycle supervision, CI setup, Playwright MCP 
  verification, documentation

## Risks and mitigations

- Risk: Presidio false positives on organization names → Mitigation: confidence 
  threshold of 0.7 on ORGANIZATION entity
- Risk: double-masking if LLM output still contains placeholders → Mitigation: 
  reject input that already looks like placeholder format (HTTP 400)
- Risk: server-side session storage turning into a PII leak vector → 
  Mitigation: fully stateless backend, mapping lives only in client
