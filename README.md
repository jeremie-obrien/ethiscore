# EthiScore

Scores a company against 3 custom, weighted ethics criteria using Claude — from the CLI or a
local web UI. Claude researches the company live via web search and returns a per-criterion
breakdown plus a deterministic weighted overall score, with rationale and sources.

## Setup

```
npm install
```

## Web UI

```
npm run dev
```

Open `http://localhost:3000`. First run prompts you to set your Anthropic API key (saved to
`~/.ethiscore/config.json`, mode 600 — never sent back to the browser). Fill in a company and
3 weighted criteria and run the evaluation; results are saved automatically and browsable at
`/history`.

`npm run build && npm start` runs the production build.

## Docker

```
docker build -t ethiscore .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... ethiscore
```

Open `http://localhost:3000`. The container never prompts for a key — pass it via
`ANTHROPIC_API_KEY` (checked before any saved config file). Evaluation history lives at
`/home/nextjs/.ethiscore` inside the container and is lost on removal unless you mount a volume:

```
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... -v ethiscore-data:/home/nextjs/.ethiscore ethiscore
```

## CLI

```
npm run cli:build
```

Interactive (prompts for anything not passed as a flag):

```
node dist/cli/cli.js evaluate
```

Non-interactive:

```
node dist/cli/cli.js evaluate \
  --company "Acme Corp" \
  --criterion "Labor practices" "Environmental impact" "Data privacy" \
  --description "Treatment and pay of workers" "Carbon footprint and pollution record" "Handling of user data" \
  --weight 2 1 1
```

Your Anthropic API key is resolved in this order: `--api-key` flag > `ANTHROPIC_API_KEY` env var >
a one-time interactive prompt (with an offer to save it to `~/.ethiscore/config.json`, mode 600).
The web UI and CLI share the same saved key and the same evaluation history.

Past evaluations are saved as JSON under `~/.ethiscore/evaluations/`:

```
node dist/cli/cli.js list
node dist/cli/cli.js show <id>
```

## Notes

- Weights are relative, not required to sum to 100 — they're normalized automatically.
- Each criterion is scored 0.0–1.0 by Claude and shown as a percentage.
- The overall score is computed in code (not by the model) as a **weighted geometric mean**:
  `overall = Π(score_i ^ normalizedWeight_i)`. Unlike a weighted average, this punishes a very
  low score on any single criterion much harder — a company that's excellent on two criteria
  but scores near 0 on the third still ends up with a low overall score.
- Shared logic lives in `lib/` (framework-agnostic — evaluation, prompt-building, storage,
  config). `cli/` and `app/` are thin, surface-specific layers on top of it.
