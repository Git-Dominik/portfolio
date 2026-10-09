(function(PF){
  "use strict";
  var reduce = PF.reduce, $$ = PF.$$;

  /* ---- Timeline: the line draws as you scroll past a reading line ~82% down the viewport ---- */
  (function(){
    var tl = document.getElementById('timeline'); if(!tl) return;
    var line = tl.querySelector('.tl-line');
    var items = $$('.tl-item', tl), dots = items.map(function(i){ return i.querySelector('.tl-dot'); });
    var centers = [], start = 0, end = 0, ticking = false;

    function measure(){
      var top = tl.getBoundingClientRect().top;
      centers = dots.map(function(d){ var r = d.getBoundingClientRect(); return r.top + r.height / 2 - top; });
      start = centers[0]; end = centers[centers.length - 1];
      line.style.top = start + 'px'; line.style.bottom = 'auto'; line.style.height = Math.max(0, end - start) + 'px';
    }
    function update(){
      ticking = false;
      var tip = window.innerHeight * .82 - tl.getBoundingClientRect().top, span = end - start;
      var p = span > 0 ? Math.min(1, Math.max(0, (tip - start) / span)) : 1;
      tl.style.setProperty('--tl-progress', p.toFixed(4));
      tl.classList.toggle('is-complete', p >= .999);
      items.forEach(function(it, i){ it.classList.toggle('is-active', centers[i] <= tip + .5); });
    }
    function schedule(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }

    measure();
    if('ResizeObserver' in window) new ResizeObserver(function(){ measure(); schedule(); }).observe(tl);
    window.addEventListener('resize', function(){ measure(); schedule(); });
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ measure(); schedule(); });

    if(reduce){
      tl.style.setProperty('--tl-progress', '1'); tl.classList.add('is-complete');
      items.forEach(function(it){ it.classList.add('is-active'); });
      return;
    }
    tl.classList.add('is-enhanced');
    window.addEventListener('scroll', schedule, {passive:true});
    update();
  })();
})(window.PF);
