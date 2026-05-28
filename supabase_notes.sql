-- ============================================================
-- AI0 Notes — Supabase Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- FOLDERS
create table if not exists notes_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  color      text not null default '#b8ff57',
  created_at timestamptz default now()
);

-- NOTES
create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  folder_id  uuid references notes_folders(id) on delete set null,
  title      text not null default 'Untitled',
  pinned     boolean not null default false,
  tags       text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BLOCKS (content inside a note)
create table if not exists note_blocks (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid references notes(id) on delete cascade not null,
  type       text not null default 'text',  -- 'text' | 'checkbox' | 'heading1' | 'heading2' | 'divider'
  content    text not null default '',
  checked    boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists notes_user_id_idx        on notes(user_id);
create index if not exists notes_folder_id_idx      on notes(folder_id);
create index if not exists note_blocks_note_id_idx  on note_blocks(note_id);
create index if not exists notes_folders_user_id_idx on notes_folders(user_id);

-- ── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger notes_updated_at
  before update on notes
  for each row execute procedure update_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table notes_folders  enable row level security;
alter table notes          enable row level security;
alter table note_blocks    enable row level security;

-- Folders: own data only
create policy "folders_select" on notes_folders for select using (auth.uid() = user_id);
create policy "folders_insert" on notes_folders for insert with check (auth.uid() = user_id);
create policy "folders_update" on notes_folders for update using (auth.uid() = user_id);
create policy "folders_delete" on notes_folders for delete using (auth.uid() = user_id);

-- Notes: own data only
create policy "notes_select" on notes for select using (auth.uid() = user_id);
create policy "notes_insert" on notes for insert with check (auth.uid() = user_id);
create policy "notes_update" on notes for update using (auth.uid() = user_id);
create policy "notes_delete" on notes for delete using (auth.uid() = user_id);

-- Blocks: accessible only if parent note belongs to user
create policy "blocks_select" on note_blocks for select
  using (exists (select 1 from notes where notes.id = note_blocks.note_id and notes.user_id = auth.uid()));
create policy "blocks_insert" on note_blocks for insert
  with check (exists (select 1 from notes where notes.id = note_blocks.note_id and notes.user_id = auth.uid()));
create policy "blocks_update" on note_blocks for update
  using (exists (select 1 from notes where notes.id = note_blocks.note_id and notes.user_id = auth.uid()));
create policy "blocks_delete" on note_blocks for delete
  using (exists (select 1 from notes where notes.id = note_blocks.note_id and notes.user_id = auth.uid()));

-- SuperAdmin read-all (optional, for logs)
create policy "superadmin_notes_select" on notes for select
  using (auth.email() = 'maxmicallefa@gmail.com');
