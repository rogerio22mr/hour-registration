# Hour Registration

> This project was built as a study using [Claude Code](https://claude.ai/claude-code), Anthropic's AI coding assistant.

A personal time-tracking web app built with Angular 21 and Supabase. Log daily work items with multiple time entries per item, navigate between days, and keep a clean record of hours worked.

## Features

- **Authentication** — email/password login via Supabase Auth
- **Daily view** — browse any day with previous/next navigation and a calendar date picker
- **Work items** — create, edit and delete entries per day
- **Multiple time entries** — each work item supports multiple start/end time slots
- **Time calculation** — hours computed automatically from start and end timestamps (float with 2 decimals)
- **Open-ended entries** — end time is optional; hours default to 0 until filled in
- **Approval workflow** — mark items as approved (locked from edit/delete) and unapprove them again
- **Copy hours** — one-click copy of an item's total hours to the clipboard
- **CSV export** — export the current day (home) or week (summary) to a CSV file, one row per time entry
- **Toast notifications** — non-blocking feedback for save, approve, delete, copy and errors
- **Daily goal progress** — a progress bar tracks the day's total against an 8-hour goal
- **Weekly summary** — a `/summary` view with per-day bar chart, week total, average and days worked
- **Dark mode** — light/dark theme toggle that follows the system preference and persists across sessions
- **Custom accent color** — pick your own accent color for light and dark mode on the `/settings` screen, with a live preview; the whole UI recolors instantly and the choice syncs across devices
- **Bilingual (English / Portuguese)** — runtime language toggle on the `/settings` screen; defaults to the browser language and persists across sessions. Dates and numbers are localized via Angular's `DatePipe` (`en-US` / `pt-BR`)
- **Progressive Web App** — installable and works offline via a service worker
- **Quick time fill** — press `h` on any time field to insert the current time
- **Timezone-aware** — times are stored as UTC and displayed in the user's local timezone; day selection uses local dates

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| Backend / Auth | Supabase |
| Styling | Tailwind CSS 4 |
| Offline / Install | `@angular/service-worker` (PWA) |
| Language | TypeScript 5.9 (strict) |
| Testing | Vitest |

## Supabase setup

Run the following SQL in your Supabase project's SQL editor to create the required tables.

### `work_items`

```sql
create table work_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  title       text not null,
  description text not null default '',
  work_date   date not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table work_items enable row level security;

create policy "Users can manage their own work items"
  on work_items for all
  using (auth.uid() = user_id);
```

### `work_item_hours`

Each work item can have multiple time entries. This table is also protected by RLS via `user_id` so the client never needs to join through the parent.

```sql
create table work_item_hours (
  id            uuid primary key default gen_random_uuid(),
  work_item_id  uuid references work_items(id) on delete cascade not null,
  user_id       uuid references auth.users not null,
  start_time    timestamptz not null,
  end_time      timestamptz,
  hours         float8 not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table work_item_hours enable row level security;

create policy "Users can manage their own work item hours"
  on work_item_hours for all
  using (auth.uid() = user_id);
```

### Migration: add `approved` flag to `work_items`

Adds approval tracking to work items. Run this in the Supabase SQL editor — it is
idempotent (safe to re-run).

```sql
-- 1. Add the columns (default false so existing rows are "not approved")
alter table work_items
  add column if not exists approved     boolean     not null default false,
  add column if not exists approved_at  timestamptz,
  add column if not exists approved_by  uuid references auth.users(id);

-- 2. Index for filtering by approval status
create index if not exists idx_work_items_approved on work_items(approved);

-- 3. RLS policy — allow the row owner to approve/unapprove their own items
--    (drop first to make this re-runnable)
drop policy if exists "Users can approve their own work items" on work_items;

create policy "Users can approve their own work items"
  on work_items
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

This adds the `approved`, `approved_at` and `approved_by` columns (existing rows
default to "not approved"), an index for filtering by approval status, and an RLS
policy so a user can approve/unapprove only their own items.

### `user_preferences`

Stores per-user UI preferences — currently the customizable accent colors for light
and dark mode. One row per user (`user_id` is the primary key), protected by RLS so a
user can only read/write their own row. The client upserts on `user_id`. Run this in
the Supabase SQL editor (idempotent, safe to re-run):

```sql
create table if not exists user_preferences (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  accent_light text not null default '#2563eb',
  accent_dark  text not null default '#60a5fa',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table user_preferences enable row level security;

drop policy if exists "Users can manage their own preferences" on user_preferences;

create policy "Users can manage their own preferences"
  on user_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Accent colors are stored as hex strings (e.g. `#2563eb`). The app derives the full
blue/indigo palette from them at runtime via CSS `color-mix()`, so changing the two
accent values recolors the entire UI.

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd hour-registration
npm install
```

### 2. Configure Supabase

Edit `src/environments/environment.ts` with your project credentials:

```ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://<project-id>.supabase.co',
    anonKey: '<your-anon-key>',
  },
};
```

### 3. Run the Supabase SQL

Create both tables as shown in the [Supabase setup](#supabase-setup) section above.

### 4. Start the dev server

```bash
npm start
```

Open `http://localhost:4200` in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start development server |
| `npm run build` | Production build + generate Netlify `_redirects` |
| `npm run watch` | Development build in watch mode |
| `npm test` | Run unit tests with Vitest |

## Progressive Web App

The app ships with a service worker (`@angular/service-worker`) configured via
[`ngsw-config.json`](./ngsw-config.json) and a web app manifest in
`public/manifest.webmanifest`, making it installable on desktop and mobile and
usable offline.

The service worker is **only active in production builds** (`isDevMode()` disables
it during development), so `npm start` runs without it. To test install/offline
behavior, serve a production build over `localhost` or HTTPS:

```bash
npm run build
npx http-server dist/hour-registration/browser -p 8080
```

## Deployment

The build script generates a `_redirects` file inside `dist/hour-registration/browser/` for single-page app routing on Netlify:

```bash
npm run build
```

Then deploy the `dist/hour-registration/browser/` folder.
