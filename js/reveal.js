(function(PF){
  "use strict";
  var reduce = PF.reduce, $$ = PF.$$, $ = PF.$;

  /* ---- Sections: draw their background curves once on arrival ---- */
  (function(){
    var secs = $$('main section[id]');
    if(!('IntersectionObserver' in window)){ secs.forEach(function(s){ s.classList.add('in-view'); }); return; }
    var seen = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in-view'); seen.unobserve(e.target); } });
    }, { threshold: .12 });
    secs.forEach(function(s){ seen.observe(s); });
  })();

  /* ---- Park the decorative loops once they scroll away ---- */
  (function(){
    if(!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ e.target.classList.toggle('away', !e.isIntersecting); });
    }, { threshold: 0 });
    ['.hero', '.band-wrap'].forEach(function(sel){ var el = $(sel); if(el) io.observe(el); });
  })();

  /* ---- Load-in: hero intro, then calm scroll reveals ----
     Replaces the pixel blocks. Each element plays once (no re-covering when it leaves view).
     Modes (see CSS): sweep = soft light sweep, pop = chips, line = dividers draw across. ---- */
  (function(){
    var root = document.documentElement;
    function start(){ root.classList.add('go'); }
    if(reduce || !('IntersectionObserver' in window)){ start(); return; }

    // The hero intro waits for the fonts so the name never flashes in a fallback face
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([ready, new Promise(function(r){ setTimeout(r, 900); })]).then(function(){ requestAnimationFrame(start); });

    // The reveal mode has to outlive data-r being stripped, or re-arming has nothing to
    // restore. Kept beside the element rather than on it.
    var modes = new WeakMap();

    // [selector, mode, stagger between siblings (s), start delay (s)]
    [
      ['.eyebrow-heading', 'sweep'],
      ['.band-wrap', 'sweep'],
      ['.divider', 'line'],
      ['.lead,.lang-spoken,.quick-facts', 'sweep', .12, .1],
      ['.skill-panel', 'sweep', .1],
      ['.skill-tile', 'pop', .05, .25],
      ['.tl-content', 'sweep'],
      ['.project-card', 'sweep', 0, .1],
      ['.proj-more>.label', 'sweep'],
      ['.proj-row', 'sweep', .1, .05],
      ['.contact-grid>div>p,.mail-row,.contact-links', 'sweep', .1],
      ['.wordmark,.foot-row', 'sweep', .15]
    ].forEach(function(s){
      var last = null, n = 0;
      $$(s[0]).forEach(function(el){
        if(el.parentNode !== last){ last = el.parentNode; n = 0; }
        el.setAttribute('data-r', s[1]);
        modes.set(el, s[1]);
        el.style.setProperty('--d', ((s[3] || 0) + n++ * (s[2] || 0)).toFixed(2) + 's');
      });
    });

    var pending = new WeakMap();

    /* Play the reveal, then hand the element back to its normal styles - the reveal's
       own transform/opacity would otherwise out-rank :hover and the tile lift, the card
       tilt and the accordion. */
    function play(el){
      if(!modes.has(el)) return;
      el.setAttribute('data-r', modes.get(el));
      if(el.classList.contains('is-in')) return;
      el.classList.add('is-in');
      clearTimeout(pending.get(el));
      var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
      pending.set(el, setTimeout(function(){
        if(!el.classList.contains('is-in')) return;  // re-armed while this was pending
        el.removeAttribute('data-r');
        el.classList.remove('is-in');
      }, (d + 2) * 1000));
    }

    /* Re-arm once the element is completely out of view. That's what makes the reveal
       replay on the way back down instead of only ever firing on the first pass. */
    function disarm(el){
      if(!modes.has(el)) return;
      clearTimeout(pending.get(el));
      el.setAttribute('data-r', modes.get(el));
      el.classList.remove('is-in');
    }

    var onEnter = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting) play(e.target); });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

    // No margin and no threshold: re-arm only on a full exit, never while the element
    // is still partly on screen and would visibly snap to invisible.
    var onExit = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(!e.isIntersecting) disarm(e.target); });
    }, { threshold: 0 });

    $$('[data-r]').forEach(function(el){ onEnter.observe(el); onExit.observe(el); });

    /* Safety net. An element at the very end of the document can never cross the
       observer's bottom margin, because there is nothing left to scroll - so it would
       stay at opacity 0 forever. Once scrolling settles, play anything on screen. */
    var quiet;
    function sweep(){
      $$('[data-r]').forEach(function(el){
        if(el.getBoundingClientRect().top < window.innerHeight) play(el);
      });
    }
    window.addEventListener('scroll', function(){ clearTimeout(quiet); quiet = setTimeout(sweep, 180); }, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });
    setTimeout(sweep, 600);
  })();

  /* ---- Band: repeat the words until the marquee always fills the screen ---- */
  (function(){
    var tr = document.querySelector('.band-track'); if(!tr) return;
    var base = [].slice.call(tr.children), n = 0;
    while((tr.scrollWidth < window.innerWidth * 1.3 || tr.children.length % 2) && n++ < 40)
      base.forEach(function(s){ tr.appendChild(s.cloneNode(true)); });
    [].slice.call(tr.children).forEach(function(c){ tr.appendChild(c.cloneNode(true)); });
  })();
})(window.PF);
