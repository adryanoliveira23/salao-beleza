-- Add updated_at column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'updated_at') then
    alter table public.profiles add column updated_at timestamptz default now();
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'plan') then
    alter table public.profiles add column plan text default 'essencial';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'status') then
    alter table public.profiles add column status text default 'active';
  end if;
end $$;

-- Force schema cache reload
notify pgrst, 'reload schema';
