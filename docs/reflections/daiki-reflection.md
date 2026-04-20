# Project 3 Reflection — Daiki

## 1. Which Claude Code feature changed your workflow the most on this project, and why?

The Claude Code feature that changed my workflow the most was the GitHub MCP. Before MCP, the TDD cycle had a bunch of tiny interruptions — switching to the browser to file an issue, thinking up a commit message that actually described the phase, going back to GitHub to link things up. Each step was small, but they stacked up and broke the rhythm.

With `/tdd-feature-v2` plugged into GitHub MCP, the whole thing just flowed. I'd describe the feature, Claude Code would open the issue, its number would show up in every commit as `refs #N`, and at REFACTOR time the issue got closed automatically with the three commit hashes linked in. Honestly the part that got me was not having to write commit messages. Claude Code read the staged diff and produced things like `[RED] test: add failing tests for X (refs #2)` — consistently formatted, actually accurate. It sounds small, but once you don't have to pause and write a message every few minutes, the TDD cycle just clicks.

## 2. What was the hardest debugging or architectural decision in this project, and how did Claude Code help or not help?

The hardest debug wasn't actually a code bug — it was me and Claude getting stuck together on a wrong assumption about the repo. Jason had been pushing straight to `main`, but I'd glanced at GitHub and thought `dev` was the latest. I told Claude that, and Claude just rolled with it. We spent like 15–20 minutes making plans on top of that wrong picture before I finally went "wait, let me actually check" and ran `git log main..dev --oneline`.

Here's what I noticed: Claude reconstructed the real state fast once I pointed out the contradiction. But before that, it never questioned my version of reality — it just built on it. That's a pretty real failure mode of working with AI. If you hand it a busted mental model, it'll happily keep layering stuff on top, because LLMs mostly work off what you give them.

The lesson wasn't "don't trust AI." It was more like: AI is only as good as the context you drop on it, and "let me just double-check" is still worth doing even when the AI sounds confident. Ever since that day I've been running `git status` and `git log` before letting Claude plan anything around the repo.

## 3. What's one Claude Code feature you didn't use on this project but would use next time?

Something I didn't really use this time but want to try next project is agent teams (with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Right now when I use Claude Code, it's basically one agent doing everything in sequence — plan, implement, test, commit. That works fine for small features, but on this project I could already feel the limit: on bigger changes I'd want one agent focused on writing the code while another runs tests and a third checks security, all in parallel. Doing that sequentially with one agent ate real time.

The other thing I want to get consistent on is the writer/reviewer pattern on every PR. We did it on PR #3 and #4, but it wasn't a habit — it happened because the rubric pushed us toward it. Next project I want a reviewer sub-agent running on every PR by default, not just the ones where I remember to invoke it.

## 4. What did working with Jason teach you about AI-assisted pair development?

Working with Jason taught me that pairing on an AI-assisted project is still about playing to different strengths. Jason took implementation (backend, frontend, CI), I took planning, deploy, and docs. If we hadn't split it, both of us would've just been nodding at each other's Claude Code sessions, which doesn't really help anyone.

The surprise was that the split helped Claude too. Jason's Claude Code kept getting better at src/, backend/, frontend/src/ because that's where he worked. Mine got better at .claude/, docs/, and CI. Each of us had an AI that actually knew our patch, which was faster than one shared AI trying to juggle everything.

The other side of it: the last part of the project was me just waiting on Jason to update Fly.io CORS because I didn't have flyctl access. Even with AI on both ends, the waiting didn't go away — it just moved to who had the permissions. Next time I'd set up shared access from day one so either of us can unblock the other.
