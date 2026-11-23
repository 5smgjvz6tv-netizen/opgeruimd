-- Volledige verwijdering van account en bijbehorende gegevens (AVG / GDPR).
-- Verwijdert het auth-account (cascade naar members, plan_items, push_subscriptions, outbox)
-- en ruimt het huishouden op als er geen andere leden meer in zitten.
create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  hid uuid;
begin
  if uid is null then raise exception 'Sign in first'; end if;
  select household_id into hid from members where user_id = uid;
  delete from auth.users where id = uid;
  if hid is not null and not exists (select 1 from members where household_id = hid) then
    delete from households where id = hid;
  end if;
end $$;
revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;
