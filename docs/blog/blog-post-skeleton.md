# Shipping a Privacy-First LLM Middleware with Claude Code

## Opening

A recruiter screens 200 resumes a week. A corporate lawyer reviews NDAs with client names all over them. A physician summarizes patient notes. All three have the same problem: they have obvious uses for frontier LLMs, and they legally cannot paste the content.

It's not a policy they can opt out of. HIPAA, attorney-client privilege, GDPR, client data governance agreements — these aren't warnings on an onboarding screen. They're the reason the recruiter is still manually redacting resumes in Word at 11 PM.

This is also a gap no frontier LLM solves on its own. Claude, ChatGPT, Gemini — all cloud-native by design, all running prompts through their infrastructure, all with retention policies you have to trust. The architecture itself is the leak. You cannot patch around it from inside the provider.

MaskLM is a different architecture. A middleware sits between the user and the LLM, replaces every piece of PII with a typed placeholder like `[NAME_1]` or `[EMPLOYER_2]` before the text leaves the browser, then unwinds the placeholders when the response comes back. The model sees structure without identity. The user gets useful output without handing over regulated data. The LLM provider never sees anything it could log.

What this post is actually about is less the product and more the workflow. We built MaskLM as a two-person team using Claude Code — my partner Jason on the implementation side, me on planning, deployment, and docs. A few things about that workflow genuinely surprised me. A few things broke in ways I didn't see coming. This is a look at both.

## The architecture decision that made everything else cheap

Early on we had a disagreement about shape. Jason's instinct was to ship MaskLM as a PyPI package — a self-hosted library, nothing running in production, users install it in their own environment. My instinct was a web app — Supabase auth, Vercel deploy, the whole stack. We were talking past each other for about 48 hours.

What broke the tie wasn't the rubric pressure (though that was real). It was recognizing who the actual users are. A HIPAA-bound physician is not going to `pip install` a Python package. Neither is a recruiter at 11 PM. The product needs to meet people in a browser tab, with one-click auth, on a URL their compliance team has blessed. A web app is not a framework preference for this audience — it's the only plausible delivery mechanism.

But the more durable outcome came from a different constraint we both landed on: **the backend never stores PII**. Not in a database, not in a log, not in session memory that survives restarts.

The implication is that the backend is stateless. Every `/mask` request includes the text to mask; it returns the masked text and a mapping. The client holds the mapping. When the user pastes the LLM's response back, the client sends the mapping along with the masked text to `/unmask`, which rebuilds the original.

This matters disproportionately for our target users. When a corporate legal team evaluates a vendor, the question is never "what's your retention policy" — it's "what's your attack surface." A server that has no PII to leak simplifies that conversation enormously. You can read our backend source and confirm there's no database connection, no session persistence, no logging of request bodies. That's a stronger guarantee than a retention policy, because it's structural rather than procedural.

What you buy with the architecture:

- **No session store to leak.** There is no "Daiki's mapping" living on the server. A compromised backend has nothing to exfiltrate.
- **Trivial horizontal scaling.** Any instance handles any request. No sticky sessions, no replicated session state.
- **"What happens if the backend restarts mid-mask?"** Nothing. The next request goes to another instance and succeeds.
- **The privacy promise is verifiable.** You can audit the code path and confirm the guarantee. You don't have to trust us.

The frontend is a Vite + React SPA. The backend is FastAPI running Microsoft Presidio for NER. Supabase handles auth only — email/password and Google OAuth, no PII in the user table. The LLM call itself happens wherever the user copies and pastes (ChatGPT, Claude, whatever). MaskLM is not a proxy for the LLM; it's a proxy for the user's sensitive data.

This decision paid for itself throughout the project. Every time we had a security question, the answer was some form of "there's nothing there to protect, by design."

## Claude Code as the delivery mechanism

I've used Claude for a while, but this was my first serious project with Claude Code. Three things changed how I worked day-to-day.

**GitHub MCP plus `/tdd-feature-v2`.** We wrote a custom slash command for the standard TDD cycle — Phase 0 creates a GitHub issue, then RED (failing tests), GREEN (minimum implementation), REFACTOR (cleanup). Connecting it to the GitHub MCP meant the issue was created from the terminal, its number flowed into every commit as `refs #N`, and at REFACTOR the issue was closed with the three commit hashes linked in. Honestly the part that got me was not having to write commit messages. Claude Code read the staged diff and produced things like `[RED] test: add failing tests for validation (refs #2)` — consistently formatted, actually accurate. That sounds small. It changes the rhythm completely. When the friction of "now I need to write a commit message" goes away, you stop batching changes into big ambiguous commits and just commit the small thing you did.

**Hooks for the boring stuff.** We set a `PostToolUse` hook that runs `ruff format` on any `.py` file after Claude Code edits it, and a `Stop` hook that runs pytest async at the end of a session. The first one means I literally never think about Python formatting anymore. The second means that when I come back after lunch, there's a green/red signal about whether my last batch of edits broke anything, without having to remember to run tests. These are not clever. They are the kind of thing you set up once and then don't think about again — which is exactly the point.

**CLAUDE.md as a contract.** We built up `CLAUDE.md` as the project's constitution — what the architecture is, what the don'ts are ("never log raw PII"), how the TDD cycle works, what skills exist, which sub-agents handle what. Every Claude Code session reads this file into context before doing anything. The effect is that the AI stops suggesting things that violate the design. It doesn't propose adding a session database. It doesn't try to log request bodies. You wrote the rules once, in one place, and the AI enforces them on every session.

The pattern I'd extract: Claude Code wins when it removes friction from work you were already doing correctly. It's less impressive when you ask it to do something novel on every call — which is also fine, just different.

## The deployment chapter

Deployment is the part every side project underestimates and we were no exception. Three moments were genuinely painful.

**The Vercel preset was wrong by default.** Our repo has `pyproject.toml` at the root because the backend lives at the top level alongside `src/`. Vercel auto-detected the project as FastAPI and pre-selected the FastAPI preset. Hit deploy without reading the screen and you get a backend build in a place that's supposed to serve a frontend. Nothing works. The fix is obvious once you know — set the Application Preset to Vite, set the Root Directory to `frontend` — but it's a five-minute trap if you're rushing.

**CORS between Vercel and Fly.io.** Jason deployed the backend to `https://masklm-api.fly.dev` while I was still on localhost. That worked fine. Then I deployed the frontend to `https://mask-lm.vercel.app`, hit "Mask," and got `Failed to fetch`. The backend had an `ALLOWED_ORIGINS` env var, but it didn't include the new Vercel URL. We fixed it with:

```bash
flyctl secrets set ALLOWED_ORIGINS="https://mask-lm.vercel.app,https://mask-lm-daiki007121s-projects.vercel.app,http://localhost:5173,http://localhost:3000" -a masklm-api
```

The frustration wasn't the fix. It was that Jason had flyctl access and I didn't, so I wrote him a Slack message with the exact command and waited. Even with AI on both ends, the waiting didn't go away — it just moved to who had the right permissions.

**Supabase Redirect URLs.** Google OAuth worked perfectly in dev. The first time I tried it on production, it redirected me to `localhost:5175` — because that's what the Supabase redirect allowlist still had configured. The error was a friendly `ERR_CONNECTION_REFUSED`. The fix was adding `https://mask-lm.vercel.app/**`, the Vercel preview URL pattern, and keeping localhost for dev. Five minutes. The discovery took longer than the fix.

The pattern across all three: **the production URL doesn't exist until you deploy.** Any config that depends on it — OAuth redirect lists, CORS origins, env-specific variables — has to be revisited after the first deploy. Treating "URL exists" as a gate rather than an afterthought would have saved us time.

## What we'd do differently

**Deploy on Day 1, not Day N.** We had a working backend on day four and didn't deploy it for several days after that. By the time we did, we had compounded three environment configs (local, preview, prod) into one deploy attempt. Deploying earlier would have surfaced the CORS, preset, and redirect issues one at a time instead of all at once.

**Ship per-entity-type configuration.** The current MVP masks everything Presidio detects. A real lawyer wants to mask client names and monetary values but leave industry terms intact. A physician wants patient names and MRNs masked but diagnosis codes preserved. "Which entity types get masked, per document category" is a setting, not a product pivot — and it's the first thing I'd add post-MVP.

**Daily standup docs, written live.** We had real async conversation in Slack throughout the project — product direction debates, handoffs, technical coordination. But we didn't capture any of it as standup docs until the end, at which point we reconstructed them from scrollback. One markdown file per day, appended as things happened, would have cost five minutes a day and given us a much better timeline of decisions.

**Parallel worktrees from the start.** We worked sequentially on the same branch for most of the project — I'd wait for Jason's implementation to merge before starting docs work, or vice versa. With `git worktree` and Claude Code's parallel-worktrees support, we could have had one worktree for backend implementation and another for CI at the same time, with separate Claude Code sessions holding context on each. We didn't set this up, and it cost us real time.

## Close

If you're a recruiter, a lawyer, a physician, or anyone else who's been told "you can't paste that into ChatGPT" — the live app is at `mask-lm.vercel.app`. Paste any text with names, emails, employers, or phone numbers and see what placeholder substitution looks like in practice.

If you want to try the workflow pieces that mattered most on your own project, the lowest-effort one to start with is a PostToolUse hook that auto-formats after any edit. In `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "ruff format $CLAUDE_TOOL_ARG_file_path 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

Replace `ruff format` with whatever formatter your target language uses. The first time it fires on a file you just edited, you'll understand the appeal immediately.

The bigger claim I'd make, after building MaskLM this way: **Claude Code is at its best when it removes small friction from work you were already doing correctly**, and at its worst when you hand it a mental model that's subtly wrong and ask it to extend from there. The first pattern saves time on every task. The second wastes your time once, dramatically, and then you learn to front-load `git status` and `git log` before letting the AI plan anything.

Both are worth knowing.
