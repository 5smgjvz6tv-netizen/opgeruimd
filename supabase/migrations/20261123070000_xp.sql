-- XP per persoon (alle tijd): punten = minuten × zwaarte (licht 0,75 · normaal 1 · zwaar 1,5). Samen gedaan telt voor allebei.
create or replace function household_xp() returns table (user_id uuid, xp bigint)
language sql stable security invoker set search_path = public as $$
  select v.u, sum(round(pi.minutes * case t.effort when 1 then 0.75 when 3 then 1.5 else 1 end))::bigint
  from plan_items pi
  join tasks t on t.id = pi.task_id
  cross join lateral (values (pi.done_by), (pi.helper)) as v(u)
  where pi.status = 'done' and v.u is not null and pi.household_id = my_household()
  group by v.u
$$;
grant execute on function household_xp() to authenticated;

-- Onboarding vóór het inloggen: alles in één keer aanmaken.
create or replace function create_household(my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  insert into households default values returning id into hid;
  insert into members (user_id, household_id, name) values (auth.uid(), hid, trim(my_name))
  on conflict (user_id) do update set household_id = excluded.household_id, name = excluded.name;
  return hid;
end $$;
