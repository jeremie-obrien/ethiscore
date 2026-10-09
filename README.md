# EthiScore

Scores a company against custom, weighted ethics criteria using Claude. Claude researches the
company live via web search and returns a per-criterion breakdown plus a deterministic weighted
overall score, with rationale and sources.

It's a multi-user web app:

- **Accounts:** visitors sign in with an emailed link (Supabase Auth, no passwords).
- **Privacy:** each user's evaluations and criteria sets are private to them, enforced by
  row-level security in the database (`supabase/migrations/`). Three built-in criteria sets
  (ESG, Environment, Innovation) are shared read-only with everyone.
- **Bring your own key:** each visitor supplies their own Anthropic API key. It stays in their
  browser (sessionStorage, or localStorage if they tick "remember"), is sent with each
  evaluation request, and is never stored or logged on the server.

## Setup

```
npm install
```

### Supabase (one-time)

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. **SQL Editor → New query**: paste `supabase/migrations/0001_init.sql` and run it.
3. **Authentication → URL Configuration**: set **Site URL** to the deployed address (e.g.
   `https://ethiscore.vercel.app`), and add these to **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://ethiscore.vercel.app/**` (your deployed address)
4. **Authentication → Emails → Templates**: in both **Confirm signup** and **Magic Link**,
   replace `{{ .ConfirmationURL }}` with
   `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`. With the default link format,
   sign-in only works in the browser that requested the link. Also include the one-time code,
   e.g. `<p>Or enter this code on the sign-in page: <strong>{{ .Token }}</strong></p>`, so
   people reading the email on another device can type it on the sign-in page.
5. Copy `.env.example` to `.env.local` and fill in the Project URL and publishable/anon key.

### Free evaluations (optional)

Signed-in users get a few free evaluations a month on EthiScore's own Anthropic key: 3 per
calendar month per email (Gmail dots and `+tag` collapsed; `+tag` aliases get none), per
network (IPv4 address or IPv6 /56) and per browser (httpOnly `es_bid` cookie), plus a global
daily cap. Counts live in `free_evaluation_claims`, readable only with the Supabase secret key.

1. Run `supabase/migrations/0002_free_evaluations.sql` in the SQL Editor.
2. Set the server-only variables listed in `.env.example` (`FREE_TIER_ANTHROPIC_API_KEY`,
   `SUPABASE_SECRET_KEY`, `FREE_TIER_HASH_SECRET`, optional limits) in Vercel, marked
   Sensitive. Without them, free evaluations are simply switched off.
3. Give the Anthropic key its own workspace with a monthly spend limit.

Sign-up refuses disposable email domains (`lib/auth/disposableDomains.ts`, refreshed with
`node scripts/update-disposable-domains.mjs`).

Supabase's built-in email sender is for testing only and is heavily rate-limited. Before
inviting real users, set up custom SMTP under **Authentication → Emails → SMTP Settings**
(e.g. Resend's free tier).

## Run locally

```
npm run dev
```

Open `http://localhost:3000`, sign in with your email, and add your Anthropic API key on the
New evaluation page.

`npm run build && npm start` runs the production build.

## Deploy (Vercel)

Import the GitHub repo in Vercel, add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as
environment variables, and deploy. Every push to `main` redeploys.

## Docker

The app doesn't depend on Vercel-specific features, so it can move to any container host
(Google Cloud Run, Fly.io, …):

```
docker build -t ethiscore .
docker run -p 3000:3000 -e SUPABASE_URL=... -e SUPABASE_PUBLISHABLE_KEY=... ethiscore
```

The Supabase settings are read at runtime, so one image works against any project. Remember to
add the new host's address to Supabase's Redirect URLs.

## Notes

- Weights are relative, not required to sum to 100 — they're normalized automatically.
- Each criterion is scored 0.0–1.0 by Claude and shown as a percentage.
- The overall score is computed in code (not by the model) as a **weighted geometric mean**:
  `overall = Π(score_i ^ normalizedWeight_i)`. Unlike a weighted average, this punishes a very
  low score on any single criterion much harder — a company that's excellent on two criteria
  but scores near 0 on the third still ends up with a low overall score.
- Each company is evaluated in its own request (the browser loops over companies), so one
  evaluation gets the server's full time limit (300s on Vercel Hobby).
- Shared logic lives in `lib/` (evaluation, prompt-building, storage, Supabase access), with
  `app/`/`components/` as the web layer on top of it.
