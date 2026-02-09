-- Add columns if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'salon_name') then
    alter table public.profiles add column salon_name text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'username') then
    alter table public.profiles add column username text unique;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'name') then
    alter table public.profiles add column name text;
  end if;
end $$;

-- Force schema cache reload (usually happens automatically on DDL)
notify pgrst, 'reload schema';
