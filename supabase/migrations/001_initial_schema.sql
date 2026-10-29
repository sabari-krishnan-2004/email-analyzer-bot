-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table storing OAuth tokens
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  refresh_token text not null,       -- AES-256-GCM encrypted string: iv:authTag:encryptedData
  last_synced_at timestamp with time zone default null,
  created_at timestamp with time zone default now()
);

-- Parsed & Classified Emails table
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  gmail_message_id text not null,
  sender text not null,
  subject text default '(No Subject)',
  received_at timestamp with time zone not null,
  category text not null,            -- 'Important', 'Work', 'Transactions', 'Promotions', 'Updates'
  priority text not null,            -- 'High', 'Medium', 'Low'
  summary text not null,
  action_required boolean default false,
  is_read boolean default false,
  created_at timestamp with time zone default now(),
  constraint unique_user_message unique(user_id, gmail_message_id)
);

create index if not exists idx_emails_user_cat on public.emails(user_id, category, priority);
create index if not exists idx_emails_received on public.emails(received_at desc);

-- Row Level Security (RLS) policies
alter table public.users enable row level security;
alter table public.emails enable row level security;

-- Service role bypasses RLS, but if authenticated via client or public queries, define safety
create policy "Users can view their own record" on public.users
  for select using (auth.uid() = id);

create policy "Users can view their own emails" on public.emails
  for select using (auth.uid() = user_id);
