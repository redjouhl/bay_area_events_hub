# Bay Area Events Hub

A site for discovering concerts, comedy shows, and other events around the Bay Area.

## Built with

- TanStack Start (React + Vite + Nitro)
- TypeScript
- Tailwind CSS
- Supabase (database + auth)
- Deployed on Netlify

## Local development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev
```

Opens at `http://localhost:8080`.

### Environment variables

Local dev reads from a `.env` file in the project root (not committed to git). It needs:

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Get these from the Supabase dashboard for this project: **Project Settings → API** (URL and publishable/anon key), and reveal the service role key in the same section. The `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` pair and the `VITE_`-prefixed pair should be the same values — the `VITE_` versions are what the browser bundle uses, the plain versions are read server-side.

### Testing a production build locally

Since some issues only show up in a full build (not the dev server), it's worth running the real build before pushing:

```sh
bun run build && bun run preview
```

## Database

Schema is managed via SQL files in `supabase/migrations/`. To apply migrations to the project's Supabase database:

```sh
supabase db push --project-ref <project-ref> --password <db-password>
```

(project ref and DB password are in the Supabase dashboard — Project Settings → General / Database)

Pushing a code change to GitHub does **not** apply pending migrations — that's a separate, manual step.

## Deployment

Deploys automatically via Netlify whenever `main` is pushed. No manual deploy step needed — commit and push when ready, and the live site updates a few minutes later.

Netlify environment variables (Site settings → Environment variables) must mirror the same five `SUPABASE_*` / `VITE_SUPABASE_*` values as local `.env`, so the deployed build has database access.
