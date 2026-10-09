(function(PF){
  "use strict";

  /* ---- Translations.
     Dutch is the source language and lives in the HTML itself, so it can never drift out of
     sync with the markup. Each element's original copy is stashed on init; a language with
     no dictionary here simply restores that source. English and Polish are explicit. ---- */
  var T = {
    en:{
      "nav.about":"About","nav.skills":"Skills","nav.experience":"Experience","nav.projects":"Projects","nav.contact":"Contact",
      "cv.nav":"CV","cv.download":"Download CV","cv.github":"GitHub",
      "hero.tagline":"Mostly interested in backend development, UI/UX and automation.",
      "about.heading":"About",
      "about.body":"I'm Dominik, 19, and I study Software Development (MBO-4) at Talland College in Alkmaar. I'm mostly interested in backend development and UI/UX.",
      "about.langLabel":"Languages I speak","about.langPl":"Polish","about.langNl":"Dutch",
      "about.factFocusLabel":"Focus","about.factFocusValue":"Backend development, UI/UX and automation",
      "about.factOpenLabel":"Open to","about.factOpenValue":"Internships and junior roles",
      "about.factEduLabel":"Education","about.factEduValue":"MBO-4 Software Development, Talland College Alkmaar (3rd year)",
      "skills.heading":"Skills","skills.groupBackend":"Backend","skills.groupFrontend":"Frontend","skills.groupDesktop":"Desktop &amp; .NET","skills.groupTools":"Tools",
      "experience.heading":"Experience",
      "experience.meta":"2025 · 640 hours · 6 months",
      "experience.role":"Internship Software Developer · UI/UX Lead, Backend Developer",
      "experience.body":"During my previous internship at ICT Vanaf Morgen I worked mostly on internal projects, such as my own variant of SharePoint and an API Data Mapper. I also helped out with tickets on other projects.",
      "experience.body2":"Within those projects I mostly worked on admin panels and the accompanying authentication, API connections and fetching data. I also regularly took on the role of lead designer, where I was responsible for the UI/UX.",
      "experience.nextLabel":"What's next","experience.nextTitle":"Looking for my next internship",
      "experience.nextBody":"Open to internships.",
      "projects.heading":"Projects","projects.featured":"Featured project",
      "projects.nyaasi":"Reads the nyaa.si feeds for the anime in my config and sends every new episode to my local qBittorrent as a magnet link. It remembers which episode I already had, so nothing gets added twice.",
      "projects.bakkerai":"A chat app where bakery students can ask about recipes, techniques and theory. Log in, keep your chat history, and read it all back on an admin page.",
      "projects.bakkeraiSum":"AI chatbot for bakery students",
      "projects.qbit":"Logs into my local qBittorrent and exposes two endpoints: one to add a torrent from a magnet link, one that returns the torrent list.",
      "projects.qbitSum":"Small Go service bridging to qBittorrent",
      "projects.exhibition":"A game launcher for Windows, macOS and Linux with a built-in BitTorrent client. Still under construction.",
      "projects.exhibitionSum":"Game launcher with its own BitTorrent client",
      "projects.view":"View on GitHub","projects.more":"More projects on GitHub","projects.moreLabel":"More projects",
      "contact.heading":"Let's talk","contact.body":"Have a project in mind, or just want to say hi? Reach out.",
      "contact.copy":"Copy email",
      "footer.text":"© 2026 Dominik. Built with care.","footer.top":"Back to top"
    },
    pl:{
      "nav.about":"O mnie","nav.skills":"Umiejętności","nav.experience":"Doświadczenie","nav.projects":"Projekty","nav.contact":"Kontakt",
      "cv.nav":"CV","cv.download":"Pobierz CV","cv.github":"GitHub",
      "hero.tagline":"Interesuję się głównie backendem, UI/UX i automatyzacją.",
      "about.heading":"O mnie",
      "about.body":"Jestem Dominik, mam 19 lat i studiuję Software Development (MBO-4) w Talland College w Alkmaar. Interesuję się głównie backendem i UI/UX.",
      "about.langLabel":"Języki, którymi mówię","about.langPl":"Polski","about.langNl":"Niderlandzki",
      "about.factFocusLabel":"Fokus","about.factFocusValue":"Backend, UI/UX i automatyzacja",
      "about.factOpenLabel":"Otwarty na","about.factOpenValue":"Staże i role juniorskie",
      "about.factEduLabel":"Wykształcenie","about.factEduValue":"MBO-4 Software Development, Talland College Alkmaar (3. rok)",
      "skills.heading":"Umiejętności","skills.groupBackend":"Backend","skills.groupFrontend":"Frontend","skills.groupDesktop":"Desktop i .NET","skills.groupTools":"Narzędzia",
      "experience.heading":"Doświadczenie",
      "experience.meta":"2025 · 640 godzin · 6 miesięcy",
      "experience.role":"Staż Software Developer · UI/UX Lead, Backend Developer",
      "experience.body":"Podczas mojego stażu w ICT Vanaf Morgen pracowałem głównie nad wewnętrznymi projektami, takimi jak własna wersja SharePoint oraz API Data Mapper. Pomagałem też z ticketami w innych projektach.",
      "experience.body2":"W tych projektach zajmowałem się głównie panelami administracyjnymi oraz powiązanymi z nimi uwierzytelnianiem, połączeniami API i pobieraniem danych. Regularnie pełniłem też rolę lead designera, za co odpowiadałem za UI/UX.",
      "experience.nextLabel":"Co dalej","experience.nextTitle":"Szukam kolejnego stażu",
      "experience.nextBody":"Otwarty na staże.",
      "projects.heading":"Projekty","projects.featured":"Wyróżniony projekt",
      "projects.nyaasi":"Odczytuje kanały RSS z nyaa.si dla anime z mojej konfiguracji i wysyła każdy nowy odcinej jako magnet do lokalnego qBittorrenta. Pamięta, który odcinej już mam, więc nic nie dodaje się dwa razy.",
      "projects.bakkerai":"Aplikacja czatu, w której studenci cukiernictwa pytają o receptury, techniki i teorię. Logowanie, historia rozmów i panel admina do jej przeglądania.",
      "projects.bakkeraiSum":"Czatbot AI dla studentów cukiernictwa",
      "projects.qbit":"Loguje się do lokalnego qBittorrenta i udostępnia dwa endpointy: jeden dodaje torrent przez link magnet, drugi zwraca listę torrentów.",
      "projects.qbitSum":"Mała usługa w Go będąca pomostem do qBittorrenta",
      "projects.exhibition":"Launcher gier dla Windows, macOS i Linuksa z wbudowanym klientem BitTorrent. Wciąż w budowie.",
      "projects.exhibitionSum":"Launcher gier z własnym klientem BitTorrent",
      "projects.view":"Zobacz na GitHub","projects.more":"Więcej projektów na GitHub","projects.moreLabel":"Więcej projektów",
      "contact.heading":"Pogadajmy","contact.body":"Masz jakiś projekt w głowie albo chcesz się po prostu przywitać? Napisz.",
      "contact.copy":"Kopiuj e-mail",
      "footer.text":"© 2026 Dominik. Zbudowane z dbałością.","footer.top":"Do góry"
    }
  };

  var COPIED = { nl:'Gekopieerd!', en:'Copied!', pl:'Skopiowano!' };
  var els = PF.$$('[data-i18n]');

  // Stash each element's own Dutch copy so a language without a dictionary can restore it.
  els.forEach(function(el){ el.setAttribute('data-i18n-src', el.textContent); });

  function applyLang(lang){
    var dict = T[lang];
    document.documentElement.setAttribute('lang', lang);
    els.forEach(function(el){
      var key = el.getAttribute('data-i18n');
      var v = dict && dict[key];
      el.textContent = (v === undefined) ? el.getAttribute('data-i18n-src') : v;
    });
    PF.$$('.lang-switch button').forEach(function(b){
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try{ localStorage.setItem('lang', lang); }catch(e){}
  }

  PF.$$('.lang-switch button').forEach(function(b){
    b.addEventListener('click', function(){ applyLang(b.getAttribute('data-lang')); });
  });

  var saved = null; try{ saved = localStorage.getItem('lang'); }catch(e){}
  applyLang(saved || 'nl');

  // "Copied!" feedback, in whichever language is active
  PF.copied = function(){ return COPIED[document.documentElement.lang] || COPIED.nl; };
})(window.PF);