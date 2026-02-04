-- Create a table for public profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  name text,
  plan text,
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

-- Ensure existing data is compatible with the new constraints
UPDATE public.profiles SET plan = 'essencial' WHERE plan NOT IN ('essencial') OR plan IS NULL;
UPDATE public.profiles SET status = 'active' WHERE status NOT IN ('active', 'inactive', 'suspended') OR status IS NULL;

-- Update constraints (dropping if they exist to avoid errors)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('essencial'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
-- Public read access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Service role access
DROP POLICY IF EXISTS "Service role can view all profiles" ON public.profiles;
CREATE POLICY "Service role can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update profiles" ON public.profiles;
CREATE POLICY "Service role can update profiles" ON public.profiles
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service role can delete profiles" ON public.profiles;
CREATE POLICY "Service role can delete profiles" ON public.profiles
  FOR DELETE USING (true);


-- Platform Config Table
CREATE TABLE IF NOT EXISTS public.platform_config (
  id int primary key default 1, -- Singleton row
  config jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint single_row check (id = 1)
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Policies for platform_config
DROP POLICY IF EXISTS "Public view config" ON public.platform_config;
CREATE POLICY "Public view config" ON public.platform_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role update config" ON public.platform_config;
CREATE POLICY "Service role update config" ON public.platform_config
  FOR ALL USING (true);

-- Insert default config if not exists
INSERT INTO public.platform_config (id, config)
VALUES (1, '{
  "revenueRate": 10,
  "minRevenueRate": 5,
  "maxRevenueRate": 30,
  "platformFee": 0,
  "maintenanceMode": false,
  "allowNewSignups": true,
  "defaultPlan": "essencial",
  "planPrices": {
    "essencial": 48.79
  }
}'::jsonb)
ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config;
