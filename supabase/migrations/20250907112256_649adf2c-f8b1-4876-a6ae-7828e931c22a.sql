-- Create species table
create table if not exists public.species (
  id uuid primary key default gen_random_uuid(),
  common_name text not null,
  scientific_name text,
  category text,
  risk_level text,
  description text,
  behaviour text,
  dos_donts text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.species enable row level security;

-- Allow public read-only access (anon + authenticated)
create policy if not exists "Species are viewable by everyone"
  on public.species
  for select
  using (true);

-- Indexes for faster lookups
create index if not exists idx_species_common_name on public.species (common_name);
create index if not exists idx_species_category on public.species (category);
create index if not exists idx_species_risk_level on public.species (risk_level);

-- Trigger for updated_at
create trigger if not exists update_species_updated_at
before update on public.species
for each row execute function public.update_updated_at_column();

-- Create rescue_orgs table
create table if not exists public.rescue_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text,
  district text,
  phone text,
  whatsapp text,
  species_supported text[],
  source_url text,
  email text,
  type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rescue_orgs enable row level security;

create policy if not exists "Rescue orgs are viewable by everyone"
  on public.rescue_orgs
  for select
  using (true);

-- Indexes for rescue_orgs
create index if not exists idx_rescue_orgs_state_district on public.rescue_orgs (state, district);
create index if not exists idx_rescue_orgs_species_supported on public.rescue_orgs using gin (species_supported);

-- Trigger for updated_at on rescue_orgs
create trigger if not exists update_rescue_orgs_updated_at
before update on public.rescue_orgs
for each row execute function public.update_updated_at_column();

-- Create safety_guidelines table
create table if not exists public.safety_guidelines (
  id uuid primary key default gen_random_uuid(),
  situation text not null,
  dos text[],
  donts text[],
  authority_to_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.safety_guidelines enable row level security;

create policy if not exists "Safety guidelines are viewable by everyone"
  on public.safety_guidelines
  for select
  using (true);

-- Index for safety_guidelines
create index if not exists idx_safety_guidelines_situation on public.safety_guidelines (situation);

-- Trigger for updated_at on safety_guidelines
create trigger if not exists update_safety_guidelines_updated_at
before update on public.safety_guidelines
for each row execute function public.update_updated_at_column();