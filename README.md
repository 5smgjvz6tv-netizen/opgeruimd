# Opgeruimd

Een huishoud-app voor twee: elke dag een blokje van ±15 minuten, eerlijk verdeeld, met een herinnering als je thuiskomt.

- **App**: React + Vite PWA (`src/`), op je beginscherm te zetten via Safari
- **Server**: Supabase (database, live sync, inloggen) + edge functions (`supabase/functions/`)
  - `arrive`: aangeroepen door de iOS Opdrachten-automatisering "Kom aan → thuis"
  - `tick`: elke minuut via pg_cron: timers, snoozes, ruilverzoeken, reserve-herinnering
- **Planner**: `supabase/functions/_shared/planner.ts`, gedeeld door app en server

## Lokaal draaien
```
npm install
npm run dev
```

## Opnieuw opzetten
1. Draai `supabase/migrations/*.sql` en `supabase/cron.sql` (REF invullen)
2. `supabase secrets set VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… VAPID_SUBJECT=https://…`
3. `supabase functions deploy arrive tick --use-api`
4. Zet de publieke waarden in `src/config.ts`
