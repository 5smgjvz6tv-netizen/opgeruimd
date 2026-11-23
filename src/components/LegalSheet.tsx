import { lang, t } from '../lib/i18n'
import { Sheet } from './Sheet'

export type LegalDoc = 'privacy' | 'terms'

export function LegalSheet({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const nl = lang === 'nl'
  const title = doc === 'privacy' ? t('legal.privacy') : doc === 'terms' ? t('legal.terms') : ''
  return (
    <Sheet open={!!doc} onClose={onClose} title={title}>
      <div className="legal">
        {doc === 'privacy' && (nl ? <PrivacyNL /> : <PrivacyEN />)}
        {doc === 'terms' && (nl ? <TermsNL /> : <TermsEN />)}
      </div>
      <button className="btn primary block" onClick={onClose}>{t('common.close')}</button>
    </Sheet>
  )
}

function PrivacyNL() {
  return (
    <>
      <p className="legal-meta">Laatst bijgewerkt: november 2026 · Opgeruimd</p>
      <p>Opgeruimd is een huishoudapp waarmee je alleen of met huisgenoten je taken bijhoudt. We verzamelen alleen de gegevens die strikt nodig zijn om de app te laten werken — geen advertenties, geen tracking en geen nieuwsbrieven.</p>

      <h3>1. Welke gegevens slaan we op?</h3>
      <ul>
        <li><strong>Accountgegevens:</strong> je e-mailadres en versleuteld wachtwoord om veilig in te loggen.</li>
        <li><strong>Profiel &amp; voorkeuren:</strong> je voornaam, profielkleur, taalvoorkeur, rondelengte, rustdagen en herinneringstijd.</li>
        <li><strong>Huishouden &amp; taken:</strong> je verdiepingen, kamers, thuissituaties, takenlijst, afgevinkte rondes, XP en uitnodigingscode.</li>
        <li><strong>Meldingen (optioneel):</strong> een apparaat-token voor pushmeldingen en een persoonlijke thuiskomst-link als je meldingen aanzet.</li>
        <li><strong>Lokale opslag:</strong> op dit apparaat bewaren we je concept-onboarding, taalvoorkeur en de ronde van vandaag zodat je ook offline kunt afvinken.</li>
      </ul>

      <h3>2. Waarvoor gebruiken we je gegevens?</h3>
      <p>Uitsluitend om je opruimrondes te plannen, je voortgang te bewaren, samen te werken met huisgenoten binnen jouw huishouden en (alleen als jij dat aanzet) herinneringen te sturen. We sturen nooit reclame- of nieuwsbriefmails en verkopen of delen je gegevens niet met derden voor marketing.</p>

      <h3>3. Delen binnen je huishouden</h3>
      <p>Alleen mensen die jij uitnodigt met jouw persoonlijke uitnodigingscode zien de naam, profielkleur, taken en voortgang binnen jullie gedeelde huishouden. Je e-mailadres en wachtwoord zijn nooit zichtbaar voor anderen.</p>

      <h3>4. Opslag &amp; verwerkers</h3>
      <p>Opgeruimd gebruikt Supabase voor authenticatie en database-opslag en Vercel voor het hosten van de webapp. Gegevens worden versleuteld verzonden (HTTPS) en afgeschermd per huishouden (Row Level Security).</p>

      <h3>5. Bewaartermijn &amp; jouw rechten (AVG)</h3>
      <p>Je gegevens blijven bewaard zolang je een account hebt. Je hebt altijd recht op inzage, correctie, export en verwijdering:</p>
      <ul>
        <li><strong>Exporteren:</strong> via <em>Instellingen → Mijn gegevens exporteren</em> download je direct een kopie van al je gegevens.</li>
        <li><strong>Verwijderen:</strong> via <em>Instellingen → Account en gegevens verwijderen</em> verwijder je direct en definitief je account, profiel, meldingen en afgevinkte rondes. Ben je het enige lid van het huishouden, dan wordt ook het hele huishouden inclusief taken verwijderd.</li>
      </ul>

      <h3>6. Vragen</h3>
      <p>Heb je vragen over je privacy of wil je iets laten nakijken? Neem contact op via het kanaal waar je Opgeruimd hebt ontvangen.</p>
    </>
  )
}

function PrivacyEN() {
  return (
    <>
      <p className="legal-meta">Last updated: November 2026 · Opgeruimd</p>
      <p>Opgeruimd is a household app that helps you keep up with chores on your own or with housemates. We only collect the data strictly needed to run the app — no ads, no tracking, and no marketing emails.</p>

      <h3>1. Data we store</h3>
      <ul>
        <li><strong>Account details:</strong> your email address and encrypted password to sign in securely.</li>
        <li><strong>Profile &amp; preferences:</strong> your first name, profile colour, language preference, round length, rest days and reminder time.</li>
        <li><strong>Household &amp; tasks:</strong> your floors, rooms, home setup, chore list, completed rounds, XP and invite code.</li>
        <li><strong>Notifications (optional):</strong> a push subscription token and personal arrival link if you enable notifications.</li>
        <li><strong>Local device storage:</strong> your onboarding draft, language choice and today’s round so you can check off tasks offline.</li>
      </ul>

      <h3>2. How we use your data</h3>
      <p>Strictly to plan your tidy-up rounds, save your progress, sync with housemates in your household, and send reminders when you enable them. We never send newsletters or spam and never sell or share your data for advertising.</p>

      <h3>3. Sharing within your household</h3>
      <p>Only people you invite with your household invite code can see your first name, colour, tasks and progress inside that household. Your email address and password are never visible to others.</p>

      <h3>4. Storage &amp; processors</h3>
      <p>Opgeruimd uses Supabase for authentication and database storage and Vercel for web hosting. All traffic is encrypted via HTTPS and household data is isolated with Row Level Security.</p>

      <h3>5. Retention &amp; your rights (GDPR)</h3>
      <p>We keep your data only while your account is active. You can access, export or delete your data at any time:</p>
      <ul>
        <li><strong>Export:</strong> go to <em>Settings → Export my data</em> to download a full copy of your data.</li>
        <li><strong>Delete:</strong> go to <em>Settings → Delete account &amp; data</em> to permanently delete your account, profile, notifications and rounds. If you are the last member of your household, the entire household and its tasks are deleted as well.</li>
      </ul>

      <h3>6. Questions</h3>
      <p>If you have questions about your privacy, please reach out through the channel where you received access to Opgeruimd.</p>
    </>
  )
}

function TermsNL() {
  return (
    <>
      <p className="legal-meta">Laatst bijgewerkt: november 2026 · Opgeruimd</p>
      <p>Door een account aan te maken of Opgeruimd te gebruiken ga je akkoord met deze gebruiksvoorwaarden.</p>

      <h3>1. Gebruik van Opgeruimd</h3>
      <p>Opgeruimd is bedoeld voor persoonlijk gebruik in je eigen huishouden. Je bent zelf verantwoordelijk voor het veilig bewaren van je inloggegevens en voor met wie je de uitnodigingscode van je huishouden deelt.</p>

      <h3>2. Beschikbaarheid &amp; ontwikkeling</h3>
      <p>Opgeruimd wordt continu doorontwikkeld en aangeboden zoals de app op dat moment werkt (“as is”). We doen ons best om de app betrouwbaar en beschikbaar te houden, maar kunnen geen ononderbroken werking of garantie op meldingen geven (bijvoorbeeld door telefoon- of browserinstellingen).</p>

      <h3>3. Gedrag &amp; eigen invoer</h3>
      <p>Je blijft eigenaar van de taken en teksten die je zelf toevoegt. Gebruik de app niet om onrechtmatige, kwetsende of schadelijke inhoud op te slaan of om de dienst te verstoren.</p>

      <h3>4. Stoppen &amp; account verwijderen</h3>
      <p>Je kunt op elk moment stoppen met Opgeruimd en je account en gegevens direct verwijderen via <em>Instellingen → Account en gegevens verwijderen</em>.</p>

      <h3>5. Wijzigingen</h3>
      <p>We kunnen deze voorwaarden of het privacybeleid aanpassen als de app verandert. De meest actuele versie is altijd in de app te lezen onder Instellingen.</p>
    </>
  )
}

function TermsEN() {
  return (
    <>
      <p className="legal-meta">Last updated: November 2026 · Opgeruimd</p>
      <p>By creating an account or using Opgeruimd, you agree to these terms of service.</p>

      <h3>1. Using Opgeruimd</h3>
      <p>Opgeruimd is intended for personal use within your household. You are responsible for keeping your login credentials safe and for whom you share your household invite code with.</p>

      <h3>2. Availability &amp; ongoing development</h3>
      <p>Opgeruimd is actively developed and provided “as is”. We aim to keep the app reliable and available, but cannot guarantee uninterrupted service or notification delivery (which also depends on device and browser settings).</p>

      <h3>3. Your content</h3>
      <p>You keep ownership of any custom tasks or text you add. Please do not use the app to store unlawful or harmful content or to disrupt the service.</p>

      <h3>4. Leaving &amp; deleting your account</h3>
      <p>You can stop using Opgeruimd at any time and permanently delete your account and data via <em>Settings → Delete account &amp; data</em>.</p>

      <h3>5. Changes</h3>
      <p>We may update these terms or the privacy policy as the app evolves. The latest version is always available inside the app under Settings.</p>
    </>
  )
}
