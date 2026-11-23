// Tweetalig: Nederlands (bron) en Engels. t('sleutel', { naam: 'x' }) vult {naam} in.
export type Lang = 'nl' | 'en'
const KEY = 'opgeruimd.lang'

function initial(): Lang {
  try {
    const s = localStorage.getItem(KEY)
    if (s === 'nl' || s === 'en') return s
  } catch { /* privémodus */ }
  return navigator.language?.toLowerCase().startsWith('nl') ? 'nl' : 'en'
}
export let lang: Lang = initial()
export const langChoice = () => { try { return localStorage.getItem(KEY) ?? 'auto' } catch { return 'auto' } }
export function setLang(l: Lang | 'auto') {
  try { l === 'auto' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, l) } catch { /* */ }
  location.reload()
}
export const locale = () => (lang === 'nl' ? 'nl-NL' : 'en-GB')

const nl = {
  // Algemeen
  'app.tagline': 'Bas de wasbeer hier. Fluitje klaar! Speel je een opruimronde mee?',
  'common.next': 'Volgende', 'common.back': 'Terug', 'common.skip': 'Overslaan', 'common.done': 'Klaar', 'common.save': 'Opslaan',
  'common.close': 'Sluiten', 'common.cancel': 'Annuleren', 'common.min': 'min', 'common.minutes': 'minuten', 'common.you': 'Jij',
  'common.today': 'Vandaag', 'common.yesterday': 'Gisteren', 'common.tomorrow': 'Morgen', 'common.share': 'Delen', 'common.copy': 'Kopiëren',
  'common.copied': 'Gekopieerd', 'common.edit': 'Wijzigen', 'common.later': 'Later', 'common.on': 'Aan', 'common.off': 'Uit',
  'common.task': 'taak', 'common.tasks': 'taken', 'common.xp': 'XP',

  // Tabs
  'tab.today': 'Vandaag', 'tab.tasks': 'Taken', 'tab.progress': 'Voortgang', 'tab.together': 'Samen', 'tab.settings': 'Instellingen',

  // Kamers
  'room.keuken': 'Keuken', 'room.woonkamer': 'Woonkamer', 'room.badkamer': 'Badkamer', 'room.slaapkamer': 'Slaapkamer', 'room.was': 'Was',
  'room.toilet': 'Toilet', 'room.boven': 'Boven', 'room.beneden': 'Beneden', 'room.hal': 'Hal en trap', 'room.werkkamer': 'Werkkamer',
  'room.kinderkamer': 'Kinderkamer', 'room.huisdier': 'Huisdier', 'room.buiten': 'Tuin en balkon', 'room.auto': 'Auto en fiets', 'room.overig': 'Overig',

  // Frequentie
  'freq.daily': 'elke dag', 'freq.2': 'om de dag', 'freq.n': 'elke {n} dagen', 'freq.weekly': 'elke week', 'freq.biweekly': 'om de week',
  'freq.monthly': 'elke maand', 'freq.2months': 'om de 2 maanden', 'freq.quarter': 'elk kwartaal', 'freq.4months': 'om de 4 maanden',
  'freq.once': 'eenmalig', 'effort.1': 'Licht', 'effort.2': 'Normaal', 'effort.3': 'Zwaar',
  'days.short': 'ma,di,wo,do,vr,za,zo', 'days.long': 'maandag,dinsdag,woensdag,donderdag,vrijdag,zaterdag,zondag',

  // Niveaus
  'level': 'Niveau {n}', 'level.short': 'Nv {n}', 'level.toNext': 'Nog {xp} XP tot niveau {n}',
  'level.titles': 'Starter,Opruimer,Kruimeljager,Stofbestrijder,Wasmeester,Glansexpert,Huismeester,Ordelegende,Opruimkampioen,Grootmeester',
  'level.up.title': 'Niveau {n} bereikt', 'level.up.body': 'Je bent nu {title}. Op naar het volgende niveau.',

  // Vandaag
  'today.morning': 'Goedemorgen', 'today.afternoon': 'Goedemiddag', 'today.evening': 'Goedenavond', 'today.night': 'Goedenacht',
  'today.round': 'Opruimronde van vandaag', 'today.roundSub': '{n} {tasks} · ±{min} min · +{xp} XP',
  'today.running': 'Ronde loopt', 'today.done': 'Ronde voltooid', 'today.doneSub': '+{xp} XP verdiend · {min} min', 'today.rest': 'Rustdag',
  'today.restSub': 'Vandaag staat er niets gepland.', 'today.empty': 'Niets gepland', 'today.emptySub': 'Alles is bij. Pak een extraatje als je wilt.',
  'today.start': 'Start {min} min', 'today.later': 'Later', 'today.finish': 'Ik ben klaar', 'today.stop': 'Timer stoppen',
  'today.timeUp': 'De tijd is om. Vink af wat je gedaan hebt.', 'today.reminderNote': 'Herinnering om {time}', 'today.reminderArrive': 'Bas geeft je een seintje bij thuiskomst',
  'today.reminderBoth': 'Bas geeft je een seintje om {time} of bij thuiskomst', 'today.snoozed': 'Uitgesteld: {reason}', 'today.snoozeArrive': 'Je krijgt een seintje als je thuiskomt',
  'today.snoozeAt': 'Nieuwe herinnering om {time}', 'today.resume': 'Toch nu', 'today.extrasTitle': 'Bonus: nog {min} min over',
  'today.extrasTitleNoTime': 'Bonustaken', 'today.extrasNone': 'Geen bonustaken nodig. Alles is bij.', 'today.extra': 'bonus',
  'today.log': 'Zelf al iets gedaan?', 'today.logSub': 'Log het voor XP. De planning schuift mee.',
  'today.install': 'Zet de app op je beginscherm', 'today.installSub': 'Nodig voor meldingen op je iPhone.',
  'today.push': 'Zet meldingen aan', 'today.pushSub': 'Zo kan Bas je een seintje geven voor je ronde.',
  'today.housemates': 'Huisgenoten', 'today.mateProgress': '{done} van {n} gedaan', 'today.mateDone': 'Klaar voor vandaag', 'today.mateBusy': 'Is nu bezig',
  'today.mateSnoozed': 'Uitgesteld: {reason}', 'today.mateNone': 'Niets gepland vandaag', 'today.asksYou': '{name} vraagt of jij dit wilt overnemen',
  'today.swapYes': 'Overnemen', 'today.swapNo': 'Nu niet', 'today.asked': 'gevraagd', 'today.together': 'samen',
  'today.invite': 'Nodig je huisgenoten uit', 'today.inviteSub': '{n} van {size} doen mee. Deel je code via Samen.',
  'today.streak': '{n} dagen reeks', 'today.streak1': '1 dag reeks',

  // Menu per taak
  'menu.moveTo': 'Verplaatsen naar', 'menu.tomorrow': 'Morgen', 'menu.dayAfter': 'Overmorgen', 'menu.weekend': 'Het weekend', 'menu.nextWeek': 'Volgende week',
  'menu.ask': 'Vragen om over te nemen', 'menu.askSub': 'Je huisgenoot krijgt een melding', 'menu.undo': 'Toch niet gedaan', 'menu.undoSub': 'Haalt het vinkje en de XP weg',
  'menu.together': 'Samen gedaan met…', 'menu.togetherSub': 'Iedereen krijgt de volle XP', 'menu.notTogether': 'Toch niet samen',

  // Uitstellen
  'snooze.title': 'Even niet', 'snooze.why': 'Waarom nu niet?', 'snooze.when': 'Herinner me', 'snooze.custom': 'Of typ zelf een reden',
  'snooze.r.gym': 'Sporten', 'snooze.r.shop': 'Boodschappen', 'snooze.r.cook': 'Koken', 'snooze.r.guests': 'Bezoek', 'snooze.r.work': 'Werk', 'snooze.r.tired': 'Moe',
  'snooze.w.arrive': 'Bij thuiskomst', 'snooze.w.1h': 'Over 1 uur', 'snooze.w.2h': 'Over 2 uur', 'snooze.w.tomorrow': 'Morgen',
  'snooze.noteArrive': 'Komt het thuiskom-seintje niet, dan krijg je na 3 uur alsnog een herinnering.',
  'snooze.noteTomorrow': 'Wat vandaag blijft liggen, plant de app morgen opnieuw in.', 'snooze.noteShare': 'Je huisgenoten zien de reden.', 'snooze.save': 'Uitstellen',

  // Taken
  'tasks.title': 'Taken', 'tasks.all': 'Alles', 'tasks.overdue': 'Achterstallig', 'tasks.recurring': 'Terugkerend', 'tasks.once': 'Eenmalig',
  'tasks.lateDays': '{n} dagen te laat', 'tasks.lateYesterday': 'Sinds gisteren', 'tasks.doToday': 'Vandaag doen', 'tasks.next': 'Volgende: {when}',
  'tasks.moved': 'Verplaatst naar {when}', 'tasks.doneToday': 'Vandaag gedaan', 'tasks.doneAgo': '{n} d geleden gedaan', 'tasks.empty': 'Nog geen taken. Voeg ze toe met +.',
  'tasks.nothingFixed': 'Vandaag geen vaste taken', 'tasks.from': 'vanaf {date}',

  // Taak toevoegen / wijzigen
  'task.new': 'Nieuwe taak', 'task.edit': 'Taak wijzigen', 'task.fromLib': 'Uit de bibliotheek', 'task.own': 'Zelf maken',
  'task.placeholder': 'Wat moet er gebeuren?', 'task.room': 'Ruimte', 'task.duration': 'Duur', 'task.effort': 'Zwaarte', 'task.effortNote': 'Zwaardere taken leveren meer XP op.',
  'task.when': 'Wanneer', 'task.whenOnce': 'Eén keer', 'task.whenWeekly': 'Vaste dagen', 'task.whenInterval': 'Elke x dagen', 'task.from': 'Vanaf', 'task.asap': 'zo snel mogelijk',
  'task.who': 'Voor wie', 'task.whoAuto': 'Automatisch verdelen', 'task.add': 'Toevoegen', 'task.delete': 'Taak verwijderen', 'task.logDone': 'Ik heb dit al gedaan',
  'task.addN': '{n} {tasks} toevoegen', 'task.pickSome': 'Kies één of meer taken',

  // Bibliotheek
  'lib.search': 'Zoek, bijv. dekbed, kalk of kat', 'lib.noResults': 'Niets gevonden voor “{q}”. Maak hem zelf aan.', 'lib.count': '{n} taken',
  'lib.chosen': '{n} gekozen', 'lib.have': 'Toegevoegd', 'lib.otherRooms': 'Andere ruimtes tonen',

  // Al gedaan
  'log.title': 'Al gedaan', 'log.intro': 'Iets opgeruimd buiten de app om? Log het voor XP. De volgende keer dat de taak aan de beurt is, schuift mee.',
  'log.what': 'Wat heb je gedaan?', 'log.new': 'Nieuwe taak', 'log.repeat': 'Komt vaker terug (elke week)', 'log.change': 'Tik om iets anders te kiezen',
  'log.duration': 'Hoe lang duurde het?', 'log.when': 'Wanneer?', 'log.with': 'Samen gedaan met {name}', 'log.saved': 'Gelogd', 'log.next': 'Volgende keer: {when}',
  'log.xp': '+{xp} XP',

  // Voortgang / Samen
  'prog.week': 'Deze week', 'prog.weekSolo': 'Jouw week', 'prog.pointsInfo': 'XP = minuten × zwaarte (licht ×0,75, normaal ×1, zwaar ×1,5). Samen gedaan telt voor iedereen.',
  'prog.lead': '{name} staat {n} XP voor', 'prog.leadYou': 'Jij staat {n} XP voor', 'prog.tie': 'Gelijkspel', 'prog.noneYet': 'Nog niets gedaan deze week.',
  'prog.lastWeek': 'Vorige week won {name}', 'prog.lastWeekYou': 'Vorige week won jij', 'prog.best': 'Beste week: {xp} XP', 'prog.vsLast': '{diff} XP t.o.v. vorige week',
  'prog.tasksN': '{n} klussen', 'prog.challenge': 'Weekuitdaging', 'prog.challengeDone': 'Gehaald',
  'prog.streak': 'Reeks', 'prog.streakSub': 'Dagen op rij dat de opruimronde rond was. Rustdagen tellen niet mee.',
  'prog.badges': 'Badges', 'prog.house': 'Huisconditie', 'prog.houseSub': 'Hoe goed elke ruimte is bijgehouden. Achterstallige taken trekken de score omlaag.',
  'prog.log': 'Logboek', 'prog.logSub': 'Alles wat deze week is gedaan', 'prog.logEmpty': 'Hier verschijnt alles wat er deze week gebeurt.',
  'prog.showAll': 'Alles tonen ({n})', 'prog.showLess': 'Minder tonen', 'prog.kudos': 'High five geven', 'prog.kudosGiven': 'High five gegeven',
  'prog.extra': 'bonus', 'prog.with': 'met {name}', 'prog.invite': 'Nodig je huisgenoten uit', 'prog.inviteSub': 'Laat ze de app openen en deze code invullen.',

  // Uitdagingen
  'ch.bath': 'Badkamerweek', 'ch.bathSub': 'Doe 3 taken in badkamer of toilet', 'ch.ring': 'Vijf ringen', 'ch.ringSub': 'Maak 5 dagen je opruimronde af',
  'ch.heavy': 'Zwaargewicht', 'ch.heavySub': 'Doe 3 zware taken', 'ch.kitchen': 'Keukenweek', 'ch.kitchenSub': 'Doe 5 keukentaken',
  'ch.bonus': 'Bonusjager', 'ch.bonusSub': 'Doe 3 bonustaken of log 3 klussen', 'ch.hour': 'Uurtje', 'ch.hourSub': 'Ruim deze week 60 minuten op',

  // Badges
  'b.first': 'Eerste klus', 'b.firstSub': 'Je eerste taak afgevinkt', 'b.week': 'Volle week', 'b.weekSub': '7 dagen op rij iets gedaan',
  'b.heavy': 'Zware klusser', 'b.heavySub': '5 zware taken', 'b.laundry': 'Wasmeester', 'b.laundrySub': '10 keer de was',
  'b.self': 'Eigen initiatief', 'b.selfSub': '5 bonustaken of gelogd', 'b.team': 'Teamspeler', 'b.teamSub': '5 klussen samen',
  'b.hour': 'Uurtje', 'b.hourSub': '60 min in één week', 'b.kudos': 'Gewaardeerd', 'b.kudosSub': '5 high fives gekregen', 'b.level5': 'Huismeester', 'b.level5Sub': 'Niveau 5 bereikt',

  // Instellingen
  'set.title': 'Instellingen', 'set.round': 'Opruimronde', 'set.roundLength': 'Lengte', 'set.roundFoot': 'Zoveel tijd plant de app per persoon per dag. ≈ {n} taken per ronde.',
  'set.rest': 'Rustdagen', 'set.restFoot': 'Op rustdagen plant de app niets en blijft je reeks heel.', 'set.restNone': 'Geen rustdagen',
  'set.reminder': 'Herinnering', 'set.reminderMode': 'Wanneer', 'set.modeTime': 'Vaste tijd', 'set.modeArrive': 'Bij thuiskomst', 'set.modeBoth': 'Beide',
  'set.reminderFoot': 'Elke dag een seintje met je taken. Heb je het thuiskom-seintje ingesteld, dan komt dat eerder en geldt de tijd als reserve.',
  'set.reminderFootArrive': 'Je krijgt alleen een seintje als je thuiskomt. Stel dat hieronder eenmalig in via de Opdrachten-app.',
  'set.time': 'Tijd', 'set.arriveSetup': 'Thuiskomen instellen', 'set.arriveSetupSub': 'Eenmalig in de Opdrachten-app, ±1 min',
  'set.arriveCopy': 'Link kopiëren en Opdrachten openen', 'set.arriveCopied': 'Link gekopieerd. Open Opdrachten',
  'set.arriveS1': 'Tik op Automatisering en daarna op +', 'set.arriveS2': 'Kies "Kom aan", kies je huisadres en zet "Voer direct uit" aan',
  'set.arriveS3': 'Kies "Nieuwe lege automatisering" en voeg "Haal inhoud van URL op" toe', 'set.arriveS4': 'Plak de link bij URL en tik op Gereed',
  'set.arriveWhy': 'Apple laat apps geen automatiseringen aanmaken, daarom deze paar stappen.',
  'set.notif': 'Meldingen', 'set.notifStatusOn': 'Aan op dit apparaat', 'set.notifStatusOff': 'Uit op dit apparaat', 'set.notifTurnOn': 'Aanzetten', 'set.notifTest': 'Test',
  'set.notifSent': 'Verstuurd', 'set.notifInstall': 'Zet de app eerst op je beginscherm', 'set.notifDenied': 'Geblokkeerd. Zet ze aan in iPhone-instellingen > Meldingen.',
  'set.notifUnsupported': 'Deze browser ondersteunt geen meldingen.', 'set.notifFoot': 'Kies welke meldingen je wilt krijgen. Je keuze geldt voor al je apparaten.',
  'set.n.reminder': 'Seintje van Bas', 'set.n.timer': 'Timer afgelopen', 'set.n.swap': 'Verzoek om over te nemen', 'set.n.done': 'Huisgenoot is klaar',
  'set.n.task': 'Nieuwe taak van huisgenoot', 'set.n.kudos': 'High fives',
  'set.house': 'Huishouden', 'set.size': 'Aantal personen', 'set.sizeSolo': 'Alleen', 'set.sizeN': '{n} personen', 'set.members': 'Leden',
  'set.code': 'Uitnodigingscode', 'set.houseFoot': 'Huisgenoten doen mee met deze code. Taken en XP worden eerlijk verdeeld.',
  'set.houseFootSolo': 'Je doet het alleen: de app plant alles voor jou. Woon je toch samen? Verhoog het aantal personen.',
  'set.you': 'Jouw profiel', 'set.name': 'Naam', 'set.color': 'Kleur', 'set.youFoot': 'Zo zien je huisgenoten jou in de app.',
  'set.feel': 'Feedback', 'set.sound': 'Geluid bij afvinken', 'set.haptics': 'Trillen', 'set.feelFoot': 'Trillen werkt op iPhone vanaf iOS 18.',
  'set.lang': 'Taal', 'set.langAuto': 'Automatisch', 'set.more': 'Meer', 'set.tour': 'Uitleg opnieuw bekijken', 'set.logout': 'Uitloggen',
  'set.version': 'Opgeruimd · huishouden als spel',

  // Onboarding
  'ob.start': 'Aan de slag', 'ob.haveCode': 'Ik heb een uitnodigingscode', 'ob.haveAccount': 'Ik heb al een account',
  'ob.w1': 'Elke dag een korte opruimronde', 'ob.w1s': 'Een paar taken van een kwartiertje, slim ingepland.',
  'ob.w2': 'Verdien XP en stijg in niveau', 'ob.w2s': 'Reeksen, uitdagingen en badges maken er een spel van.',
  'ob.w3': 'Alleen of samen', 'ob.w3s': 'Werkt voor wie alleen woont en voor het hele huishouden.',
  'ob.youTitle': 'Hoe heet je?', 'ob.youSub': 'Kies ook een kleur. Die zie je terug bij je taken en je score.', 'ob.namePh': 'Je voornaam',
  'ob.houseTitle': 'Met wie woon je?', 'ob.houseSub': 'De app past zich hierop aan. Je kunt dit later wijzigen.',
  'ob.solo': 'Alleen', 'ob.soloSub': 'Alles wordt voor jou gepland. Je speelt tegen je eigen record.',
  'ob.duo': 'Met z’n tweeën', 'ob.duoSub': 'Taken worden eerlijk verdeeld. Je ziet elkaars voortgang en geeft high fives.',
  'ob.group': 'Met meer', 'ob.groupSub': 'Voor gezinnen en huisgenoten. Iedereen zijn eigen ronde.', 'ob.groupCount': '{n} personen',
  'ob.roomsTitle': 'Welke ruimtes heb je?', 'ob.roomsSub': 'Dan laten we alleen taken zien die bij je huis passen.',
  'ob.tasksTitle': 'Wat moet er gebeuren?', 'ob.tasksSub': 'Populaire taken staan al aan. Hoe vaak, hoe lang en hoe zwaar is al ingevuld.',
  'ob.rhythmTitle': 'Jouw ritme', 'ob.rhythmSub': 'Hoe lang duurt een opruimronde, en wanneer wil je een seintje?',
  'ob.demoTitle': 'Probeer het even', 'ob.demoSub': 'Zo werkt een opruimronde. Speel de drie stappen.',
  'ob.demo1': 'Tik op het rondje om een taak af te vinken.', 'ob.demo2': 'Goed zo, +{xp} XP. Start nu de timer.', 'ob.demo3': 'De timer loopt. Tik op ••• bij een taak voor opties.',
  'ob.demo4': 'Hier verplaats je een taak of vraag je hulp. Vink de rest af om de ring te sluiten.', 'ob.demoDone': 'Ring gesloten. Zo verdien je elke dag XP.',
  'ob.demoTask1': 'Aanrecht afnemen', 'ob.demoTask2': 'Vaatwasser uitruimen', 'ob.demoTask3': 'Woonkamer opruimen',
  'ob.honestTitle': 'Goed om te weten', 'ob.honestSub': 'Wat de app wel en niet kan.',
  'ob.can1': 'Herinnering op een vaste tijd', 'ob.can1s': 'Altijd beschikbaar, zonder instellen.',
  'ob.can2': 'Meldingen op je iPhone', 'ob.can2s': 'Als de app op je beginscherm staat.',
  'ob.can3': 'Seintje als je thuiskomt', 'ob.can3s': 'Via de Opdrachten-app, eenmalig ±1 minuut instellen.',
  'ob.cant1': 'Geen wekker of alarmgeluid', 'ob.cant1s': 'De timer stuurt een melding, geen alarm.',
  'ob.cant2': 'Niet zonder internet', 'ob.cant2s': 'Alles wordt live gedeeld met je huisgenoten.',
  'ob.private': 'Privé', 'ob.privateS': 'Alleen jouw huishouden ziet jullie taken en scores.',
  'ob.accountTitle': 'Bewaar je huis', 'ob.accountSub': 'Maak een account. Daarmee log je in op je telefoon en kunnen huisgenoten meedoen.',
  'ob.email': 'E-mailadres', 'ob.password': 'Wachtwoord (min. 6 tekens)', 'ob.create': 'Account maken', 'ob.creating': 'Je huis wordt ingericht…',
  'ob.summary': '{tasks} taken · ronde van {min} min · herinnering {when}', 'ob.codeTitle': 'Uitnodigingscode', 'ob.codeSub': 'Vraag je huisgenoot om de code. Die staat in de app onder Samen.',
  'ob.codePh': 'Bijv. 3F9A2C', 'ob.badCode': 'Deze code kennen we niet.', 'ob.loginTitle': 'Welkom terug', 'ob.login': 'Inloggen',
  'ob.wrongLogin': 'E-mail of wachtwoord klopt niet.', 'ob.exists': 'Dit e-mailadres heeft al een account. Log in.', 'ob.newHere': 'Nieuw hier? Begin opnieuw',
  // Na het inloggen
  'tour.phoneTitle': 'Maak je iPhone klaar', 'tour.phoneSub': 'Twee minuten, dan werkt alles.', 'tour.install': 'Op je beginscherm',
  'tour.installDone': 'Staat erop', 'tour.installHow': 'Safari > Deel > Zet op beginscherm. Log daar opnieuw in.', 'tour.push': 'Meldingen',
  'tour.pushDone': 'Staan aan', 'tour.pushHow': 'Zo kan Bas je een seintje geven voor je ronde.', 'tour.arrive': 'Seintje bij thuiskomst', 'tour.arriveHow': 'Optioneel. Kan ook later in Instellingen.',
  'tour.firstTitle': 'Je eerste opruimronde', 'tour.firstSub': '{n} {tasks} · ±{min} min · +{xp} XP', 'tour.firstStart': 'Start de ronde', 'tour.firstLater': 'Later vandaag',
  'tour.preparing': 'Je ronde wordt klaargezet…',

  // Meldingen (vandaag-banner etc.)
  'push.done': '{name} is klaar voor vandaag',
  'push.doneT': '{name} is klaar voor vandaag', 'push.doneB': 'De opruimronde is helemaal afgevinkt.',
  'push.taskT': '{name} heeft een taak toegevoegd', 'push.taskB': '{title} (±{min} min). De app plant hem in.',
  'push.kudosT': '{name} geeft je een high five', 'push.kudosB': 'Voor: {title}.',
  'push.timerT': 'Tijd is om', 'push.timerB': 'Je opruimronde zit erop. Vink af wat je gedaan hebt.', 'push.snoozeT': 'Tijd voor je opruimronde?',
  'push.swapT': '{name} vraagt of jij iets wilt overnemen', 'push.swapB': '{title} (±{min} min). Open de app om te antwoorden.',
  'push.yesT': '{name} neemt het over', 'push.yesB': '{title} staat nu bij {name}.', 'push.noT': '{name} kan het nu niet', 'push.noB': '{title} blijft bij jou.',
  'push.testT': 'Meldingen werken', 'push.testB': 'Zo zien je herinneringen eruit.',
}

type Dict = Record<keyof typeof nl, string>

const en: Dict = {
  'app.tagline': 'I’m Bas, your raccoon referee. Whistle ready! Up for a tidy-up round?',
  'common.next': 'Next', 'common.back': 'Back', 'common.skip': 'Skip', 'common.done': 'Done', 'common.save': 'Save',
  'common.close': 'Close', 'common.cancel': 'Cancel', 'common.min': 'min', 'common.minutes': 'minutes', 'common.you': 'You',
  'common.today': 'Today', 'common.yesterday': 'Yesterday', 'common.tomorrow': 'Tomorrow', 'common.share': 'Share', 'common.copy': 'Copy',
  'common.copied': 'Copied', 'common.edit': 'Edit', 'common.later': 'Later', 'common.on': 'On', 'common.off': 'Off',
  'common.task': 'task', 'common.tasks': 'tasks', 'common.xp': 'XP',
  'tab.today': 'Today', 'tab.tasks': 'Tasks', 'tab.progress': 'Progress', 'tab.together': 'Together', 'tab.settings': 'Settings',
  'room.keuken': 'Kitchen', 'room.woonkamer': 'Living room', 'room.badkamer': 'Bathroom', 'room.slaapkamer': 'Bedroom', 'room.was': 'Laundry',
  'room.toilet': 'Toilet', 'room.boven': 'Upstairs', 'room.beneden': 'Downstairs', 'room.hal': 'Hall and stairs', 'room.werkkamer': 'Study',
  'room.kinderkamer': 'Kids’ room', 'room.huisdier': 'Pets', 'room.buiten': 'Garden and balcony', 'room.auto': 'Car and bike', 'room.overig': 'Other',
  'freq.daily': 'daily', 'freq.2': 'every other day', 'freq.n': 'every {n} days', 'freq.weekly': 'weekly', 'freq.biweekly': 'every 2 weeks',
  'freq.monthly': 'monthly', 'freq.2months': 'every 2 months', 'freq.quarter': 'quarterly', 'freq.4months': 'every 4 months',
  'freq.once': 'one-off', 'effort.1': 'Light', 'effort.2': 'Normal', 'effort.3': 'Heavy',
  'days.short': 'Mo,Tu,We,Th,Fr,Sa,Su', 'days.long': 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
  'level': 'Level {n}', 'level.short': 'Lv {n}', 'level.toNext': '{xp} XP to level {n}',
  'level.titles': 'Starter,Tidier,Crumb Hunter,Dust Buster,Laundry Pro,Shine Expert,House Master,Order Legend,Tidy Champion,Grandmaster',
  'level.up.title': 'Level {n} reached', 'level.up.body': 'You are now {title}. On to the next level.',
  'today.morning': 'Good morning', 'today.afternoon': 'Good afternoon', 'today.evening': 'Good evening', 'today.night': 'Good night',
  'today.round': 'Today’s tidy-up round', 'today.roundSub': '{n} {tasks} · ±{min} min · +{xp} XP',
  'today.running': 'Round in progress', 'today.done': 'Round complete', 'today.doneSub': '+{xp} XP earned · {min} min', 'today.rest': 'Rest day',
  'today.restSub': 'Nothing is planned today.', 'today.empty': 'Nothing planned', 'today.emptySub': 'You’re all caught up. Grab a bonus task if you like.',
  'today.start': 'Start {min} min', 'today.later': 'Later', 'today.finish': 'I’m done', 'today.stop': 'Stop timer',
  'today.timeUp': 'Time’s up. Check off what you did.', 'today.reminderNote': 'Reminder at {time}', 'today.reminderArrive': 'Bas will give you a nudge when you get home',
  'today.reminderBoth': 'Bas will nudge you at {time} or when you get home', 'today.snoozed': 'Snoozed: {reason}', 'today.snoozeArrive': 'You’ll get a nudge when you get home',
  'today.snoozeAt': 'New reminder at {time}', 'today.resume': 'Do it now', 'today.extrasTitle': 'Bonus: {min} min left',
  'today.extrasTitleNoTime': 'Bonus tasks', 'today.extrasNone': 'No bonus tasks needed. All caught up.', 'today.extra': 'bonus',
  'today.log': 'Already did something?', 'today.logSub': 'Log it for XP. Your schedule adjusts.',
  'today.install': 'Add the app to your Home Screen', 'today.installSub': 'Required for notifications on iPhone.',
  'today.push': 'Turn on notifications', 'today.pushSub': 'Let Bas give you a nudge when it’s time for your round.',
  'today.housemates': 'Housemates', 'today.mateProgress': '{done} of {n} done', 'today.mateDone': 'Done for today', 'today.mateBusy': 'Tidying now',
  'today.mateSnoozed': 'Snoozed: {reason}', 'today.mateNone': 'Nothing planned today', 'today.asksYou': '{name} asks if you can take this over',
  'today.swapYes': 'Take over', 'today.swapNo': 'Not now', 'today.asked': 'asked', 'today.together': 'together',
  'today.invite': 'Invite your housemates', 'today.inviteSub': '{n} of {size} have joined. Share your code in Together.',
  'today.streak': '{n}-day streak', 'today.streak1': '1-day streak',
  'menu.moveTo': 'Move to', 'menu.tomorrow': 'Tomorrow', 'menu.dayAfter': 'Day after tomorrow', 'menu.weekend': 'The weekend', 'menu.nextWeek': 'Next week',
  'menu.ask': 'Ask to take over', 'menu.askSub': 'Your housemate gets a notification', 'menu.undo': 'Not done after all', 'menu.undoSub': 'Removes the check and the XP',
  'menu.together': 'Done together with…', 'menu.togetherSub': 'Everyone gets the full XP', 'menu.notTogether': 'Not together after all',
  'snooze.title': 'Not now', 'snooze.why': 'Why not now?', 'snooze.when': 'Remind me', 'snooze.custom': 'Or type a reason',
  'snooze.r.gym': 'Workout', 'snooze.r.shop': 'Groceries', 'snooze.r.cook': 'Cooking', 'snooze.r.guests': 'Guests', 'snooze.r.work': 'Work', 'snooze.r.tired': 'Tired',
  'snooze.w.arrive': 'When I get home', 'snooze.w.1h': 'In 1 hour', 'snooze.w.2h': 'In 2 hours', 'snooze.w.tomorrow': 'Tomorrow',
  'snooze.noteArrive': 'If the arrival nudge doesn’t come, you’ll get a reminder after 3 hours anyway.',
  'snooze.noteTomorrow': 'Anything left today is rescheduled tomorrow.', 'snooze.noteShare': 'Your housemates see the reason.', 'snooze.save': 'Snooze',
  'tasks.title': 'Tasks', 'tasks.all': 'All', 'tasks.overdue': 'Overdue', 'tasks.recurring': 'Recurring', 'tasks.once': 'One-off',
  'tasks.lateDays': '{n} days late', 'tasks.lateYesterday': 'Since yesterday', 'tasks.doToday': 'Do today', 'tasks.next': 'Next: {when}',
  'tasks.moved': 'Moved to {when}', 'tasks.doneToday': 'Done today', 'tasks.doneAgo': 'Done {n} d ago', 'tasks.empty': 'No tasks yet. Add some with +.',
  'tasks.nothingFixed': 'No fixed tasks today', 'tasks.from': 'from {date}',
  'task.new': 'New task', 'task.edit': 'Edit task', 'task.fromLib': 'From library', 'task.own': 'Create your own',
  'task.placeholder': 'What needs doing?', 'task.room': 'Room', 'task.duration': 'Duration', 'task.effort': 'Effort', 'task.effortNote': 'Heavier tasks earn more XP.',
  'task.when': 'When', 'task.whenOnce': 'Once', 'task.whenWeekly': 'Fixed days', 'task.whenInterval': 'Every x days', 'task.from': 'From', 'task.asap': 'as soon as possible',
  'task.who': 'Who', 'task.whoAuto': 'Share automatically', 'task.add': 'Add', 'task.delete': 'Delete task', 'task.logDone': 'I already did this',
  'task.addN': 'Add {n} {tasks}', 'task.pickSome': 'Pick one or more tasks',
  'lib.search': 'Search, e.g. duvet, limescale or cat', 'lib.noResults': 'Nothing found for “{q}”. Create it yourself.', 'lib.count': '{n} tasks',
  'lib.chosen': '{n} selected', 'lib.have': 'Added', 'lib.otherRooms': 'Show other rooms',
  'log.title': 'Already done', 'log.intro': 'Tidied something outside the app? Log it for XP. The next time this task is due moves along.',
  'log.what': 'What did you do?', 'log.new': 'New task', 'log.repeat': 'Comes back regularly (weekly)', 'log.change': 'Tap to pick something else',
  'log.duration': 'How long did it take?', 'log.when': 'When?', 'log.with': 'Done together with {name}', 'log.saved': 'Logged', 'log.next': 'Next time: {when}',
  'log.xp': '+{xp} XP',
  'prog.week': 'This week', 'prog.weekSolo': 'Your week', 'prog.pointsInfo': 'XP = minutes × effort (light ×0.75, normal ×1, heavy ×1.5). Tasks done together count for everyone.',
  'prog.lead': '{name} leads by {n} XP', 'prog.leadYou': 'You lead by {n} XP', 'prog.tie': 'It’s a tie', 'prog.noneYet': 'Nothing done yet this week.',
  'prog.lastWeek': 'Last week {name} won', 'prog.lastWeekYou': 'Last week you won', 'prog.best': 'Best week: {xp} XP', 'prog.vsLast': '{diff} XP vs last week',
  'prog.tasksN': '{n} tasks', 'prog.challenge': 'Weekly challenge', 'prog.challengeDone': 'Completed',
  'prog.streak': 'Streak', 'prog.streakSub': 'Days in a row your round was completed. Rest days don’t count.',
  'prog.badges': 'Badges', 'prog.house': 'Home condition', 'prog.houseSub': 'How well each room is kept up. Overdue tasks lower the score.',
  'prog.log': 'Activity', 'prog.logSub': 'Everything done this week', 'prog.logEmpty': 'Everything that happens this week shows up here.',
  'prog.showAll': 'Show all ({n})', 'prog.showLess': 'Show less', 'prog.kudos': 'Give a high five', 'prog.kudosGiven': 'High five given',
  'prog.extra': 'bonus', 'prog.with': 'with {name}', 'prog.invite': 'Invite your housemates', 'prog.inviteSub': 'Have them open the app and enter this code.',
  'ch.bath': 'Bathroom week', 'ch.bathSub': 'Do 3 bathroom or toilet tasks', 'ch.ring': 'Five rings', 'ch.ringSub': 'Complete your round on 5 days',
  'ch.heavy': 'Heavyweight', 'ch.heavySub': 'Do 3 heavy tasks', 'ch.kitchen': 'Kitchen week', 'ch.kitchenSub': 'Do 5 kitchen tasks',
  'ch.bonus': 'Bonus hunter', 'ch.bonusSub': 'Do 3 bonus tasks or log 3 chores', 'ch.hour': 'Power hour', 'ch.hourSub': 'Tidy 60 minutes this week',
  'b.first': 'First chore', 'b.firstSub': 'Checked off your first task', 'b.week': 'Full week', 'b.weekSub': 'Something done 7 days in a row',
  'b.heavy': 'Heavy lifter', 'b.heavySub': '5 heavy tasks', 'b.laundry': 'Laundry pro', 'b.laundrySub': '10 loads of laundry',
  'b.self': 'Self-starter', 'b.selfSub': '5 bonus or logged tasks', 'b.team': 'Team player', 'b.teamSub': '5 chores together',
  'b.hour': 'Power hour', 'b.hourSub': '60 min in one week', 'b.kudos': 'Appreciated', 'b.kudosSub': '5 high fives received', 'b.level5': 'House master', 'b.level5Sub': 'Reached level 5',
  'set.title': 'Settings', 'set.round': 'Tidy-up round', 'set.roundLength': 'Length', 'set.roundFoot': 'How much time the app plans per person per day. ≈ {n} tasks per round.',
  'set.rest': 'Rest days', 'set.restFoot': 'Nothing is planned on rest days and your streak stays intact.', 'set.restNone': 'No rest days',
  'set.reminder': 'Reminder', 'set.reminderMode': 'When', 'set.modeTime': 'Fixed time', 'set.modeArrive': 'Arriving home', 'set.modeBoth': 'Both',
  'set.reminderFoot': 'A daily nudge with your tasks. If you set up the arriving-home nudge, that comes first and the time is a fallback.',
  'set.reminderFootArrive': 'You only get a nudge when you get home. Set it up once below via the Shortcuts app.',
  'set.time': 'Time', 'set.arriveSetup': 'Set up arriving home', 'set.arriveSetupSub': 'One-time in the Shortcuts app, ±1 min',
  'set.arriveCopy': 'Copy link and open Shortcuts', 'set.arriveCopied': 'Link copied. Open Shortcuts',
  'set.arriveS1': 'Tap Automation, then +', 'set.arriveS2': 'Choose "Arrive", pick your home address and turn on "Run Immediately"',
  'set.arriveS3': 'Choose "New Blank Automation" and add "Get Contents of URL"', 'set.arriveS4': 'Paste the link as the URL and tap Done',
  'set.arriveWhy': 'Apple doesn’t let apps create automations, hence these few steps.',
  'set.notif': 'Notifications', 'set.notifStatusOn': 'On for this device', 'set.notifStatusOff': 'Off for this device', 'set.notifTurnOn': 'Turn on', 'set.notifTest': 'Test',
  'set.notifSent': 'Sent', 'set.notifInstall': 'Add the app to your Home Screen first', 'set.notifDenied': 'Blocked. Turn them on in iPhone Settings > Notifications.',
  'set.notifUnsupported': 'This browser doesn’t support notifications.', 'set.notifFoot': 'Choose which notifications you get. Applies to all your devices.',
  'set.n.reminder': 'Reminders from Bas', 'set.n.timer': 'Timer finished', 'set.n.swap': 'Take-over requests', 'set.n.done': 'Housemate finished',
  'set.n.task': 'New task from housemate', 'set.n.kudos': 'High fives',
  'set.house': 'Household', 'set.size': 'People', 'set.sizeSolo': 'Just me', 'set.sizeN': '{n} people', 'set.members': 'Members',
  'set.code': 'Invite code', 'set.houseFoot': 'Housemates join with this code. Tasks and XP are shared fairly.',
  'set.houseFootSolo': 'You’re on your own: the app plans everything for you. Living with others? Increase the number of people.',
  'set.you': 'Your profile', 'set.name': 'Name', 'set.color': 'Color', 'set.youFoot': 'This is how your housemates see you.',
  'set.feel': 'Feedback', 'set.sound': 'Sound on check-off', 'set.haptics': 'Haptics', 'set.feelFoot': 'Haptics on iPhone need iOS 18 or later.',
  'set.lang': 'Language', 'set.langAuto': 'Automatic', 'set.more': 'More', 'set.tour': 'View the intro again', 'set.logout': 'Log out',
  'set.version': 'Opgeruimd · housework as a game',
  'ob.start': 'Get started', 'ob.haveCode': 'I have an invite code', 'ob.haveAccount': 'I already have an account',
  'ob.w1': 'A short tidy-up round each day', 'ob.w1s': 'A few quarter-hour tasks, smartly scheduled.',
  'ob.w2': 'Earn XP and level up', 'ob.w2s': 'Streaks, challenges and badges turn it into a game.',
  'ob.w3': 'Solo or together', 'ob.w3s': 'Works if you live alone and for the whole household.',
  'ob.youTitle': 'What’s your name?', 'ob.youSub': 'Pick a color too. It shows next to your tasks and score.', 'ob.namePh': 'Your first name',
  'ob.houseTitle': 'Who do you live with?', 'ob.houseSub': 'The app adapts to this. You can change it later.',
  'ob.solo': 'Just me', 'ob.soloSub': 'Everything is planned for you. Play against your own record.',
  'ob.duo': 'The two of us', 'ob.duoSub': 'Tasks are shared fairly. See each other’s progress and give high fives.',
  'ob.group': 'More people', 'ob.groupSub': 'For families and housemates. Everyone gets their own round.', 'ob.groupCount': '{n} people',
  'ob.roomsTitle': 'Which rooms do you have?', 'ob.roomsSub': 'We’ll only show tasks that fit your home.',
  'ob.tasksTitle': 'What needs doing?', 'ob.tasksSub': 'Popular tasks are already on. How often, how long and how heavy are filled in.',
  'ob.rhythmTitle': 'Your rhythm', 'ob.rhythmSub': 'How long is a tidy-up round, and when do you want a nudge?',
  'ob.demoTitle': 'Give it a try', 'ob.demoSub': 'This is how a round works. Play the three steps.',
  'ob.demo1': 'Tap the circle to check off a task.', 'ob.demo2': 'Nice, +{xp} XP. Now start the timer.', 'ob.demo3': 'The timer is running. Tap ••• on a task for options.',
  'ob.demo4': 'Move a task or ask for help here. Check off the rest to close the ring.', 'ob.demoDone': 'Ring closed. That’s how you earn XP every day.',
  'ob.demoTask1': 'Wipe the counter', 'ob.demoTask2': 'Empty the dishwasher', 'ob.demoTask3': 'Tidy the living room',
  'ob.honestTitle': 'Good to know', 'ob.honestSub': 'What the app can and can’t do.',
  'ob.can1': 'Reminder at a fixed time', 'ob.can1s': 'Always available, no setup needed.',
  'ob.can2': 'Notifications on your iPhone', 'ob.can2s': 'When the app is on your Home Screen.',
  'ob.can3': 'A nudge when you get home', 'ob.can3s': 'Via the Shortcuts app, one-time ±1 minute setup.',
  'ob.cant1': 'No alarm sound', 'ob.cant1s': 'The timer sends a notification, not an alarm.',
  'ob.cant2': 'Not offline', 'ob.cant2s': 'Everything is shared live with your housemates.',
  'ob.private': 'Private', 'ob.privateS': 'Only your household sees your tasks and scores.',
  'ob.accountTitle': 'Save your home', 'ob.accountSub': 'Create an account. Use it to sign in on your phone and let housemates join.',
  'ob.email': 'Email address', 'ob.password': 'Password (min. 6 characters)', 'ob.create': 'Create account', 'ob.creating': 'Setting up your home…',
  'ob.summary': '{tasks} tasks · {min}-min round · reminder {when}', 'ob.codeTitle': 'Invite code', 'ob.codeSub': 'Ask your housemate for the code. It’s in the app under Together.',
  'ob.codePh': 'E.g. 3F9A2C', 'ob.badCode': 'We don’t recognise this code.', 'ob.loginTitle': 'Welcome back', 'ob.login': 'Log in',
  'ob.wrongLogin': 'Email or password is incorrect.', 'ob.exists': 'This email already has an account. Log in.', 'ob.newHere': 'New here? Start over',
  'tour.phoneTitle': 'Set up your iPhone', 'tour.phoneSub': 'Two minutes and everything works.', 'tour.install': 'On your Home Screen',
  'tour.installDone': 'Added', 'tour.installHow': 'Safari > Share > Add to Home Screen. Sign in there again.', 'tour.push': 'Notifications',
  'tour.pushDone': 'On', 'tour.pushHow': 'Let Bas give you a nudge when it’s time for your round.', 'tour.arrive': 'Nudge when you get home', 'tour.arriveHow': 'Optional. You can also do this later in Settings.',
  'tour.firstTitle': 'Your first tidy-up round', 'tour.firstSub': '{n} {tasks} · ±{min} min · +{xp} XP', 'tour.firstStart': 'Start the round', 'tour.firstLater': 'Later today',
  'tour.preparing': 'Getting your round ready…',
  'push.done': '{name} is done for today',
  'push.doneT': '{name} is done for today', 'push.doneB': 'The tidy-up round is fully checked off.',
  'push.taskT': '{name} added a task', 'push.taskB': '{title} (±{min} min). The app will schedule it.',
  'push.kudosT': '{name} gave you a high five', 'push.kudosB': 'For: {title}.',
  'push.timerT': 'Time’s up', 'push.timerB': 'Your tidy-up round is done. Check off what you did.', 'push.snoozeT': 'Time for your tidy-up round?',
  'push.swapT': '{name} asks if you can take something over', 'push.swapB': '{title} (±{min} min). Open the app to answer.',
  'push.yesT': '{name} is taking it over', 'push.yesB': '{title} is now with {name}.', 'push.noT': '{name} can’t right now', 'push.noB': '{title} stays with you.',
  'push.testT': 'Notifications work', 'push.testB': 'This is what your reminders look like.',
}

const DICTS: Record<Lang, Dict> = { nl, en }
export type TKey = keyof typeof nl

export function t(key: TKey, vars?: Record<string, string | number>): string {
  let s: string = DICTS[lang][key] ?? nl[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}
export const list = (key: TKey) => t(key).split(',')
export const plural = (n: number, one: TKey = 'common.task', many: TKey = 'common.tasks') => t(n === 1 ? one : many)
