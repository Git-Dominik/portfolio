/* The chapter rail on the project pages (projects/*.html).
   ---------------------------------------------------------------
   A fixed list of the page's own sections down the left side, marking which one you are in and
   jumping to it on click.

   It is built from the headings rather than written into the markup, so it stays correct on
   every project page without being restated three times: a section that gets an <h2> shows up
   here on its own, and one without a heading is skipped instead of becoming an empty row. The
   sections already carry ids, so the links are real anchors - with JS off they are still listed
   nowhere, but the page reads from the top and every heading is reachable by scrolling, which is
   the same bargain the rest of the page makes.

   No GSAP here, deliberately. The reference implementation this is based on takes a GSAP path
   when it finds window.gsap and a native path otherwise; this site loads no animation library
   at all, so that branch would never run and the scroll tracking would have to exist anyway.
   The native half is what is written, and the rail animates through CSS transitions like
   everything else on the site. */
(function(PF){
  "use strict";
  var $$ = PF.$$, $ = PF.$;

  var nav = $('.pp-chapters');
  var sections = $$('main .pp-section');
  if(!nav || !sections.length) return;

  var links = [], targets = [];

  sections.forEach(function(section, i){
    var heading = section.querySelector('.pp-h2, h2');
    // No heading means no chapter. The index is skipped rather than left as a gap in the
    // numbering, so the rail always reads 01..0n with nothing missing.
    if(!heading) return;

    var link = document.createElement('a');
    link.href = '#' + section.id;

    var num = document.createElement('span');
    num.className = 'pp-ch-num';
    num.textContent = ('0' + (links.length + 1)).slice(-2);
    /* The label is filled in by syncLabels() rather than here, so a language switch can put the
       translated heading text back without rebuilding the whole rail. */
    var label = document.createElement('span');
    label.className = 'pp-ch-label';

    link.appendChild(num);
    link.appendChild(label);
    nav.appendChild(link);

    links.push(link);
    targets.push({ section: section, heading: heading, label: label });
  });

  if(!links.length) return;

  /* The project name above the list. It is already in the masthead, which is why the rail hides
     itself while that masthead is still on screen - the same name would be on screen twice. */
  var title = document.querySelector('.pp-title');
  if(title){
    var name = document.createElement('div');
    name.className = 'pp-ch-title';
    name.textContent = title.textContent.trim();
    nav.insertBefore(name, nav.firstChild);
  }

  function syncLabels(){
    targets.forEach(function(t){ t.label.textContent = t.heading.textContent.trim(); });
  }
  syncLabels();

  var current = -1;
  function setCurrent(index){
    if(index === current || index < 0 || index >= links.length) return;
    current = index;
    links.forEach(function(link, i){
      link.classList.toggle('is-current', i === index);
      link.classList.toggle('is-past', i < index);
      if(i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  /* One line across the viewport decides which section you are in: the last one whose top has
     passed it. A threshold near the top rather than the middle, because the sections here are
     very uneven - the tools section on a project page is several screens tall, and a mid-screen
     line would leave the chapter behind it marked as current for most of that. rAF-throttled
     from the scroll event, the same way js/nav.js runs the progress bar. */
  var ticking = false;
  function update(){
    ticking = false;
    var line = window.innerHeight * 0.3;
    var index = 0;
    for(var i = 0; i < targets.length; i++){
      if(targets[i].section.getBoundingClientRect().top <= line) index = i;
    }
    setCurrent(index);
  }
  function requestUpdate(){
    if(ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  /* Hidden for as long as the masthead is on screen, since it already names the project and
     the sections have not started yet. The masthead's bottom edge rather than the scroll
     position, so it does not depend on how tall the masthead's copy happens to measure. */
  var head = document.querySelector('.pp-head');
  var visible = null;
  function updateVisibility(){
    var show = !head || head.getBoundingClientRect().bottom <= window.innerHeight * 0.35;
    if(show === visible) return;
    visible = show;
    nav.classList.toggle('is-at-top', !show);
  }
  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('resize', updateVisibility);
  updateVisibility();

  /* Clicking needs no handler. The links are real anchors to ids that already exist, and
     scroll-padding-top on <html> plus reduced-motion.css's scroll-behavior:auto already decide
     where the jump lands and whether it is smooth. */

  /* The labels are the headings, and the headings are translated underneath us. Without this the
     rail would keep the language it was built in until the next reload. */
  $$('.lang-switch button').forEach(function(b){
    b.addEventListener('click', function(){ setTimeout(syncLabels, 0); });
  });
})(window.PF);