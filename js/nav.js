(function(PF){
  "use strict";
  var $$ = PF.$$;

  /* ---- Mobile nav ---- */
  (function(){
    var t = document.querySelector('.nav-toggle'), panel = document.getElementById('nav-links-panel');
    if(!t || !panel) return;
    function open(){ document.body.classList.add('nav-open'); t.setAttribute('aria-expanded','true'); }
    function close(){ document.body.classList.remove('nav-open'); t.setAttribute('aria-expanded','false'); }
    t.addEventListener('click', function(){ document.body.classList.contains('nav-open') ? close() : open(); });
    $$('.nav-links a').forEach(function(a){ a.addEventListener('click', close); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
    // A tap outside the panel dismisses it, the way every native menu behaves.
    document.addEventListener('click', function(e){
      if(!document.body.classList.contains('nav-open')) return;
      if(e.target.closest('.site-nav')) return;
      close();
    });
    // Growing past the breakpoint must not leave an invisible panel locking the page.
    window.matchMedia('(min-width:981px)').addEventListener('change', function(e){ if(e.matches) close(); });
  })();

  /* ---- Light up the nav link of the section in view ---- */
  (function(){
    var links = $$('.nav-links a'), secs = $$('main section[id]');
    if(!('IntersectionObserver' in window)) return;
    var cur = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        links.forEach(function(a){
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('active', on);
          if(on) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    secs.forEach(function(s){ cur.observe(s); });
  })();

  /* ---- Scroll progress bar ---- */
  (function(){
    var bar = document.querySelector('.progress'), t = false; if(!bar) return;
    function u(){ t = false; var m = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (m > 0 ? (window.scrollY / m).toFixed(4) : 0) + ')'; }
    window.addEventListener('scroll', function(){ if(!t){ t = true; requestAnimationFrame(u); } }, { passive: true });
    window.addEventListener('resize', u, { passive: true });
    u();
  })();
})(window.PF);
