(function(PF){
  "use strict";

  /* ---- Translations.
     Dutch is the source language and lives in the HTML itself, so it can never drift out of
     sync with the markup. Each element's original copy is stashed on init; a language with
     no dictionary here simply restores that source. English and Polish are explicit.

     Three attributes, not one. [data-i18n] writes textContent and is right for anything that is
     only words - headings, labels, buttons. [data-i18n-html] writes innerHTML, for the project
     pages, where a sentence carries an inline <code>, <strong> or <em> that has to survive
     being written in another language. [data-i18n-aria-label] names the attribute instead of
     the content, for the translated strings that live in an accessibility attribute rather than
     in anything a reader sees - the project pages' chapter rail is the only one today. All
     three stash their own source the same way, so a language with no entry still falls back to
     the Dutch markup rather than to bare text. The values are authored here, not user input, so
     innerHTML is not a risk here. ---- */
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
      "experience.meta":"2026 · 640 hours · 6 months",
      "experience.role":"Internship Software Developer · UI/UX Lead, Backend Developer",
      "experience.body":"During my previous internship at ICT Vanaf Morgen I worked mostly on internal projects, such as my own variant of SharePoint and an API Data Mapper. I also helped out with tickets on other projects.",
      "experience.body2":"Within those projects I mostly worked on admin panels and the accompanying authentication, API connections and fetching data. I also regularly took on the role of lead designer, where I was responsible for the UI/UX.",
      "experience.nextLabel":"What's next","experience.nextTitle":"Looking for my next internship",
      "experience.nextBody":"Open to internships.",
      "projects.heading":"Projects","projects.featured":"Featured project",
      "projects.nyaasi":"Reads the nyaa.si feeds for the anime in my config and sends every new episode to my local qBittorrent as a magnet link. It remembers which episode I already had, so nothing gets added twice.",
      "projects.bakkeraiSum":"AI chatbot for bakery students",
      "projects.qbitSum":"Small Go service bridging to qBittorrent",
      "projects.exhibition":"A game launcher for Windows, macOS and Linux with a built-in BitTorrent client. Still under construction.",
      "projects.exhibitionSum":"Game launcher with its own BitTorrent client",
      "projects.view":"View on GitHub","projects.more":"More projects on GitHub","projects.moreLabel":"More projects","projects.readMore":"Read more",

      /* Project detail pages (projects/*.html). The shared labels come first; everything under
         qbit is the one page that exists so far. */
      "pp.back":"← All projects","pp.source":"View on GitHub",
      "pp.nextTo":"Next: nyaasiauto →","pp.bakker.nextTo":"Next: qbit-service →",
      "pp.chapters":"Chapters","pp.why":"Why I built this","pp.does":"What it does","pp.api":"API endpoints",
      "pp.require":"Requirements","pp.run":"Run",
      "pp.limits":"What it doesn't have yet",
      "pp.qbit.tagline":"A small Go service that connects to a local qBittorrent Web UI and exposes a few simple HTTP endpoints for adding torrents and checking torrent information.",
      "pp.qbit.why":"I wanted to pull data out of the qBittorrent client API for <a href=\"https://github.com/Git-Dominik/NyaasiAuto\" target=\"_blank\" rel=\"noopener\">NyaasiAuto</a>, a small, lightweight program. But the libraries that already do this are packed with features I don't need.",
      "pp.qbit.why2":"Working out what I did <em>not</em> need seemed like more work than writing the five functions themselves. So two endpoints, and nothing else.",
      "pp.qbit.does1":"Authenticates to qBittorrent at <code>http://localhost:8080</code>",
      "pp.qbit.does2":"Adds torrents using a magnet link",
      "pp.qbit.does3":"Exposes torrent info through a local API",
      "pp.qbit.does4":"Runs a lightweight HTTP server on port <code>8081</code>",
      "pp.qbit.addTitle":"POST /add-torrent","pp.qbit.addBody":"Adds a torrent by magnet URL.",
      "pp.qbit.infoTitle":"GET /info","pp.qbit.infoBody":"Returns the current torrent list from qBittorrent as JSON.",
      "pp.qbit.envTitle":"Environment variables","pp.qbit.envBody":"Create a <code>.env</code> file in the project root with:",
      "pp.qbit.envBody2":"The app loads these variables using <code>godotenv</code>.",
      "pp.qbit.require1":"Go installed",
      "pp.qbit.require2":"A qBittorrent Web UI running locally at <code>http://localhost:8080</code>",
      "pp.qbit.require3":"A valid qBittorrent username and password",
      "pp.qbit.runBody":"The service will start on <code>http://localhost:8081</code>.",

      "pp.nyaasi.tagline":"A tiny Go project to keep track of anime releases on nyaa.si and automatically send new torrents to qBittorrent.",
      "pp.nyaasi.why":"Checking nyaa.si every couple of hours to see if anything new came out had become a habit. So: a script that does it for me. It watches the anime I follow, and the moment a new episode shows up I send it straight to qBittorrent.",
      "pp.nyaasi.why2":"It's a personal automation script for keeping up with anime releases without manually checking nyaa.si every few hours.",
      "pp.nyaasi.does1":"Reads anime targets from <code>config.json</code>",
      "pp.nyaasi.does2":"Checks nyaa.si RSS feeds for new episodes",
      "pp.nyaasi.does3":"Matches the configured uploaders",
      "pp.nyaasi.does4":"Sends new magnet links to the local qBittorrent bridge",
      "pp.nyaasi.does5":"Keeps track of the last watched episode so it doesn't keep re-adding old ones",
      "pp.nyaasi.partsTitle":"Main parts",
      "pp.nyaasi.parts1":"<code>cmd/qbit-service</code> — the local qBittorrent bridge",
      "pp.nyaasi.parts2":"<code>cmd/rss-scraper</code> — checks for new episodes and submits torrents",
      "pp.nyaasi.partsBody":"The bridge is <a href=\"qbit-service.html\" data-i18n=\"pp.nyaasi.qbitLink\">qbit-service</a>, which also sits in the repo as its own project.",
      "pp.nyaasi.qbitLink":"qbit-service",
      "pp.nyaasi.feedTitle":"Finding the feed",
      "pp.nyaasi.feedBody":"One RSS feed is built per anime title and per uploader. The colon comes out of the title first, because it would make the query unreadable.",
      "pp.nyaasi.feedBody2":"The season and episode number are pulled out of each item title. The regex accepts three spellings and the season is optional:",
      "pp.nyaasi.matchTitle":"Recognising a new episode",
      "pp.nyaasi.matchBody":"It doesn't look for the newest episode, it looks for exactly the next one: the season and episode number from <code>config.json</code>, plus one. Only on an exact match does anything go to the bridge.",
      "pp.nyaasi.matchBody2":"The whole list is written back to <code>config.json</code> afterwards, so the progress survives the next round:",
      "pp.nyaasi.require1":"Go installed",
      "pp.nyaasi.require2":"A qBittorrent Web UI running locally",
      "pp.nyaasi.envTitle":"A <code>.env</code> file in <code>cmd/qbit-service</code>:",
      "pp.nyaasi.configTitle":"A <code>config.json</code> in the project root with your anime list:",
      "pp.nyaasi.configBody":"You can add as many anime titles as you want.",
      "pp.nyaasi.runBridge":"Start the qBittorrent bridge first:",
      "pp.nyaasi.runScraper":"Then start the scraper:",
      "pp.nyaasi.limit1":"<strong>The first uploader that matches wins.</strong> The uploaders go one by one and the moment something is found the loop stops. The rest of the list isn't checked that round.",
      "pp.nyaasi.limit2":"<strong>The regex misses a lot of spellings.</strong> It reads <code>S01E02</code>, <code>Episode 05</code> and <code>- 12</code>, but not a bare <code>12</code> or <code>1x12</code>. With no season in the title, the season defaults to 1.",

      "pp.bakker.tagline":"An AI chatbot for bakery students at Talland College. Ask questions about recipes, techniques, theory and school work.",
      "pp.bakker.why":"Bakery school is a lot of theory and practical assignments on paper. Finding a recipe somewhere online is a decent start, but doing it in exactly the right order is a different story. So: a chatbot that can look up the actual recipes and lesson material from Talland.",
      "pp.bakker.why2":"A small project to help bakery students learn and ask questions more easily.",
      "pp.bakker.does1":"User login and register",
      "pp.bakker.does2":"AI chat for bakery-related questions",
      "pp.bakker.does3":"Saves chat history",
      "pp.bakker.does4":"Admin page to view users and chats",
      "pp.bakker.toolsTitle":"The tools",
      "pp.bakker.toolsBody":"The chatbot gets six tools, and the system prompt says outright that it must work <em>always</em> through those tools and never from its own knowledge. None of the recipes or lesson material lives in this project; it fetches it from svhbakkerstalent.nl.",
      "pp.bakker.tool1":"<code>getRecipesCategoriesTool</code> — every recipe category for a theme",
      "pp.bakker.tool2":"<code>getRecipesTool</code> — the slugs of every recipe in that category",
      "pp.bakker.tool3":"<code>getRecipeTool</code> — one recipe, by that slug",
      "pp.bakker.tool4":"<code>getLessonTopicsTool</code> — the topics of year 1",
      "pp.bakker.tool5":"<code>getLessonItemsTool</code> — the lesson items within a topic",
      "pp.bakker.tool6":"<code>getLessonPageTool</code> — the content of one lesson page",
      "pp.bakker.toolsBody2":"Each tool is a separate function with Playwright: log in, set the right filters, read the results out of the DOM. The route the AI follows is written into the prompt, including that it has to keep paginating for as long as there are pages left.",
      "pp.bakker.scrapeTitle":"Reading the site",
      "pp.bakker.scrapeBody":"You can't just fetch JSON from svhbakkerstalent.nl, so a headless Firefox is opened. Log in first, then save the storage so the next tool call reuses the cookie instead of logging in again.",
      "pp.bakker.scrapeBody2":"And then one of the tools, which walks the recipe list and takes the slug from the link rather than the visible name:",
      "pp.bakker.streamTitle":"Answers come as a stream",
      "pp.bakker.streamBody":"A recipe takes a while to answer, so the model streams. The chunks go to the browser one at a time as newline-delimited JSON, and if a student closes the tab mid-answer the stream has to stop too. That runs through the <code>AbortSignal</code> of the request itself.",
      "pp.bakker.dataTitle":"Users and chats",
      "pp.bakker.dataBody":"Three tables and nothing more. Passwords go through <code>argon2</code>, and after that a JWT goes into an httpOnly cookie for seven days.",
      "pp.bakker.dataBody2":"The title above a conversation is only added afterwards, the first time an answer comes back:",
      "pp.bakker.runBody":"The app runs on <code>http://localhost:3000</code>.",

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
      "experience.meta":"2026 · 640 godzin · 6 miesięcy",
      "experience.role":"Staż Software Developer · UI/UX Lead, Backend Developer",
      "experience.body":"Podczas mojego stażu w ICT Vanaf Morgen pracowałem głównie nad wewnętrznymi projektami, takimi jak własna wersja SharePoint oraz API Data Mapper. Pomagałem też z ticketami w innych projektach.",
      "experience.body2":"W tych projektach zajmowałem się głównie panelami administracyjnymi oraz powiązanymi z nimi uwierzytelnianiem, połączeniami API i pobieraniem danych. Regularnie pełniłem też rolę lead designera, za co odpowiadałem za UI/UX.",
      "experience.nextLabel":"Co dalej","experience.nextTitle":"Szukam kolejnego stażu",
      "experience.nextBody":"Otwarty na staże.",
      "projects.heading":"Projekty","projects.featured":"Wyróżniony projekt",
      "projects.nyaasi":"Odczytuje kanały RSS z nyaa.si dla anime z mojej konfiguracji i wysyła każdy nowy odcinek jako magnet do lokalnego qBittorrenta. Pamięta, który odcinek już mam, więc nic nie dodaje się dwa razy.",
      "projects.bakkeraiSum":"Czatbot AI dla studentów cukiernictwa",
      "projects.qbitSum":"Mała usługa w Go będąca pomostem do qBittorrenta",
      "projects.exhibition":"Launcher gier dla Windows, macOS i Linuksa z wbudowanym klientem BitTorrent. Wciąż w budowie.",
      "projects.exhibitionSum":"Launcher gier z własnym klientem BitTorrent",
      "projects.view":"Zobacz na GitHub","projects.more":"Więcej projektów na GitHub","projects.moreLabel":"Więcej projektów","projects.readMore":"Czytaj więcej",

      "pp.back":"← Wszystkie projekty","pp.source":"Zobacz na GitHub","pp.nextTo":"Dalej: nyaasiauto →","pp.bakker.nextTo":"Dalej: qbit-service →",
      "pp.chapters":"Rozdziały","pp.why":"Dlaczego to zbudowałem","pp.does":"Co robi","pp.api":"Endpointy API",
      "pp.require":"Wymagania","pp.run":"Uruchomienie",
      "pp.limits":"Czego jeszcze brakuje",
      "pp.qbit.tagline":"Mała usługa w Go, która łączy się z lokalnym Web UI qBittorrenta i udostępnia kilka prostych endpointów HTTP do dodawania torrentów i sprawdzania informacji o nich.",
      "pp.qbit.why":"Chciałem pobierać dane z API klienta qBittorrent dla <a href=\"https://github.com/Git-Dominik/NyaasiAuto\" target=\"_blank\" rel=\"noopener\">NyaasiAuto</a>, małego i lekkiego programu. Ale biblioteki, które to już robią, są pełne funkcji, których nie potrzebuję.",
      "pp.qbit.why2":"Ustalenie, czego <em>nie</em> potrzebuję, wydało mi się większą robotą niż napisanie tych pięciu funkcji. Więc dwa endpointy i nic więcej.",
      "pp.qbit.does1":"Loguje się do qBittorrenta pod <code>http://localhost:8080</code>",
      "pp.qbit.does2":"Dodaje torrenty przez link magnet",
      "pp.qbit.does3":"Udostępnia informacje o torrentach przez lokalne API",
      "pp.qbit.does4":"Uruchamia lekki serwer HTTP na porcie <code>8081</code>",
      "pp.qbit.addTitle":"POST /add-torrent","pp.qbit.addBody":"Dodaje torrent na podstawie linku magnet.",
      "pp.qbit.infoTitle":"GET /info","pp.qbit.infoBody":"Zwraca bieżącą listę torrentów z qBittorrenta jako JSON.",
      "pp.qbit.envTitle":"Zmienne środowiskowe","pp.qbit.envBody":"Utwórz plik <code>.env</code> w katalogu głównym projektu z:",
      "pp.qbit.envBody2":"Aplikacja wczytuje te zmienne przez <code>godotenv</code>.",
      "pp.qbit.require1":"Zainstalowany Go",
      "pp.qbit.require2":"Web UI qBittorrenta działające lokalnie pod <code>http://localhost:8080</code>",
      "pp.qbit.require3":"Poprawna nazwa użytkownika i hasło do qBittorrenta",
      "pp.qbit.runBody":"Usługa uruchomi się pod <code>http://localhost:8081</code>.",

      "pp.nyaasi.tagline":"Mały projekt w Go, który śledzi nowe odcinki anime na nyaa.si i automatycznie wysyła nowe torrenty do qBittorrenta.",
      "pp.nyaasi.why":"Sprawdzanie nyaa.si co kilka godzin, żeby zobaczyć, czy coś nowego się pojawiło, weszło mi w nawyk. Więc: skrypt, który robi to za mnie. Patrzy na anime, które śledzę, a gdy tylko pojawi się nowy odcinek, od razu wysyłam go do qBittorrenta.",
      "pp.nyaasi.why2":"To osobisty skrypt do automatycznego śledzenia nowych odcinków anime, bez samodzielnego sprawdzania nyaa.si co kilka godzin.",
      "pp.nyaasi.does1":"Wczytuje listę anime z pliku <code>config.json</code>",
      "pp.nyaasi.does2":"Sprawdza kanały RSS nyaa.si pod kątem nowych odcinków",
      "pp.nyaasi.does3":"Dopasowuje skonfigurowanych uploaders",
      "pp.nyaasi.does4":"Wysyła nowe linki magnet do lokalnego mostu qBittorrenta",
      "pp.nyaasi.does5":"Zapamiętuje ostatnio obejrzanego odcinka, żeby nie dodawać starych w kółko",
      "pp.nyaasi.partsTitle":"Główne części",
      "pp.nyaasi.parts1":"<code>cmd/qbit-service</code> — lokalny most do qBittorrenta",
      "pp.nyaasi.parts2":"<code>cmd/rss-scraper</code> — sprawdza nowe odcinki i wysyła torrenty",
      "pp.nyaasi.partsBody":"Most to <a href=\"qbit-service.html\" data-i18n=\"pp.nyaasi.qbitLink\">qbit-service</a>, który leży też w repozytorium jako osobny projekt.",
      "pp.nyaasi.qbitLink":"qbit-service",
      "pp.nyaasi.feedTitle":"Znajdowanie kanału",
      "pp.nyaasi.feedBody":"Dla każdego tytułu anime i każdego uploadera budowany jest osobny kanał RSS. Dwukropek znika najpierw z tytułu, bo psułby zapytanie.",
      "pp.nyaasi.feedBody2":"Sezon i numer odcinka są wyciągane z tytułu każdej pozycji. Regex akceptuje trzy zapisy, a sezon jest opcjonalny:",
      "pp.nyaasi.matchTitle":"Rozpoznawanie nowego odcinka",
      "pp.nyaasi.matchBody":"Nie szuka najnowszego odcinka, tylko dokładnie następny: sezon i numer z <code>config.json</code>, plus jeden. Do mostu coś idzie tylko przy dokładnym dopasowaniu.",
      "pp.nyaasi.matchBody2":"Cała lista jest potem zapisywana z powrotem do <code>config.json</code>, żeby postęp przetrwał kolejną rundę:",
      "pp.nyaasi.require1":"Zainstalowany Go",
      "pp.nyaasi.require2":"Web UI qBittorrenta działające lokalnie",
      "pp.nyaasi.envTitle":"Plik <code>.env</code> w <code>cmd/qbit-service</code>:",
      "pp.nyaasi.configTitle":"Plik <code>config.json</code> w katalogu głównym projektu z listą anime:",
      "pp.nyaasi.configBody":"Możesz dodać tyle tytułów anime, ile chcesz.",
      "pp.nyaasi.runBridge":"Najpierw uruchom most do qBittorrenta:",
      "pp.nyaasi.runScraper":"A potem scraper:",
      "pp.nyaasi.limit1":"<strong>Wygrywa pierwszy pasujący uploader.</strong> Uploaderzy są sprawdzani po kolei i gdy coś się znajdzie, pętla się zatrzymuje. Reszta listy w tej rundzie nie jest sprawdzana.",
      "pp.nyaasi.limit2":"<strong>Regex nie łapie wielu zapisów.</strong> Rozpoznaje <code>S01E02</code>, <code>Episode 05</code> i <code>- 12</code>, ale nie samo <code>12</code> ani <code>1x12</code>. Bez sezonu w tytule przyjmuje sezon 1.",

      "pp.bakker.tagline":"Czatbot AI dla studentów cukiernictwa w Talland College. Pytania o receptury, techniki, teorię i zadania szkolne.",
      "pp.bakker.why":"W szkole cukierniczej jest dużo teorii i prac praktycznych na papierze. Receptura znaleziona gdzieś w sieci to dobry początek, ale wykonanie jej w odpowiedniej kolejności to już inna historia. Więc: chatbot, który potrafi odszukać prawdziwe receptury i materiał do lekcji z Talland.",
      "pp.bakker.why2":"Mały projekt, który ma pomóc studentom cukiernictwa uczyć się i łatwiej zadawać pytania.",
      "pp.bakker.does1":"Logowanie i rejestracja użytkowników",
      "pp.bakker.does2":"Czat AI na pytania związane z cukiernictwem",
      "pp.bakker.does3":"Zapisuje historię rozmów",
      "pp.bakker.does4":"Panel admina do podglądania użytkowników i rozmów",
      "pp.bakker.toolsTitle":"Narzędzia",
      "pp.bakker.toolsBody":"Chatbot dostaje sześć narzędzi, a prompt systemowy wprost mówi, że ma zawsze pracować przez <em>te</em> narzędzia i nigdy z własnej wiedzy. Żadna receptura ani materiał lekcji nie siedzi w tym projekcie; jest pobierany ze svhbakkerstalent.nl.",
      "pp.bakker.tool1":"<code>getRecipesCategoriesTool</code> — wszystkie kategorie receptur dla danego tematu",
      "pp.bakker.tool2":"<code>getRecipesTool</code> — slugi wszystkich receptur w tej kategorii",
      "pp.bakker.tool3":"<code>getRecipeTool</code> — jedna receptura, na podstawie tego sluga",
      "pp.bakker.tool4":"<code>getLessonTopicsTool</code> — tematy pierwszego roku",
      "pp.bakker.tool5":"<code>getLessonItemsTool</code> — lekcje w obrębie tematu",
      "pp.bakker.tool6":"<code>getLessonPageTool</code> — treść jednej strony lekcji",
      "pp.bakker.toolsBody2":"Każde narzędzie to osobna funkcja z Playwright: zaloguj się, ustaw właściwe filtry, wczytaj wyniki z DOM.Trasa, którą podąża AI, jest zapisana w prompcie — wraz z tym, że ma dalej paginować, dopóki są jakieś strony.",
      "pp.bakker.scrapeTitle":"Czytanie strony",
      "pp.bakker.scrapeBody":"Nie da się po prostu pobrać JSON-a ze svhbakkerstalent.nl, więc otwierany jest headless Firefox. Najpierw logowanie, potem zapis sesji, żeby kolejne wywołanie narzędzia użyło istniejącego cookies zamiast logować się od nowa.",
      "pp.bakker.scrapeBody2":"A potem jedno z narzędzi, które przechodzi po liście receptur i bierze slug z linku, a nie z widocznej nazwy:",
      "pp.bakker.streamTitle":"Odpowiedzi przychodzą strumieniem",
      "pp.bakker.streamBody":"Receptura potrzebuje chwili na odpowiedź, więc model streamuje. Fragmenty lecą do przeglądarki pojedynczo jako JSON rozdzielany nowymi liniami, a jeśli student zamknie kartę w trakcie, strumień też musi się zatrzymać. Przechodzi to przez <code>AbortSignal</code> samego requestu.",
      "pp.bakker.dataTitle":"Użytkownicy i rozmowy",
      "pp.bakker.dataBody":"Trzy tabele i nic więcej. Hasła przechodzą przez <code>argon2</code>, en daarna JWT trafia do httpOnly cookie na siedem dni.",
      "pp.bakker.dataBody2":"Tytuł rozmowy pojawia się dopiero później — przy pierwszej odpowiedzi:",
      "pp.bakker.runBody":"Aplikacja działa pod <code>http://localhost:3000</code>.",

      "contact.heading":"Pogadajmy","contact.body":"Masz jakiś projekt w głowie albo chcesz się po prostu przywitać? Napisz.",
      "contact.copy":"Kopiuj e-mail",
      "footer.text":"© 2026 Dominik. Zbudowane z dbałością.","footer.top":"Do góry"
    }
  };

  var COPIED = { nl:'Gekopieerd!', en:'Copied!', pl:'Skopiowano!' };
  var els = PF.$$('[data-i18n]');
  var richEls = PF.$$('[data-i18n-html]');
  var attrEls = PF.$$('[data-i18n-aria-label]');

  // Stash each element's own Dutch copy so a language without a dictionary can restore it.
  els.forEach(function(el){ el.setAttribute('data-i18n-src', el.textContent); });
  richEls.forEach(function(el){ el.setAttribute('data-i18n-src', el.innerHTML); });
  attrEls.forEach(function(el){ el.setAttribute('data-i18n-src-aria-label', el.getAttribute('aria-label')); });

  function applyLang(lang){
    var dict = T[lang];
    document.documentElement.setAttribute('lang', lang);
    els.forEach(function(el){
      var key = el.getAttribute('data-i18n');
      var v = dict && dict[key];
      el.textContent = (v === undefined) ? el.getAttribute('data-i18n-src') : v;
    });
    richEls.forEach(function(el){
      var key = el.getAttribute('data-i18n-html');
      var v = dict && dict[key];
      el.innerHTML = (v === undefined) ? el.getAttribute('data-i18n-src') : v;
    });
    attrEls.forEach(function(el){
      var v = dict && dict[el.getAttribute('data-i18n-aria-label')];
      el.setAttribute('aria-label', (v === undefined) ? el.getAttribute('data-i18n-src-aria-label') : v);
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