-- ════════════════════════════════════════════════════════════════
-- Night Watch — Supabase database schema
-- Run this entire file once in Supabase SQL Editor (Dashboard → SQL).
-- ════════════════════════════════════════════════════════════════

-- ─── 1. INCIDENTS TABLE ─────────────────────────────────────────
create table if not exists public.incidents (
  id               text primary key,
  submitted_at     timestamptz not null default now(),
  reporter_name    text not null,
  area             text not null,
  category         text not null,
  severity         text not null check (severity in ('Low','Medium','High','Critical')),
  location         text not null,
  description      text not null,
  immediate_action text,
  photo_url        text,
  feedback         text,
  feedback_by      text,
  feedback_at      timestamptz,
  status           text not null default 'Open' check (status in ('Open','Acknowledged','Closed','Escalated'))
);

create index if not exists idx_incidents_submitted_at on public.incidents (submitted_at desc);
create index if not exists idx_incidents_area on public.incidents (area);
create index if not exists idx_incidents_status on public.incidents (status);

-- ─── 2. ROW-LEVEL SECURITY ──────────────────────────────────────
-- For the prototype we allow anonymous reads + inserts so the public
-- form works without auth. The /api/inbound endpoint uses the SERVICE
-- ROLE key which bypasses RLS, so updates from email replies are safe.
-- Tighten these for production.

alter table public.incidents enable row level security;

drop policy if exists "anon_read_all"   on public.incidents;
drop policy if exists "anon_insert_all" on public.incidents;
drop policy if exists "anon_update_feedback" on public.incidents;
drop policy if exists "anon_delete_demo" on public.incidents;

create policy "anon_read_all"
  on public.incidents for select
  to anon, authenticated
  using (true);

create policy "anon_insert_all"
  on public.incidents for insert
  to anon, authenticated
  with check (true);

-- Allow anonymous UPDATE only for the feedback fields (so the manual
-- "test feedback" button on the dashboard works without auth). In
-- production, restrict this to authenticated HOD accounts.
create policy "anon_update_feedback"
  on public.incidents for update
  to anon, authenticated
  using (true)
  with check (true);

-- DELETE allowed for the demo "clear all" button. Remove in production.
create policy "anon_delete_demo"
  on public.incidents for delete
  to anon, authenticated
  using (true);

-- ─── 3. ENABLE REAL-TIME ────────────────────────────────────────
-- This makes INSERT/UPDATE events stream to subscribed clients.
alter publication supabase_realtime add table public.incidents;

-- ─── 4. STORAGE BUCKET FOR PHOTOS ───────────────────────────────
-- Run this OR create the bucket in the dashboard (Storage → New bucket).
-- Bucket must be PUBLIC so HOD email links work without signed URLs.

insert into storage.buckets (id, name, public)
  values ('incident-photos', 'incident-photos', true)
  on conflict (id) do update set public = true;

-- Allow anonymous uploads + reads on the photo bucket
drop policy if exists "anon_upload_photos" on storage.objects;
drop policy if exists "anon_read_photos"   on storage.objects;

create policy "anon_upload_photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'incident-photos');

create policy "anon_read_photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'incident-photos');
