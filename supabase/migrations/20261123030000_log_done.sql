-- "Al gedaan": iets loggen wat je buiten de app om hebt opgeruimd.
-- Telt mee in de verdeling, vinkt de taak af als hij die dag op iemands lijst staat,
-- en schuift de volgende keer dat hij aan de beurt is op.
create or replace function log_done(task uuid, at timestamptz default now(), together boolean default false)
returns void language plpgsql security invoker set search_path = public as $$
declare
  t tasks;
  d date := (at at time zone 'Europe/Amsterdam')::date;
  partner uuid;
begin
  select * into t from tasks where id = task;
  if t.id is null then raise exception 'Taak niet gevonden'; end if;
  if together then
    select user_id into partner from members where household_id = t.household_id and user_id <> auth.uid() limit 1;
  end if;

  insert into plan_items (household_id, date, task_id, user_id, minutes, status, done_at, done_by, helper, extra)
  values (t.household_id, d, t.id, auth.uid(), t.minutes, 'done', at, auth.uid(), partner, true)
  on conflict (date, task_id) do update
    set status = 'done', done_at = excluded.done_at, done_by = excluded.done_by,
        helper = coalesce(excluded.helper, plan_items.helper), swap_to = null;

  update tasks set
    last_done_at = greatest(coalesce(last_done_at, at), at),
    postponed_to = null,
    archived = case when recurrence = 'once' then true else archived end
  where id = t.id;
end $$;
