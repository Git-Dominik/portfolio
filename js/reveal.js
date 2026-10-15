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

    /* The marquee band is deliberately NOT in this list. It sits directly under a
       full-viewport hero, so it starts life below the fold with the sweep mask at 0% -
       which paints the whole strip as nothing. On a tall hero that reads as a blank band
       rather than as content that has not arrived yet. It is decoration, not content, and
       a missing strip is worse than an un-revealed one. */
    /* [selector, mode, stagger between siblings (s), start delay (s)]

       Anything that answers the pointer is NOT in this list. The reveal writes transform
       on the element itself - translate3d(0,var(--ry),0) scale(var(--rs,1)) - so any
       element whose hover also drives transform is animating the same property from two
       directions, and the pointer loses for as long as the reveal is armed. Four entries
       were dropped for this:

         .skill-tile      pop scaled the tile; :hover lifted it by -3px. Same property.
         .project-card    ui.js drives transform for the pointer tilt. It was already
                          guarded with `if(c.hasAttribute('data-r')) return`, so nothing
                          broke - but the tilt stayed dead for the length of the reveal,
                          which is the same complaint in slower form.
         .contact-links   hover only swaps border and colour, no transform. Dropped for
                          consistency: it sits beside .mail-row, which stays.
         .wordmark        hover fades a CHILD (.fill), so it never actually conflicted.
                          Dropped for the same consistency reason as .contact-links.

       Re-adding one means re-checking whether its hover writes transform to the element
       itself rather than to a descendant - hover on a child is safe, hover on the
       revealed node is not. .proj-row is still here: it is click-to-open, not hovered. */
    [
      ['.eyebrow-heading', 'sweep'],
      ['.divider', 'line'],
      ['.lead,.lang-spoken,.quick-facts', 'sweep', .12, .1],
      ['.skill-panel', 'sweep', .1],
      ['.exp-body', 'sweep'],
      ['.proj-more>.label', 'sweep'],
      ['.proj-row', 'sweep', .1, .05],
      ['.contact-grid>div>p,.mail-row', 'sweep', .1],
      ['.foot-row', 'sweep', .15]
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

    /* Trigger early: the bottom margin is positive, which expands the observer's root box
       downward, so an element starts revealing while it is still below the fold instead of
       after its top edge has crossed it. A negative margin did the opposite and held the
       reveal back by 6% of the viewport height. Doubled from the first pass: 16% of the
       viewport as lead time, and a threshold low enough that a tall panel no longer has to
       be a sixth of the way on screen before anything happens. */
    var onEnter = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting) play(e.target); });
    }, { threshold: .03, rootMargin: '0px 0px 16% 0px' });

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