# Hour Registration

> This project was built as a study using [Claude Code](https://claude.ai/claude-code), Anthropic's AI coding assistant.

A personal time-tracking web app built with Angular 21 and Supabase. Log daily work items with multiple time entries per item, navigate between days, and keep a clean record of hours worked.

## Features

- **Authentication** — email/password login via Supabase Auth
- **Daily view** — browse any day with previous/next navigation
- **Work items** — create, edit and delete entries per day
- **Multiple time entries** — each work item supports multiple start/end time slots
- **Time calculation** — hours computed automatically from start and end timestamps (float with 2 decimals)
- **Open-ended entries** — end time is optional; hours default to 0 until filled in
- **Quick time fill** — press `h` on any time field to insert the current time
- **Timezone-aware display** — times are stored as UTC and displayed in the user's local timezone

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| Backend / Auth | Supabase |
| Styling | Tailwind CSS 4 |
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

## Deployment

The build script generates a `_redirects` file inside `dist/hour-registration/browser/` for single-page app routing on Netlify:

```bash
npm run build
```

Then deploy the `dist/hour-registration/browser/` folder.
