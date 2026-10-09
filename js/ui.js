(function(PF){
  "use strict";
  var reduce = PF.reduce, $$ = PF.$$;

  /* ---- Project card tilts toward the pointer ----
     The tilt eases toward the pointer instead of snapping to it. A decoration bound
     straight to mouse position reads as artificial; interpolated, it reads as weight.
     Only transform and opacity move, so it stays on the compositor. ---- */
  (function(){
    var c = document.querySelector('.project-card');
    if(!c || reduce || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function loop(){
      cx += (tx - cx) * .12; cy += (ty - cy) * .12;
      c.style.transform = 'perspective(900px) rotateY(' + cx.toFixed(2) + 'deg) rotateX(' + cy.toFixed(2) + 'deg)';
      if(Math.abs(tx - cx) > .01 || Math.abs(ty - cy) > .01) raf = requestAnimationFrame(loop);
      else raf = 0;
    }
    function kick(){ if(!raf) raf = requestAnimationFrame(loop); }
    c.addEventListener('mousemove', function(e){
      if(c.hasAttribute('data-r')) return; /* don't fight the entry reveal for the transform */
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tx = (x - .5) * 8; ty = (.5 - y) * 6;
      c.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      kick();
    }, { passive: true });
    c.addEventListener('mouseleave', function(){ tx = 0; ty = 0; kick(); });
  })();

  /* ---- Project list: one row open at a time ---- */
  (function(){
    var heads = $$('.proj-head');
    heads.forEach(function(h){
      h.addEventListener('click', function(){
        var row = h.parentNode, open = !row.classList.contains('is-open');
        heads.forEach(function(o){ o.parentNode.classList.remove('is-open'); o.setAttribute('aria-expanded', 'false'); });
        if(open){ row.classList.add('is-open'); h.setAttribute('aria-expanded', 'true'); }
      });
    });
  })();

  /* ---- Skill tiles: the spotlight follows the pointer ---- */
  (function(){
    var board = document.querySelector('.skill-board');
    if(!board || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    board.addEventListener('mousemove', function(e){
      var t = e.target.closest('.skill-tile'); if(!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, {passive:true});
  })();

  /* ---- Contact + footer extras ---- */
  (function(){
    var btn = document.querySelector('.copy'), mail = document.querySelector('.mail');
    if(btn && mail){
      // whatever language is active right now - restored when the confirmation fades
      var label = btn.textContent;
      btn.addEventListener('click', function(){
        var addr = mail.getAttribute('href').replace('mailto:', '');
        function done(){
          btn.textContent = PF.copied(); btn.classList.add('done');
          setTimeout(function(){ btn.textContent = label; btn.classList.remove('done'); }, 1600);
        }
        if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(done, function(){ window.location.href = 'mailto:' + addr; });
        else window.location.href = 'mailto:' + addr;
      });
    }
    var wm = document.getElementById('wordmark');
    if(wm) wm.addEventListener('mousemove', function(e){
      var r = wm.getBoundingClientRect();
      wm.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      wm.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
    var up = document.getElementById('toTop');
    if(up) up.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  })();

  /* ---- Degrade gracefully when an image is missing ----
     A 404 can land before this deferred script runs, so `complete && !naturalWidth`
     catches images that already failed instead of waiting for an event that never comes.
     The portrait falls back to a monogram. */
  function guard(img, onFail){
    if(img.complete && !img.naturalWidth){ onFail(); return; }
    img.addEventListener('error', onFail);
  }
  $$('.hero-pfp img').forEach(function(img){
    guard(img, function(){ var w = img.closest('.hero-pfp'); if(w) w.classList.add('is-missing'); });
  });
})(window.PF);
