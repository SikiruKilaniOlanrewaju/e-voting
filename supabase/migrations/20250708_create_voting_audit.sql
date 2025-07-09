-- Migration: Create voting_audit table for admin audit log
-- Migration: Create voting_audit table for admin audit log (Postgres/Supabase syntax)
create table if not exists voting_audit (
  id uuid primary key default gen_random_uuid(),
  voting_event_id uuid references voting_events(id) on delete cascade,
  action text not null,
  "user" text,
  timestamp timestamptz default now()
);
