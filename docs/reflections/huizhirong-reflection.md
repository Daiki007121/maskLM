# Project 3 Reflection — Huizhirong (Jason)

## Where this project came from

The idea for MaskLM started from a pretty ordinary frustration. A friend of mine works in recruiting and told me she basically couldn't use ChatGPT to help screen resumes — sending a stranger's name, phone number, and employment history into a third-party API just felt wrong, and depending on where the candidate was, it was legally wrong too. Daiki ran into a similar story from the legal side: lawyers who'd love to have an LLM summarize an NDA but can't paste client names into a public model.

So the pitch to ourselves was small and concrete: what if the LLM never saw the PII in the first place? Mask the sensitive bits client-side (well, server-side in our case), send the placeholdered version to the model, and swap the originals back into the response. A thin middleware, not a whole new model. That's the whole project.

## How the masking actually works

The heavy lifting is done by Microsoft's [`presidio-analyzer`](https://github.com/microsoft/presidio), which wraps a spaCy NER pipeline (we ship `en_core_web_sm` in the Docker image). Presidio gives you `AnalyzerEngine.analyze()` — you pass in text and a list of entity types (`PERSON`, `EMAIL_ADDRESS`, `PHONE_NUMBER`, `ORGANIZATION`, etc.), and it returns a list of spans with a confidence score each. That's roughly one line of presidio.

The rest is glue that I ended up writing in [src/masker.py](src/masker.py):

- **Type mapping.** Presidio's entity types are generic; we wanted typed placeholders like `[NAME_1]`, `[EMPLOYER_2]`. `PRESIDIO_ENTITY_MAP` translates `PERSON → NAME`, `ORGANIZATION → EMPLOYER`, and so on.
- **Confidence threshold for orgs.** Presidio will flag basically any capitalized noun phrase as `ORGANIZATION` at low confidence. We drop any `EMPLOYER` entity below `0.7` — otherwise the résumé's "Objective" section gets masked into placeholders.
- **Overlap resolution.** Sometimes the analyzer returns `"John Smith"` as `PERSON` *and* `"Smith"` as `PERSON` separately. `_resolve_overlaps()` keeps the longer span, breaking ties on confidence.
- **Deterministic numbering + deduping.** If `"Jane Doe"` appears three times in one résumé, all three instances get replaced with the same `[NAME_1]` so the mapping is bijective. New unique values get the next index for that type.
- **Reverse-order substitution.** Replacements happen in reverse offset order so earlier character positions don't shift under us mid-loop.
- **Session store, memory-only.** Each mask call gets a fresh `uuid4().hex` session id. The `placeholder → original` mapping is stored in an in-process `SessionStore` and is never written to disk or logged. On re-inject the frontend sends back the session id and we swap originals back in with a single `re.sub` over the `[A-Z]+_\d+]` pattern.

The part that took the longest wasn't the happy path — it was the edge cases. What happens if the user's input already contains text that looks like a placeholder? (We raise `ValueError` and make them pre-clean.) What about empty/whitespace input? (Return unchanged, empty mapping.) Those fell out of the RED-phase tests, which is exactly why TDD is worth the friction.

## The Claude Code feature I'd keep

For me the biggest workflow shift was running TDD as a strict Red → Green → Refactor cycle with `/tdd-feature-v2` driving commits. I'd been doing "TDD" before in the loose sense of "I'll write a test at some point," which is just called programming. With the skill enforcing phase order and auto-generating commit messages like `[RED] test: add failing tests for placeholder re-injection`, the discipline actually stuck. Skimming `git log --oneline` now reads like a history of intents, not just file changes, which also made code review way easier for Daiki on the other side.

The one Claude Code feature I didn't lean on but want to next time is **plan mode** before large changes. I ended up doing the pnpm migration and the Fly deploy pretty ad-hoc and broke the Dockerfile build order twice because I hadn't actually thought through the dependency install step. A written plan would have saved me the two fix commits.

## The debugging moment that stuck with me

Mine wasn't a fancy bug — it was the Dockerfile build order. I had `pip install .` running before `COPY src/`, which meant `setuptools` couldn't find the package at install time. Locally everything worked because I'd already `pip install -e .`'d years ago. In the Fly build it blew up immediately.

What struck me was how fast Claude Code diagnosed it once I actually pasted the build log in. I'd spent 20 minutes staring at the Dockerfile convinced the issue was with the spaCy model download. The model was fine. The build order was wrong. The lesson wasn't "Claude is smart" — it was "stop guessing, paste the actual error." I've caught myself now trying to describe a failure to Claude instead of just handing over the raw output, and the raw output almost always wins.

## On pairing with Daiki

Working with Daiki the split was natural: he took planning, docs, deploy strategy, and reviews. I took backend, frontend, CI, and the actual Fly/Supabase setup. Neither of us had to context-switch between "designer" and "implementer" hats every hour, and both of our Claude Code sessions got noticeably better at our respective patches over the two weeks — mine got sharper on `src/` and `backend/app/`, his got sharper on `docs/` and the task checklists.

The friction point was access. I had `flyctl` and the Supabase project, Daiki didn't. When the prod CORS issue came up after his Vercel deploy, the fix took 90 seconds once I ran the command — but the handoff itself took a day because I wasn't at my desk. AI on both sides didn't remove that. Next project I'd pre-share infra access on day one so either of us can unblock production, not just the person who happened to own the credentials.
