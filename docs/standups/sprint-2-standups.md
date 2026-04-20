# Sprint 2 — Async Standups

**Sprint window**: 2026-04-17 → 2026-04-21
**Participants**: Daiki, Jason
**Medium**: Slack DM

Three substantive exchanges covering backend deploy, auth completion, 
and frontend deploy + CORS coordination.

---

## 2026-04-18 (Day 1) — Fly.io deploy and handoff

### Jason — 1:47 AM

- Backend deploy complete on Fly.io at `https://masklm-api.fly.dev`.
- Could not deploy the frontend from his side — repo sits under Daiki's 
  GitHub account, so CI/CD secrets aren't accessible to him.
- Handoff: Daiki to deploy the frontend and wire CI/CD (main push → 
  production, PR/branch push → preview).
- Required Vercel env var: `VITE_API_URL=https://masklm-api.fly.dev`.

### Daiki — no response this day

### Outcomes / decisions
- Backend production URL locked in: `https://masklm-api.fly.dev`.
- Frontend deployment ownership transferred to Daiki.

---

## 2026-04-19 (Day 2) — Supabase Auth completion

### Jason — 5:56 PM

- Supabase sign-in / sign-up feature complete (email/password + Google 
  OAuth).
- Handoff: Daiki can deploy to production when ready.
- Stated goal: get CI/CD set up so production becomes hands-off going 
  forward.

### Outcomes / decisions
- Auth implementation complete; Daiki cleared to start the frontend 
  production deploy.

---

## 2026-04-20 (Day 3) — Vercel deploy and CORS coordination

### Daiki — 8:12 AM

- Brief thank-you acknowledgment.

### Daiki — 9:42 AM

- Vercel deploy complete, production URL: `https://mask-lm.vercel.app`.
- Confirmed working: login (email + Google OAuth), UI rendering, 
  navigation.
- Identified remaining blocker: CORS — frontend calls to the Fly.io 
  backend were being blocked because the new Vercel URL wasn't in 
  `ALLOWED_ORIGINS`.
- Requested Jason update the Fly.io secret:
```
  ALLOWED_ORIGINS=https://mask-lm.vercel.app,https://mask-lm-daiki007121s-projects.vercel.app,http://localhost:5173,http://localhost:3000
```
- Provided the exact command: `flyctl secrets set ALLOWED_ORIGINS="..." -a masklm-api`.
- Offered to manage Fly secrets in the future if added as Fly 
  collaborator.

### Daiki — 9:48 AM

- Context switch — would start documentation work (README, reflection, 
  sprint notes) while Jason handled the CORS update.
- Asked Jason to ping when done.

### Outcomes / decisions
- Frontend production URL locked in: `https://mask-lm.vercel.app`.
- CORS update delegated to Jason (has Fly CLI access).
- Daiki began documentation workstream in parallel.
