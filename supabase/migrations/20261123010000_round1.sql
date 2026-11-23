-- Ronde 1: zwaarte, verzetten, samen gedaan, meldingen per soort.

-- 1 = licht, 2 = normaal, 3 = zwaar (telt mee in de eerlijke verdeling)
alter table tasks add column effort smallint not null default 2 check (effort between 1 and 3);
-- "Morgen / andere dag": tot deze datum is de taak niet aan de beurt
alter table tasks add column postponed_to date;
-- "Samen gedaan": telt voor allebei
alter table plan_items add column helper uuid references members (user_id) on delete set null;
-- Meldingen per soort aan/uit (sleutel = tag van de melding)
alter table members add column notify jsonb not null
  default '{"reminder": true, "timer": true, "swap": true, "done": true, "task": true}';

create or replace function toggle_item(item uuid, done boolean) returns void
language plpgsql security invoker set search_path = public as $$
declare t uuid;
begin
  update plan_items set
    status = case when done then 'done' else 'todo' end,
    done_at = case when done then now() end,
    done_by = case when done then auth.uid() end,
    helper = case when done then helper end
  where id = item returning task_id into t;
  update tasks set
    last_done_at = (select max(done_at) from plan_items where task_id = t and status = 'done'),
    postponed_to = case when done then null else postponed_to end,
    archived = case when recurrence = 'once'
      then exists (select 1 from plan_items where task_id = t and status = 'done') else archived end
  where id = t;
end $$;
