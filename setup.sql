-- Run this once in Supabase: SQL Editor > New query > paste > Run

create table if not exists research (
  id          bigint generated always as identity primary key,
  company     text not null,
  brief       jsonb not null,
  sources     jsonb default '[]',
  created_at  timestamptz default now()
);

-- Lock the table. Only our Vercel function, using the secret key, can read or write it.
alter table research enable row level security;
