# How ClaimSathi works

## From upload to result

```mermaid
flowchart TD
    U[Person uploads letter, policy and bill] --> W[Website]
    W --> A[API checks file type and size]
    A --> DB[(Postgres: files deleted after 24 hours)]
    A --> Q[Reads one case at a time]
    Q --> G[Gemini copies facts into a fixed format]
    G --> C[Clean the answer: unsupported values become unknown]
    C --> V[Check quotes against the PDF's text, no AI]
    V --> R[Rules engine decides each deduction, no AI]
    R --> DB
    DB --> W
    W --> D[Result, evidence, letters and deadlines]
```

## What the AI can and can't do

```mermaid
flowchart LR
    subgraph AI["The AI reads"]
        G[Copies facts from documents]
    end
    subgraph Code["Tested code judges"]
        C[Checks the answer] --> Q[Checks quotes] --> R[Rules R1 to R8] --> L[Letters and deadlines]
    end
    G --> C
    P[Person confirms or corrects facts] --> R
```

Correcting a fact skips the AI completely, so the result changes instantly.

## When things go wrong

```mermaid
flowchart TD
    B[Gemini model is busy] --> T[Try again, then the next free model]
    T -->|Works| OK[Live result]
    T -->|All busy| S{Are these our exact sample PDFs?}
    S -->|Yes| SR[Saved reading, labelled as a sample]
    S -->|No| F[Clear message: try again later]
```

A saved reading can only match our own files, by their fingerprints, so a real document can never receive someone else's result.

## Hosting

| Part | Render service | Plan |
|---|---|---|
| Website | `claimsathi-web` | Free static site |
| API, including document reading | `claimsathi-api` | Free, sleeps when idle |
| Database | `claimsathi-db` | Free, expires after 30 days |
| Queue | `claimsathi-queue` | Free, set up but not used yet |

The free plan has no background worker, so the API reads documents itself. With paid hosting, that step could move to a separate worker.
