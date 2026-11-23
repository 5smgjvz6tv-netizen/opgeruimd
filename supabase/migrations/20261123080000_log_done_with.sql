-- "Al gedaan" met een gekozen huisgenoot (werkt voor 1 tot 8 personen).
drop function if exists log_done(uuid, timestamptz, boolean, int);
create function log_done(task uuid, at timestamptz default now(), with_user uuid default null, minutes int default null)
returns void language plpgsql security invoker set search_path = public as $$
declare
  t tasks;
  d date := (at at time zone 'Europe/Amsterdam')::date;
  mins int;
begin
  select * into t from tasks where id = task;
  if t.id is null then raise exception 'Taak niet gevonden'; end if;
  mins := greatest(1, least(coalesce(minutes, t.minutes), 480));
  insert into plan_items (household_id, date, task_id, user_id, minutes, status, done_at, done_by, helper, extra)
  values (t.household_id, d, t.id, auth.uid(), mins, 'done', at, auth.uid(), with_user, true)
  on conflict (date, task_id) do update
    set status = 'done', done_at = excluded.done_at, done_by = excluded.done_by, minutes = excluded.minutes,
        helper = coalesce(excluded.helper, plan_items.helper), swap_to = null;
  update tasks set last_done_at = greatest(coalesce(last_done_at, at), at), postponed_to = null,
    archived = case when recurrence = 'once' then true else archived end
  where id = t.id;
end $$;
