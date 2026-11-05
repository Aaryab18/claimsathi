# ClaimSathi

ClaimSathi explains health insurance claim deductions in India, in English and Hindi.

**The AI reads, the rules judge.** The AI only extracts and explains. Legal verdicts come only from tested code in `rules/`.

Live site: https://claimsathi-web.onrender.com

## Project status

Working now:

- The website, with a sample case, result breakdown, evidence view and Hindi
- A tested rules engine
- A first version of the API

In progress:

- Connecting the website to the API
- Live document reading with AI
- Appeal letters and deadline tracking

Legal references are still being checked against official text.

## Getting started

You need Node 22 (see `.nvmrc`).

```
npm install
npm run typecheck
npm test
npm run build
```

## Folders

| Folder | Purpose | Owner |
| --- | --- | --- |
| `contracts/` | Shared data shapes used across the project | Whole team |
| `rules/` | Tested code that decides legal verdicts | Member C |
| `api/` | Backend web server | Member A |
| `worker/` | Background task runner | Member A |
| `jobs/` | Scheduled and one-off tasks | Member A |
| `pdf-service/` | PDF handling (not built yet) | Member A |
| `web/` | The website people use | Member B |
| `samples/` | Made-up example documents for testing | Member C |
| `templates/` | Document templates | Member C |
| `docs/` | Project documentation | Member C |
| `scripts/` | Team tooling, such as the ownership check | Whole team |

See `CLAUDE.md` for the team rules and branch ownership.
