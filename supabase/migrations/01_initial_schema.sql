-- Create tables
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  duration integer not null,
  price numeric not null,
  category text,
  created_at timestamptz default now()
);

create table if not exists public.professionals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  specialty text,
  commission numeric,
  color text,
  created_at timestamptz default now()
);

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

-- Enable RLS
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;

-- Policies for Services
create policy "Users can crud their own services"
  on public.services for all
  using (auth.uid() = user_id);

create policy "Public can read services of a user"
  on public.services for select
  using (true);

-- Policies for Professionals
create policy "Users can crud their own professionals"
  on public.professionals for all
  using (auth.uid() = user_id);

create policy "Public can read professionals of a user"
  on public.professionals for select
  using (true);

-- Policies for Clients
create policy "Users can crud their own clients"
  on public.clients for all
  using (auth.uid() = user_id);

-- Policies for Appointments
create policy "Users can crud their own appointments"
  on public.appointments for all
  using (auth.uid() = user_id);

create policy "Public can insert appointments"
  on public.appointments for insert
  with check (true);

create policy "Public can read appointments (time slots)"
  on public.appointments for select
  using (true);
