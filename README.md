# ai0-notes 📝

Block-based notes app — text, checkboxes, headings, folders, tags, real-time sync.

Part of the **AI0 (AllInOne)** suite.

## Features
- Block-based editor: text, heading 1/2, checkbox, divider
- Mix any block types freely in one note
- Folders with custom colours
- Tags per note
- Pin important notes
- Search across all notes
- Delete with confirmation
- Real-time sync across devices (Supabase Realtime)
- Per-user data only (Row Level Security)

## Setup

1. Copy `.env.example` → `.env` and fill values
2. Run `supabase_notes.sql` in Supabase SQL Editor
3. Add GitHub Secrets (same as other ai0 apps + Supabase keys)
4. Push to `main` → auto-deploys via Cloudflare Pages

## Dev

```bash
npm install
npm run dev
```

## Stack
- React + Vite
- Supabase (PostgreSQL + RLS + Realtime)
- Cloudflare Pages
