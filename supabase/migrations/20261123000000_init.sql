-- Opgeruimd: gedeeld huishouden voor twee (of meer).

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ons huis',
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  block_minutes int not null default 15,
  rest_days int[] not null default '{}',
  created_at timestamptz not null default now()
);

create table members (
  user_id uuid primary key references auth.users on delete cascade,
  household_id uuid not null references households on delete cascade,
  name text not null,
  color text not null default '#0FA37F',
  arrive_token uuid not null unique default gen_random_uuid(),
  fallback_time time default '18:30',
  reminded_on date,
  snooze_until timestamptz,
  snooze_reason text,
  snooze_on_arrive boolean not null default false,
  timer_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  title text not null,
  room text,
  minutes int not null default 10 check (minutes between 1 and 240),
  recurrence text not null default 'once' check (recurrence in ('once', 'weekly', 'interval')),
  weekdays int[] not null default '{}',
  interval_days int check (interval_days > 0),
  assignee uuid references members (user_id) on delete set null,
  due_date date,
  last_done_at timestamptz,
  archived boolean not null default false,
  created_by uuid default auth.uid() references members (user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table plan_days (
  household_id uuid not null references households on delete cascade,
  date date not null,
  primary key (household_id, date)
);

create table plan_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  date date not null,
  task_id uuid not null references tasks on delete cascade,
  user_id uuid not null references members (user_id) on delete cascade,
  minutes int not null,
  status text not null default 'todo' check (status in ('todo', 'done')),
  done_at timestamptz,
  done_by uuid references members (user_id) on delete set null,
  extra boolean not null default false,
  swap_to uuid references members (user_id) on delete set null,
  unique (date, task_id)
);
create index on plan_items (household_id, date);

create table push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references members (user_id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table outbox (
  id bigint generated always as identity primary key,
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references members (user_id) on delete cascade,
  title text not null,
  body text not null,
  tag text,
  send_at timestamptz not null default now(),
  sent_at timestamptz
);
create index on outbox (send_at) where sent_at is null;

-- ——— Toegang: je ziet alleen je eigen huishouden ———
create function my_household() returns uuid
language sql stable security definer set search_path = public as $$
  select household_id from members where user_id = auth.uid()
$$;

alter table households enable row level security;
alter table members enable row level security;
alter table tasks enable row level security;
alter table plan_days enable row level security;
alter table plan_items enable row level security;
alter table push_subscriptions enable row level security;
alter table outbox enable row level security;

create policy own on households for all to authenticated using (id = my_household()) with check (id = my_household());
create policy own on members for all to authenticated using (household_id = my_household()) with check (household_id = my_household());
create policy own on tasks for all to authenticated using (household_id = my_household()) with check (household_id = my_household());
create policy own on plan_days for all to authenticated using (household_id = my_household()) with check (household_id = my_household());
create policy own on plan_items for all to authenticated using (household_id = my_household()) with check (household_id = my_household());
create policy own on outbox for all to authenticated using (household_id = my_household()) with check (household_id = my_household());
create policy own on push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ——— Functies ———
create function create_household(my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  insert into households default values returning id into hid;
  insert into members (user_id, household_id, name) values (auth.uid(), hid, trim(my_name));
  return hid;
end $$;

create function join_household(code text, my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select id into hid from households where invite_code = upper(trim(code));
  if hid is null then raise exception 'Deze code kennen we niet'; end if;
  insert into members (user_id, household_id, name, color) values (auth.uid(), hid, trim(my_name), '#FF8A5B')
  on conflict (user_id) do update set household_id = excluded.household_id, name = excluded.name;
  return hid;
end $$;

-- Afvinken / terugzetten, en de taak bijwerken (laatst gedaan / eenmalig = klaar).
create function toggle_item(item uuid, done boolean) returns void
language plpgsql security invoker set search_path = public as $$
declare t uuid;
begin
  update plan_items set
    status = case when done then 'done' else 'todo' end,
    done_at = case when done then now() end,
    done_by = case when done then auth.uid() end
  where id = item returning task_id into t;
  update tasks set
    last_done_at = (select max(done_at) from plan_items where task_id = t and status = 'done'),
    archived = case when recurrence = 'once'
      then exists (select 1 from plan_items where task_id = t and status = 'done') else archived end
  where id = t;
end $$;

-- Alleen voor de server: claim meldingen die verstuurd moeten worden.
create function claim_outbox() returns setof outbox
language sql security definer set search_path = public as $$
  update outbox set sent_at = now()
  where id in (select id from outbox where sent_at is null and send_at <= now() for update skip locked)
  returning *
$$;
revoke execute on function claim_outbox() from public, anon, authenticated;

-- Live samenwerken
alter publication supabase_realtime add table households, members, tasks, plan_items;
