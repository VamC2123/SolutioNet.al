# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/43d3702b-4f96-4699-84aa-bd6b91c9c838

## How can I edit this code?

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/43d3702b-4f96-4699-84aa-bd6b91c9c838) and start prompting.

**Use your preferred IDE**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

### Why localhost might not work

The app **requires valid Supabase settings** in `.env`. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID` from **Supabase → Project Settings → API**.

Optional: `VITE_OPENAI_API_KEY` enables real AI summaries and embeddings (otherwise demo mode). Restart `npm run dev` after changes.

Default dev URL: **http://localhost:8080** (`vite.config.ts`).

## What technologies are used for this project?

- Vite, TypeScript, React, shadcn-ui, Tailwind CSS

## Deploy to Vercel

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com) (Framework: **Vite**, build: `npm run build`, output: `dist`).

2. **Environment variables** (Project → Settings → Environment Variables):

   | Name | Notes |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://YOUR_REF.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
   | `VITE_SUPABASE_PROJECT_ID` | Project ref (subdomain) |
   | `VITE_OPENAI_API_KEY` | Optional. Enables AI summaries + semantic search helpers. |

   `VITE_*` variables are embedded in the browser bundle. For small/private deployments, putting the OpenAI key here is acceptable; for a public app at scale, use a server-side proxy instead.

3. **Authentication → URL Configuration** in Supabase: add your Vercel URL to **Site URL** and **Redirect URLs**.

## New Supabase project (optional)

To recreate the database elsewhere, run [`supabase/schema_full.sql`](supabase/schema_full.sql) in the SQL Editor on a new project. See file header for CSV import order and foreign-key notes.

### Profiles & auth

`profiles.id` must match `auth.users.id`. Prefer **Sign up** in the app, or create users in **Authentication → Users**, then matching `profiles` rows.

**HTTP 429 on signup:** wait 15–60 minutes or add users manually in the Dashboard; see **Authentication → Rate Limits**.

## Can I connect a custom domain?

[Lovable custom domain docs](https://docs.lovable.dev/features/custom-domain#custom-domain)
