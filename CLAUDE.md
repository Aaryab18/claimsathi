# ClaimSathi team rules

## Product idea

"The AI reads, the rules judge." The AI only extracts and explains. Legal verdicts come only from tested code in `rules/`.

## Branch ownership

Before changing files, run `git branch --show-current` and work only inside the folders that branch owns:

- `member-a/*`: `api/`, `worker/`, `jobs/`, `pdf-service/`, `render.yaml`
- `member-b/*`: `web/`
- `member-c/*`: `rules/`, `samples/`, `templates/`, `docs/`
- `shared/*`: `contracts/`, root files and anything else, only for changes the whole team agreed in chat

If a task needs files outside the branch's folders, stop and tell the member. Do not edit them.

## Working rules

- Never put API keys or passwords in the code.
- Never work directly on `main`.
- Inspect existing code first and do not rewrite working code without a reason.
- Run tests, typecheck and build before saying something works, and fix failures first.
- At the end of each task, list the files changed and explain the work in simple English.
