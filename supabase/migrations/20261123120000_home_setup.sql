alter table households add column home_layout jsonb;

-- Eén transactie voor het huis, de kamers en de starttaken, ook bij een dubbele tik.
create function finish_home_setup(profile jsonb, starter jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select household_id into hid from members where user_id = auth.uid();
  if hid is not null then return hid; end if;
  if profile->>'path' = 'join' then
    hid := join_household(profile->>'code', profile->>'name');
  else
    hid := create_household(profile->>'name');
    update households set size = (profile->>'size')::integer,
      rooms = array(select jsonb_array_elements_text(profile->'rooms')),
      rest_days = array(select jsonb_array_elements_text(profile->'rest'))::int[],
      block_minutes = (profile->>'block')::integer, home_layout = profile->'layout'
    where id = hid;
    insert into tasks (household_id,catalog_id,title,room,minutes,effort,recurrence,weekdays,interval_days)
      select hid,s.catalog_id,s.title,s.room,s.minutes,s.effort,s.recurrence,s.weekdays,s.interval_days
      from jsonb_to_recordset(starter) as s(catalog_id text,title text,room text,minutes int,effort int,recurrence text,weekdays int[],interval_days int);
  end if;
  update members set color = profile->>'color', lang = profile->>'lang',
    fallback_time = (profile->>'reminder')::time where user_id = auth.uid();
  return hid;
end $$;
revoke all on function finish_home_setup(jsonb,jsonb) from public;
grant execute on function finish_home_setup(jsonb,jsonb) to authenticated;

-- Speel een offline wijziging maximaal één keer effectief af. Een nieuwere
-- wijziging van een huisgenoot krijgt voorrang op een verouderde lokale kopie.
create function sync_round_check(target uuid, desired boolean, original_time timestamptz, event_time timestamptz)
returns void language plpgsql security invoker set search_path = public as $$
declare row_item plan_items;
begin
  select * into row_item from plan_items where id = target and user_id = auth.uid() for update;
  if not found or row_item.done_at is distinct from original_time or (row_item.status = 'done') = desired then return; end if;
  perform toggle_item(target, desired);
  if desired then
    update plan_items set done_at = least(event_time, now()) where id = target;
    update tasks set last_done_at = (select max(done_at) from plan_items where task_id = row_item.task_id and status = 'done') where id = row_item.task_id;
  end if;
end $$;
revoke all on function sync_round_check(uuid,boolean,timestamptz,timestamptz) from public;
grant execute on function sync_round_check(uuid,boolean,timestamptz,timestamptz) to authenticated;

create function save_home_layout(layout jsonb, groups text[], starter jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare hid uuid := my_household();
begin
  if hid is null then raise exception 'Sign in first'; end if;
  update households set home_layout = layout, rooms = groups where id = hid;
  insert into tasks (household_id,catalog_id,title,room,minutes,effort,recurrence,weekdays,interval_days)
    select hid,s.catalog_id,s.title,s.room,s.minutes,s.effort,s.recurrence,s.weekdays,s.interval_days
    from jsonb_to_recordset(starter) as s(catalog_id text,title text,room text,minutes int,effort int,recurrence text,weekdays int[],interval_days int)
    where not exists(select 1 from tasks t where t.household_id = hid and t.catalog_id = s.catalog_id)
    on conflict do nothing;
end $$;
revoke all on function save_home_layout(jsonb,text[],jsonb) from public;
grant execute on function save_home_layout(jsonb,text[],jsonb) to authenticated;

-- Bestaande huishoudens behielden één gezamenlijke bibliotheekcategorie.
update households set rooms = array_replace(rooms, 'buiten','tuin') || array['balkon'] where 'buiten' = any(rooms);
