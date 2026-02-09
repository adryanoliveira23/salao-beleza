-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  name text,
  email text,
  salon_name text,
  username text unique,
  plan text default 'essencial',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Drop existing policies to avoid "already exists" errors
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Service role can view all profiles" on profiles;
drop policy if exists "Service role can insert profiles" on profiles;
drop policy if exists "Service role can update profiles" on profiles;
drop policy if exists "Service role can delete profiles" on profiles;

-- Recreate policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 2. SERVICES
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  duration integer not null,
  price numeric not null,
  category text,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

drop policy if exists "Users can crud their own services" on services;
drop policy if exists "Public can read services of a user" on services;

create policy "Users can crud their own services" on services for all using (auth.uid() = user_id);
create policy "Public can read services of a user" on services for select using (true);

-- 3. PROFESSIONALS
create table if not exists public.professionals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  specialty text,
  commission numeric,
  color text,
  created_at timestamptz default now()
);

alter table public.professionals enable row level security;

drop policy if exists "Users can crud their own professionals" on professionals;
drop policy if exists "Public can read professionals of a user" on professionals;

create policy "Users can crud their own professionals" on professionals for all using (auth.uid() = user_id);
create policy "Public can read professionals of a user" on professionals for select using (true);

-- 4. CLIENTS
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  visits integer default 0,
  last_visit date,
  total_spent numeric default 0,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;

drop policy if exists "Users can crud their own clients" on clients;

create policy "Users can crud their own clients" on clients for all using (auth.uid() = user_id);

-- 5. APPOINTMENTS
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  date date not null,
  time text not null,
  duration integer not null,
  price numeric not null,
  status text default 'pending',
  client_name text,
  client_phone text,
  client_email text,
  service_name text,
  professional_name text,
  hair_type text,
  skin_type text,
  allergies text,
  observations text,
  created_at timestamptz default now()
);

alter table public.appointments enable row level security;

drop policy if exists "Users can crud their own appointments" on appointments;
drop policy if exists "Public can insert appointments" on appointments;
drop policy if exists "Public can read appointments (time slots)" on appointments;

create policy "Users can crud their own appointments" on appointments for all using (auth.uid() = user_id);
create policy "Public can insert appointments" on appointments for insert with check (true);
create policy "Public can read appointments (time slots)" on appointments for select using (true);

-- 6. TRIGGERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
