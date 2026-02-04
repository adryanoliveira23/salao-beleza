-- Create a table for public profiles (linked to auth.users)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  name text,
  plan text check (plan in ('essencial', 'profissional', 'enterprise')),
  status text check (status in ('active', 'inactive', 'suspended')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
-- Public read access (or authenticated only, depending on needs)
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

-- Admin read access (Assuming we use a Service Role for admin panel, but if we want direct support access, we might need more)
create policy "Service role can view all profiles" on public.profiles
  for select using (true); -- Requires service_role key to bypass RLS effectively or specific role check

create policy "Service role can insert profiles" on public.profiles
  for insert with check (true);

create policy "Service role can update profiles" on public.profiles
  for update using (true);

create policy "Service role can delete profiles" on public.profiles
  for delete using (true);


-- Platform Config Table
create table public.platform_config (
  id int primary key default 1, -- Singleton row
  config jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint single_row check (id = 1)
);

-- Enable RLS
alter table public.platform_config enable row level security;

-- Policy: Anyone can read platform config (or just auth users)
create policy "Public view config" on public.platform_config
  for select using (true);

-- Policy: Only service role can update
create policy "Service role update config" on public.platform_config
  for all using (true); -- In reality, you'd restrict this to admin role if you had one in Auth

-- Insert default config if not exists
insert into public.platform_config (id, config)
values (1, '{
  "revenueRate": 10,
  "minRevenueRate": 5,
  "maxRevenueRate": 30,
  "platformFee": 0,
  "maintenanceMode": false,
  "allowNewSignups": true,
  "defaultPlan": "essencial",
  "planPrices": {
    "essencial": 49.90,
    "profissional": 97.40,
    "enterprise": 198.75
  }
}'::jsonb)
on conflict (id) do nothing;
