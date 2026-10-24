# Commonplace

Commonplace is a community library for school, programming, research, and other useful projects. It uses the existing Next.js App Router, TypeScript, Tailwind CSS, and Supabase Auth, PostgreSQL, and private Storage.

## Run locally

Requirements: Node.js 20.9 or newer and an npm-compatible package manager.

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. In the Supabase dashboard, open **SQL Editor**, create a query, and run the contents of [`supabase/migrations/20261024000000_initial_schema.sql`](supabase/migrations/20261024000000_initial_schema.sql). This creates the tables, indexes, profile trigger, Row Level Security policies, and private `project-assets` bucket.
3. In **Project Settings → API**, copy the Project URL and the public anon/publishable key. Do not use a service-role or secret key in this application.
4. Copy `.env.example` to `.env.local` and fill in those two public values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
   ```

5. In Supabase **Authentication → URL Configuration**, set the local site URL to `http://localhost:3000` and allow that URL as a redirect URL. Add the production Vercel URL after deployment.
6. Run `npm run dev` and open `http://localhost:3000`.

The project has no credentials in source control. `.env*` files are ignored by Git. Supabase Auth may require email confirmation depending on the project’s Auth settings; users should confirm their address before signing in when that setting is enabled.

## Implemented routes

- `/` and `/explore`: project discovery, indexed title/description search, category filtering, and pagination.
- `/projects/[id]`: project detail, temporary signed media/download links, likes, bookmarks, and comments.
- `/auth/login` and `/auth/register`: Supabase password authentication.
- `/dashboard`, `/dashboard/projects`, `/dashboard/bookmarks`, and `/account`: authenticated workspace and profile settings.
- `/projects/new` and `/projects/[id]/edit`: authenticated project forms with direct private Storage uploads.
- `/users/[username]`: public contributor profile and published projects.

Protected routes and server actions verify the Supabase user on the server. Database and Storage authorization is also enforced by RLS/policies; the browser key is only the public anon/publishable key. Published files can be downloaded through short-lived signed URLs. Drafts remain owner-only. Uploads are capped at 4 MB for project files and 5 MB for thumbnails; type, MIME, and file signatures are checked server-side.

## Checks

```bash
npm run lint
npm exec -- tsc --noEmit
npm run build
```

There is not yet a dedicated automated test suite. The Supabase migration should be reviewed and applied in a development project before production data is added. Configure the same two public Supabase variables in Vercel; never add a service-role key.