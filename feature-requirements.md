# MaskLM Web App — Feature Requirements

## Goal

Pivot MaskLM from a pip package to a **web application**. Users
(doctors, lawyers, etc.) paste PII-containing text into a browser
UI, get masked output they can safely paste into any LLM, then
paste the LLM response back to unmask it. No PII ever leaves the
user's browser ↔ our backend boundary.

## Architecture

- **Frontend**: React + Vite + TypeScript → deploy to Vercel
- **Backend**: FastAPI (stateless) + Presidio → deploy to Railway
- **Auth**: deferred (Supabase, after user joins org)
- **History**: localStorage (no encryption for MVP, strict CSP)
- **Server is stateless**: mapping returned to frontend on mask,
  frontend sends it back on unmask. No server-side session storage.

## Non-goals for this iteration

- No modifications to `src/masker.py`, `src/models.py`,
  `src/validation.py`, or any existing file in `tests/`
- No Supabase auth (deferred)
- No CI/CD beyond GitHub Actions CI
- No Docker Compose for local dev
- No multilingual NER or any of the 12 future challenges

## Design Reference

UI prototype in `/tmp/masklm/project/` — Liquid Glass (iOS 26)
style with split layout, dark/light mode, history drawer, tweaks
panel. Mapping is NOT shown to user (handled by backend).

## Tasks

- [x] Task 0: Write `README.md` — verified by: file exists with
  Install, Usage, API reference, Development, Roadmap sections

- [ ] Task 1: Create `.gitignore` + `pyproject.toml` — Python
  artifacts + node_modules + .env; hatchling build, deps for
  core + backend — verified by: `uv sync` completes and
  `uv run pytest tests/` passes 36 existing tests

- [ ] Task 2: Scaffold frontend with `pnpm create vite@latest
  frontend -- --template react-ts`, add Vite proxy config for
  `/api` → `localhost:8000` — verified by: `cd frontend &&
  pnpm install && pnpm run dev` starts without errors

- [ ] Task 3: Write backend tests FIRST (TDD RED phase):
  `backend/tests/conftest.py` + `test_routes.py` covering
  `POST /api/mask` happy path, empty text, double-mask 400,
  `POST /api/unmask` happy path, empty mapping 400, round-trip,
  `GET /api/health` 200 — verified by: tests exist and FAIL
  (no implementation yet)

- [ ] Task 4: Implement backend API (TDD GREEN phase):
  `backend/app/schemas.py` (Pydantic models), `routes.py`
  (3 endpoints), `main.py` (FastAPI app + CORS + security
  headers) — verified by: all Task 3 tests pass and
  `uvicorn backend.app.main:app` starts

- [ ] Task 5: Create frontend API client
  `frontend/src/api/client.ts` + `frontend/src/types/index.ts`
  with `maskText()`, `unmaskText()`, `healthCheck()` —
  verified by: `pnpm run build` compiles without type errors

- [ ] Task 6: Implement main mask/unmask page with Liquid Glass
  UI: `MaskPage.tsx` two-panel split layout, `TextInput.tsx`,
  `MaskResult.tsx` (token chips + copy button), `UnmaskResult.tsx`,
  `Navbar.tsx`. Loading/error states, disabled buttons during
  API calls — verified by: Playwright MCP full mask → unmask
  flow works in browser

- [ ] Task 7: Implement session history with localStorage:
  `useLocalHistory.ts` hook storing `{id, timestamp, originalText,
  maskedText, mapping}`, max 50 entries. `HistoryPanel.tsx` drawer
  with search, re-unmask, re-edit original, edit mapping, delete,
  clear all — verified by: Playwright MCP history persists across
  page refresh

- [ ] Task 8: Port Liquid Glass CSS from design prototype:
  wallpaper blobs, glass primitives, dark/light mode, responsive
  layout, chips, buttons, drawer, toast — verified by: Playwright
  MCP screenshots at desktop + mobile viewports

- [ ] Task 9: Create GitHub Actions CI pipeline:
  `.github/workflows/ci.yml` with `backend-test` (pytest + coverage
  ≥ 80%) and `frontend-build` (pnpm ci + tsc) jobs — verified by:
  push branch, CI passes green

- [ ] Task 10: Create backend Dockerfile for Railway:
  python:3.11-slim, copy src/ + backend/, install deps, download
  spaCy en_core_web_sm, run uvicorn — verified by: `docker build`
  succeeds and container `/api/health` responds

- [ ] Task 11: Create frontend Vercel config: `vercel.json` with
  SPA rewrites + strict CSP headers (`script-src 'self'`) —
  verified by: `pnpm run build` produces clean dist/

- [ ] Task 12: Integration test + security audit: full E2E via
  Playwright MCP, CORS validation, CSP headers present, no PII
  in server logs, all existing 36 tests + backend tests pass,
  coverage ≥ 80% — verified by: all checks green

## Out of scope

- Supabase auth (separate phase after user joins org)
- PyPI publication (no longer the deployment target)
- PII encryption in localStorage
- Any of the 12 future challenges from the old plan
