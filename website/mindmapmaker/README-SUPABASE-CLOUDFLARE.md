# Mindmapmaker Supabase + Cloudflare Setup (Step by Step)

## 1) Supabase Project
1. Create project in Supabase dashboard.
2. Copy **Project URL** and **anon public key** from `Project Settings > API`.
3. In `Authentication > Providers`, enable Email provider.
4. In `Authentication > URL Configuration`, add:
   - Site URL: `https://fadhil.dev`
   - Redirect URLs: `https://fadhil.dev/mindmapmaker`

## 2) Cloudflare Pages/Workers Variables
Set environment variables (Production + Preview):
- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_ANON_KEY=<supabase-anon-key>`

The Worker route `/api/mindmapmaker/auth-config` reads these vars and returns them to frontend.

## 3) Deploy Worker + Static
1. Ensure route `/mindmapmaker` serves `website/website/mindmapmaker/index.html`.
2. Ensure Worker script includes auth config handler in `src/index.js`.
3. Deploy using Cloudflare Pages/Workers pipeline.

## 4) Auth Flow in UI
- Login/Register button opens popup with mode switch:
  - **Register**: fields `Nama` + `Buat Sandi`, button `Konfirmasi`
  - **Login**: fields `Nama` + `Buat Sandi`, button `Login`
- Register uses `POST /auth/v1/signup`.
- Login uses `POST /auth/v1/token?grant_type=password`.
- After successful login, top-right button becomes realtime profile circle.

## 5) Security Notes
- `SUPABASE_ANON_KEY` is safe for browser use, but must still be rate-limited via Supabase policies.
- Use Supabase RLS for table-level access control.
- Enable bot/rate protections at Cloudflare if needed.

## 6) Recommended Supabase SQL Baseline
```sql
-- Example profile table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

create policy "read own profile"
on public.user_profiles
for select
using (auth.uid() = id);

create policy "insert own profile"
on public.user_profiles
for insert
with check (auth.uid() = id);

create policy "update own profile"
on public.user_profiles
for update
using (auth.uid() = id);
```

## 7) Verification Checklist
- `/mindmapmaker` loads dashboard UI.
- `Login/Register` shown when logged out.
- Register request succeeds in Supabase logs.
- Login success changes button to profile circle.
- Logout returns profile circle back to login/register button.
