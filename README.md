# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/43d3702b-4f96-4699-84aa-bd6b91c9c838

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/43d3702b-4f96-4699-84aa-bd6b91c9c838) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Why localhost might not work

The app **requires valid Supabase settings** in a local env file. If `.env` has empty placeholders, the Supabase client is created with a blank URL and key, so nothing loads and the console shows:

`[Supabase] Missing configuration – check VITE_SUPABASE_URL ...`

**Fix:**

1. Copy the example env file:

   ```sh
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Open `.env` and replace the three Supabase values with your real project data from **Supabase Dashboard → Project Settings → API** (URL, anon key, project ref).

3. Keep `VITE_ENABLE_ML_FUNCTION="false"` until you have deployed the `ml-proxy` Edge Function (see below). With `false`, the app runs locally with **demo** AI/embeddings; auth and database still work.

4. Restart the dev server after any `.env` change (`Ctrl+C`, then `npm run dev` again).

5. Open the URL Vite prints (default **http://localhost:8080** — see `vite.config.ts`).

**Optional — real AI on localhost:** deploy `ml-proxy` to your Supabase project, set `OPENAI_API_KEY` with `supabase secrets set`, then set `VITE_ENABLE_ML_FUNCTION="true"` in `.env`. For fully local Edge testing you can run `supabase functions serve ml-proxy` while linked to your project (see [Supabase CLI docs](https://supabase.com/docs/guides/functions/local-development)).

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/43d3702b-4f96-4699-84aa-bd6b91c9c838) and click on Share -> Publish.

## Deploy to Vercel (step by step)

1. **Push your repo to GitHub** (if it is not already).

2. **Supabase — Edge Function + OpenAI (for real summaries / embeddings)**  
   Install [Supabase CLI](https://supabase.com/docs/guides/cli), log in, link your project:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy ml-proxy
   supabase secrets set OPENAI_API_KEY=sk-your-openai-secret-key
   ```

   Skip `deploy` / `secrets` if you only want the site without AI; then use `VITE_ENABLE_ML_FUNCTION=false` on Vercel.

3. **Vercel — import project**  
   - Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the GitHub repo.  
   - Framework: **Vite** (auto-detected).  
   - Build command: `npm run build`  
   - Output directory: `dist`

4. **Vercel — Environment Variables** (Project → Settings → Environment Variables). Add for **Production** (and Preview if you use PR previews):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://YOUR_REF.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase **anon** public key |
   | `VITE_SUPABASE_PROJECT_ID` | Your project ref (same as subdomain) |
   | `VITE_ENABLE_ML_FUNCTION` | `true` if `ml-proxy` is deployed; else `false` |

   Never put `OPENAI_API_KEY` here — it belongs only in Supabase function secrets.

5. **Deploy** — click Deploy. After the first build, open the production URL.

6. **Supabase Auth (if you use login)** — in Supabase Dashboard → **Authentication** → **URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs**.

## Secure production env setup

Do not place private API keys in `VITE_*` variables. `VITE_*` values are public in browser bundles.

- OpenAI: only in Supabase as `OPENAI_API_KEY` for the `ml-proxy` function.
- Supabase **anon** key in `VITE_SUPABASE_PUBLISHABLE_KEY` is expected to be public; protect data with **Row Level Security (RLS)** in Supabase.

Quick reference:

```sh
supabase functions deploy ml-proxy
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
