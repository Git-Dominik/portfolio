(function(PF){
  "use strict";
  var reduce = PF.reduce, $$ = PF.$$;

  /* ---- Experience track ----------------------------------------------------
     The dot follows a reading line parked at 82% down the viewport, and each entry's
     segment fills as that line crosses it.

     Two values do all the work, and both are needed:

       --y0 / --y1  the dot's start and end, in px from the block's top padding edge
       --p          the global 0..1 reading position, from which the dot's top is derived

     Every entry also gets its OWN --p, running 0..1 across the stretch between its node
     line and the next entry's. A single global value cannot express that, and that is the
     whole difference between one continuous fill and per-entry segments: the previous
     version had one track and one number, so splitting the track into segments is what
     forces the second value. */

  (function(){
    var host = document.getElementById('exp'); if(!host) return;
    var entries = $$('.exp-entry', host);
    if(!entries.length) return;

    var nodes = [], y0 = 0, y1 = 0, ticking = false;

    function clamp(n){ return n < 0 ? 0 : n > 1 ? 1 : n; }

    function measure(){
      var origin = host.getBoundingClientRect();
      /* Half the dot, read from CSS so the segment geometry and the measurement can never
         disagree about where the node line is. */
      var half = (parseFloat(getComputedStyle(host).getPropertyValue('--node')) || 13) / 2;
      nodes = entries.map(function(el){
        return el.getBoundingClientRect().top - origin.top + half;
      });
      y0 = nodes[0]; y1 = nodes[nodes.length - 1];
      host.style.setProperty('--y0', y0.toFixed(2));
      host.style.setProperty('--y1', y1.toFixed(2));
    }

    function update(){
      ticking = false;
      var tip = window.innerHeight * .82 - host.getBoundingClientRect().top;
      var span = y1 - y0;
      var p = span > 0 ? clamp((tip - y0) / span) : (tip >= y1 ? 1 : 0);

      host.style.setProperty('--p', p.toFixed(4));
      /* data-state only drives the body de-emphasis. The dot is permanent and does not
         hide at either end. */
      host.setAttribute('data-state', p <= 0 ? 'before' : p >= 1 ? 'after' : 'live');

      entries.forEach(function(el, i){
        var from = nodes[i];
        var to = i + 1 < nodes.length ? nodes[i + 1] : null;
        /* The last entry draws no segment, so it only needs to know it has been reached. */
        var local = to === null ? (tip >= from ? 1 : 0) : clamp((tip - from) / (to - from));
        el.style.setProperty('--p', local.toFixed(4));
        el.classList.toggle('is-passed', tip >= from);
      });
    }
    function schedule(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }

    measure();
    if('ResizeObserver' in window) new ResizeObserver(function(){ measure(); schedule(); }).observe(host);
    window.addEventListener('resize', function(){ measure(); schedule(); });
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ measure(); schedule(); });

    if(reduce){
      /* No scroll coupling: show the finished state and stop. */
      host.style.setProperty('--p', '1');
      host.setAttribute('data-state', 'after');
      entries.forEach(function(el){ el.style.setProperty('--p', '1'); el.classList.add('is-passed'); });
      return;
    }
    window.addEventListener('scroll', schedule, {passive:true});
    update();
  })();
})(window.PF);