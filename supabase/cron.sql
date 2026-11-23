-- Eenmalig uitvoeren na het aanmaken van het project (vervang REF):
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('opgeruimd-tick', '* * * * *', $$ select net.http_post(url := 'https://REF.supabase.co/functions/v1/tick', body := '{}'::jsonb, headers := '{"Content-Type":"application/json"}'::jsonb) $$);
