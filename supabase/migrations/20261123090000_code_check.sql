-- Uitnodigingscode controleren vóór het aanmaken van een account (geeft alleen ja/nee terug).
create or replace function code_exists(code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from households where invite_code = upper(trim(code)))
$$;
grant execute on function code_exists(text) to anon, authenticated;
