-- Voorkeursmoment van de dag per taak (ochtend / overdag / avond / vrij).
alter table tasks add column if not exists time_of_day text check (time_of_day in ('morning', 'afternoon', 'evening'));

create or replace function finish_home_setup(profile jsonb, starter jsonb) returns uuid
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
    insert into tasks (household_id,catalog_id,title,room,minutes,effort,recurrence,weekdays,interval_days,time_of_day)
      select hid,s.catalog_id,s.title,s.room,s.minutes,s.effort,s.recurrence,s.weekdays,s.interval_days,s.time_of_day
      from jsonb_to_recordset(starter) as s(catalog_id text,title text,room text,minutes int,effort int,recurrence text,weekdays int[],interval_days int,time_of_day text);
  end if;
  update members set color = profile->>'color', lang = profile->>'lang',
    fallback_time = (profile->>'reminder')::time where user_id = auth.uid();
  return hid;
end $$;

create or replace function save_home_layout(layout jsonb, groups text[], starter jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare hid uuid := my_household();
begin
  if hid is null then raise exception 'Sign in first'; end if;
  update households set home_layout = layout, rooms = groups where id = hid;
  insert into tasks (household_id,catalog_id,title,room,minutes,effort,recurrence,weekdays,interval_days,time_of_day)
    select hid,s.catalog_id,s.title,s.room,s.minutes,s.effort,s.recurrence,s.weekdays,s.interval_days,s.time_of_day
    from jsonb_to_recordset(starter) as s(catalog_id text,title text,room text,minutes int,effort int,recurrence text,weekdays int[],interval_days int,time_of_day text)
    where not exists(select 1 from tasks t where t.household_id = hid and t.catalog_id = s.catalog_id)
    on conflict do nothing;
end $$;
