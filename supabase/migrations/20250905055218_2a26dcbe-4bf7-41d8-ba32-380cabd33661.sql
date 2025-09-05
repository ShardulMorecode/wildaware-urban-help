-- Profiles and user activity logging for WildAware
-- Safe function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies for profiles (owner-only)
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to maintain updated_at
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Create activity logs table
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('call_helpline','report_sighting','guidance')),
  species text,
  ngo_name text,
  ngo_phone text,
  notes text,
  metadata jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_user_activities_user_id on public.user_activities(user_id);
create index if not exists idx_user_activities_occurred_at on public.user_activities(occurred_at desc);

-- Enable RLS on activities
alter table public.user_activities enable row level security;

drop policy if exists "Users can view their own activities" on public.user_activities;
create policy "Users can view their own activities"
  on public.user_activities for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own activities" on public.user_activities;
create policy "Users can insert their own activities"
  on public.user_activities for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own activities" on public.user_activities;
create policy "Users can update their own activities"
  on public.user_activities for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own activities" on public.user_activities;
create policy "Users can delete their own activities"
  on public.user_activities for delete
  using (auth.uid() = user_id);

-- Create profiles row automatically for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

-- Trigger on auth.users to create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();