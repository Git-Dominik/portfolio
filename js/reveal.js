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

  /* ---- Project pages: the background curves ----
     index.html's .section-lines are per-section and small enough that their viewBox is cut to
     roughly the size they are drawn at, so the browser's default scaling on them is close to
     1:1. .pp-bg is one layer as tall as the whole page, and a fixed viewBox stretched to fill
     it scales by ~3x vertically against ~1.6x horizontally. That is what forces everything
     below: stroke-width is multiplied by the transform, so a 1.4 line renders at 3px, and the
     obvious fix - vector-effect:non-scaling-stroke - breaks the animation. Non-scaling-stroke
     evaluates the dash pattern in screen space while pathLength="1" normalises it in user
     space, and once those two disagree the dash no longer tracks the path: instead of one
     line growing from its start it renders as the head of the line plus a detached stub
     somewhere further along.

     So neither: measure the layer and refit the viewBox to its exact pixel box, and rescale
     the path data to match. The shape on screen is unchanged - the same curves, stretched to
     the same places - but the mapping is now 1:1, so the stroke is 1.4px as written and the
     dash measures the real path length. fit() runs before the observer below starts the
     draw, so the corrected geometry is in place before a single curve is visible, and there
     is nothing to flash. */
  (function(){
    var bg = $('.pp-bg'); if(!bg) return;
    var svg = bg.querySelector('svg'); if(!svg) return;
    var paths = $$('path', svg);
    var AUTHORED_W = 800, AUTHORED_H = 1200;

    /* Every second number in these paths is a y. They are written with absolute M/C/S only -
       no relative commands and no H/V/A - which is what makes that safe; a curve written any
       other way would need a real path parser here, so it has to be unwritten first. */
    function scale(d, kx, ky){
      var i = 0;
      return d.replace(/-?\d*\.?\d+/g, function(n){
        var v = parseFloat(n);
        return (i++ % 2 ? (v * ky) : (v * kx)).toFixed(1);
      });
    }

    function fit(){
      var w = Math.round(svg.clientWidth), h = Math.round(svg.clientHeight);
      if(!w || !h) return;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var kx = w / AUTHORED_W, ky = h / AUTHORED_H;
      paths.forEach(function(p){ p.setAttribute('d', scale(p.getAttribute('data-d'), kx, ky)); });
    }
    fit();

    /* The layer grows with its copy and changes shape on resize, so refitting on either is
       not defensive - the first happens whenever a section's reveal is still settling and the
       second on every rotation. */
    if(window.ResizeObserver) new ResizeObserver(fit).observe(svg);
    window.addEventListener('resize', fit, { passive: true });

    /* .pp-bg sits outside <main>, so the `main section[id]` observer above never reaches it
       and the stroke-dash hand-off in css/project.css needs its own trigger. threshold:0,
       not the .12 up there: this layer is as tall as the whole page, and a box several
       viewports long never reaches 12% of ITSELF inside one viewport, so at .12 it would
       simply never fire on a long page. */
    if(!('IntersectionObserver' in window)){ bg.classList.add('in-view'); return; }
    var drawn = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in-view'); drawn.unobserve(e.target); } });
    }, { threshold: 0 });
    drawn.observe(bg);
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
      /* The project pages' masthead, then its content blocks - one selector each so the stagger
         runs across them in document order and reads as a page arriving rather than as a dozen
         separate things. Granularity is deliberately the BLOCK, not the paragraph and not the
         section: it is what index.html reveals too (.project-card, .skill-panel, .exp-body,
         .fact), and it is the only level that is safe under a mask.

         Masking a whole .pp-section was the earlier version here and it was wrong twice. A mask
         over a full-width band containing opaque .snippet blocks promotes the band to its own
         layer to animate the mask, and that layer is not filled - hence the black rectangle
         that flashed over a section as the sweep ran back out. Masking each block separately
         masks small things over each other, so there is no wide layer to show through. And the
         snippets themselves want to arrive with their section rather than being the one thing
         on the page that is already there.

         .quick-facts is NOT in this list: its children are .fact, which the entry above already
         reveals one panel at a time. Naming both would transform a parent and a child at once.
         That grid is gone from the project pages now - the masthead carries the stack instead -
         but the rule still guards against anyone adding one back. */
      ['.pp-back,.pp-title,.pp-tagline,.pp-stack,.pp-actions', 'sweep', .06],
      ['.pp-h2,.pp-h3,.pp-section>p,.pp-section .pp-list,.pp-section .snippet,.pp-next', 'sweep', .07],
      ['.divider', 'line'],
      ['.lead,.lang-spoken', 'sweep', .12, .1],
      /* The About facts, configured exactly like .skill-panel above - same mode, same .1
         stagger, no delay. The panels carry their own frost and their own sweep, which is
         the arrangement that already works on the skills board. */
      ['.fact', 'sweep', .1],
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