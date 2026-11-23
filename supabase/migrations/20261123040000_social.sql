-- Inzicht & gamification: high fives en echte duur bij "Al gedaan".
alter table plan_items add column kudos_at timestamptz;
update members set notify = notify || '{"kudos": true}'::jsonb;
alter table members alter column notify set default
  '{"reminder": true, "timer": true, "swap": true, "done": true, "task": true, "kudos": true}';

drop function if exists log_done(uuid, timestamptz, boolean);
create function log_done(task uuid, at timestamptz default now(), together boolean default false, minutes int default null)
returns void language plpgsql security invoker set search_path = public as $$
declare
  t tasks;
  d date := (at at time zone 'Europe/Amsterdam')::date;
  partner uuid;
  mins int;
begin
  select * into t from tasks where id = task;
  if t.id is null then raise exception 'Taak niet gevonden'; end if;
  mins := greatest(1, least(coalesce(minutes, t.minutes), 480));
  if together then
    select user_id into partner from members where household_id = t.household_id and user_id <> auth.uid() limit 1;
  end if;

  insert into plan_items (household_id, date, task_id, user_id, minutes, status, done_at, done_by, helper, extra)
  values (t.household_id, d, t.id, auth.uid(), mins, 'done', at, auth.uid(), partner, true)
  on conflict (date, task_id) do update
    set status = 'done', done_at = excluded.done_at, done_by = excluded.done_by, minutes = excluded.minutes,
        helper = coalesce(excluded.helper, plan_items.helper), swap_to = null;

  update tasks set
    last_done_at = greatest(coalesce(last_done_at, at), at),
    postponed_to = null,
    archived = case when recurrence = 'once' then true else archived end
  where id = t.id;
end $$;
