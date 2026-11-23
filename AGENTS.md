# Werken aan Opgeruimd

Opgeruimd is een tweetalige huishoudgame voor mensen die moeilijk tijd vrijmaken voor opruimen. De dagelijkse ronde duurt standaard 15 minuten. Je kunt alleen spelen of met huisgenoten. Bas helpt je beginnen, reageert als je een klus afvinkt en houdt de verdeling speels. De planner verdeelt het werk. Gebruik deze keuzes als vertrekpunt wanneer je met de eigenaar over een wijziging praat.

## Product en vormgeving

- De gekozen naam is **Opgeruimd**, ook in het Engels. HomeRun en andere namen waren brainstormopties.
- Bas is de vriendelijke wasbeer uit de groene wasmand. De eigenaar koos de 2,5D-versie ‘zacht rubber’. Houd de zachte oogtekening, glimlach en herkenbare wasmand. De eigenaar wees de oranje achtergrond en de eerdere zonnebrilachtige oogtekening af.
- Het portret en de zwaai- en juichhoudingen staan in `public/bas-*.webp`. Het actuele beginschermicoon gebruikt de `bas-pine`-afbeeldingen. De verwijzingen in `index.html` en het manifest bepalen welke variant gebruikers zien. Oudere ontwerpen staan ook in de repo.
- Apple Fitness is een referentie voor plaatsing, typografie, iconen en voortgang. De eigenaar wil korte teksten, duidelijke acties en een rustige mobiele interface. Gebruik Bas op momenten die er voor de speler toe doen. Respecteer verminderde beweging.
- De eerste ronde draait om alledaagse klusjes zoals de vuilnisbak legen, het bed opmaken, stofzuigen of de vaatwasser uitruimen als die er is. XP en de voortgangsring maken kleine stappen zichtbaar.

## Gebruikersroute

- Toon Bas groot bij de begroeting. De naamstap heeft één gecentreerd veld met autofocus. De app wijst een profielkleur toe die de speler later in Instellingen kan wijzigen.
- Houd de onboarding kort. De speler kiest huishouden en woonlagen. Bas vult kamers en starterstaken in. Het huisje bestaat uit geïllustreerde bouwdelen. Keuken, woonkamer, hal en wc komen beneden, slaapkamer en badkamer op de eerste verdieping als die er is. Het washok komt op de bovenste verdieping bij meerdere lagen. Vanaf drie lagen is de bovenste de zolder. Handmatige kamerkeuzes tellen mee als het aantal lagen verandert. Tuin en balkon zijn afzonderlijke keuzes.
- Nederlands en Engels moeten dezelfde route bieden. Van taal wisselen behoudt de huidige stap en ingevulde gegevens. Nieuwe spelers kunnen hun huis bewaren. Bestaande spelers kunnen tijdens onboarding naar inloggen en weer terug.
- Een tijdstip is de gewone herinneringskeuze in onboarding. De iOS-thuiskomstautomatisering is een aparte integratie. De eerder opgeslagen ronde van vandaag is offline beschikbaar. Afgevinkte taken worden na herstel van de verbinding gesynchroniseerd.

## Wegwijs in de code

| Onderwerp | Begin hier |
| --- | --- |
| Onboarding, conceptgegevens, account | `src/screens/Onboard.tsx`, `src/lib/setup.ts` |
| Kamerverdeling en starterstaken | `src/lib/homeLayout.ts`, `src/components/HomeLayoutPicker.tsx` |
| Takenbibliotheek en vertalingen | `src/lib/catalog.ts`, `src/lib/catalog.en.ts`, `src/lib/i18n.ts` |
| Dagronde, Bas en beloningen | `src/screens/Today.tsx`, `src/components/Bas.tsx`, `src/lib/game.ts` |
| Eerlijke planning | `supabase/functions/_shared/planner.ts` |
| Offline afvinken en appcache | `src/screens/OfflineRound.tsx`, `src/lib/offlineRound.ts`, `public/sw.js`, `vite.config.ts` |
| Instellingen en backend | `src/screens/Settings.tsx`, `src/lib/data.ts`, `supabase/migrations/`, `supabase/functions/` |

## Stand van de overdracht

De app draait op https://opgeruimd.vercel.app. De productversie op 23 november 2026 correspondeert met commit `e696184`. Latere wijzigingen staan in de Git-geschiedenis. De productiebuild gebruikt `npm run build` (TypeScript en Vite). Zie README.md voor lokaal draaien en backendinrichting.

Voor deze versie zijn de indeling voor één tot vier woonlagen en het behoud van handmatige keuzes gecontroleerd. De onboarding en taalwissel zijn in mobiele WebKit doorlopen. Offline heropenen, afvinken en synchroniseren zijn in Chromium gecontroleerd. Het nieuwe icoon is op klein formaat in grijstinten bekeken. Het uiterlijk in het Clear-thema van iOS 27 op een fysieke iPhone staat nog open.

Werk deze context bij als de eigenaar een eerdere keuze herziet. Onderscheid een voorstel, een gebouwde functie en een gecontroleerde productieversie.
