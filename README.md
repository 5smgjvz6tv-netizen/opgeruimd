# Opgeruimd

Een huishoudgame voor jezelf of je huisgenoten. Bas helpt je met een dagelijkse opruimronde van ongeveer 15 minuten.

De productkeuzes, vormgeving, codekaart en open verificatiepunten staan in [de projectcontext](AGENTS.md).

- **App**: React + Vite PWA (`src/`), gehost op Vercel: https://opgeruimd.vercel.app (`npx vercel deploy --prod`)
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
