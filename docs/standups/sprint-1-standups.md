# Sprint 1 — Async Standups

**Sprint window**: 2026-04-14 → 2026-04-17
**Participants**: Daiki, Jason
**Medium**: Slack DM

Four distinct exchanges across the sprint, covering the product-shape 
debate and its resolution.

---

## 2026-04-14 (Day 1) — Kickoff plan

### Jason — 12:25 AM (04-15, treated as Day 1 late-night)

- Proposed MaskLM P3 as a self-hosted PyPI package (`pip install masklm`), 
  arguing a SaaS shape would compromise the privacy-first design.
- Confirmed the existing core (`src/masker.py`, `models.py`, `validation.py`, 
  36 passing tests) would not be touched.
- Planned scope: thin wrapper adding library API + FastAPI HTTP API + CLI 
  launcher (`masklm serve`). ~300 lines across `src/__init__.py`, `src/api.py`, 
  `src/cli.py`, `tests/test_api.py`, `pyproject.toml`, `README.md`, `.gitignore`.
- Out of scope: CI, Docker, frontend, any modification to existing core.
- Listed deferred challenges for post-MVP: fuzzy re-injection, streaming 
  unmask, multilingual NER, k-anonymity, eval harness.

### Daiki — no response this day

### Outcomes / decisions
- Direction **proposed** but not confirmed.
- Jason to begin implementation the following day.

---

## 2026-04-15 (Day 2) — UI/Supabase alignment

### Daiki — 12:21 PM

- Asked to align on UI/UX design direction and whether Supabase should 
  be used.
- Proposed a quick sync before or after class.

### Jason — 10:34 PM

- Pushed back on Supabase — argued a database was unnecessary for an 
  installable library since MaskLM "isn't a SaaS platform or a web 
  application."

### Outcomes / decisions
- Fundamental product-shape disagreement surfaced (library vs. web app).
- Unresolved at end of day.

---

## 2026-04-16 (Day 3) — Rubric-driven pivot

### Daiki — 9:13 AM

- Re-read the P3 rubric after the prior day's disagreement.
- Identified explicit rubric requirements: full-stack web app, database, 
  authentication, public Vercel URL.
- Concluded a PyPI package alone would lose significant points on 
  Application Quality (40 pts) and CI/CD (35 pts).
- Proposed saving PyPI work on a post-P3 branch and pivoting to a web app.
- Proposed web app shape: paste/upload text → mask PII → copy/download 
  masked result, reusing the existing Python core.
- On the database question: agreed PII must never be stored; proposed 
  using Supabase for account/auth data only.

### Jason — 11:15 AM

- Suggested asking the professor that day.
- Questioned whether Next.js specifically was required or just a 
  recommendation.
- Asked what the web page would actually do — chatbot? proxy?

### Outcomes / decisions
- Pivot direction on the table, professor confirmation pending.
- Web app shape partially specified; UX details still open.

---

## 2026-04-17 (Day 4) — GitHub org invitation

### Jason — 6:49 PM

- Reported the CS7180 Project GitHub org invite had expired.
- Requested re-issue.

### Daiki — 1:24 PM

- Acknowledged, re-invited Jason to the GitHub org and to the shared 
  Supabase project.

### Outcomes / decisions
- Jason re-admitted to both shared resources.
- Sprint 1 closing with web-app direction effectively confirmed; 
  implementation work proceeding.
