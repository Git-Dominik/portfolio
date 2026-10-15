(function(PF){
  "use strict";
  var reduce = PF.reduce, $$ = PF.$$;

  /* ---- Hero greeting: Hello / Cześć / Hoi ----
     Only runs while the hero is actually on screen, and not while the tab is hidden.
     A setInterval that repaints text nobody can see is pure battery cost. ---- */
  (function(){
    var el = document.getElementById('greeting');
    if(!el) return;
    var hero = document.querySelector('.hero');
    /* Face, weight, style and size all live in CSS. Inline styles here would win over those
       rules, so the greetings differ only in wording and colour.
       The three colours are read from CSS, not repeated here: the hero wave is painted from
       the same three, and a second copy of these hexes is a second thing to forget. */
    var PAL = ['--greet-1', '--greet-2', '--greet-3'].map(function(v){
      return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    });
    var G = [
      {t:'Hello', c:PAL[0]},
      {t:'Cześć', c:PAL[1]},
      {t:'Hoi',   c:PAL[2]}
    ], i = 0, timer = null;
    function paint(){ var g = G[i]; el.textContent = g.t; el.style.color = g.c; }
    function swap(){
      i = (i + 1) % G.length;
      if(reduce){ paint(); return; }
      el.classList.add('swap');
      setTimeout(function(){ paint(); el.classList.remove('swap'); }, 350);
    }
    function start(){ if(!timer) timer = setInterval(swap, 2600); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    paint();
    if(reduce) return;

    if('IntersectionObserver' in window && hero){
      new IntersectionObserver(function(es){ es[0].isIntersecting ? start() : stop(); }, { threshold: .25 }).observe(hero);
    } else start();
    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
  })();

  /* ---- Black -> white shift.
     Old version waited for scrolling to stop (scrollend), which felt like the page froze.
     Now it flips the moment the hero is about half off-screen, and the CSS eases the colours.
     Light theme only: dark mode has no second palette to shift to, so switching to dark has
     to take .transitioned back off, not merely stop adding it. ---- */
  (function(){
    var hero = document.querySelector('.hero');
    /* `want` is the scroll-derived intent; the class is that intent AND the light theme.
       Kept apart because the theme change has to re-derive the class from the intent - if it
       read the class back it would find the one it had just removed, and light would only
       return on the next scroll event. */
    var want = false;
    function apply(){ document.body.classList.toggle('transitioned', want && !PF.theme.isDark); }
    function set(on){ want = on; apply(); }
    if(!('IntersectionObserver' in window)){
      window.addEventListener('scroll', function(){ set(window.scrollY > hero.offsetHeight * .5); }, {passive:true});
    } else {
      var th = []; for(var k = 0; k <= 20; k++) th.push(k / 20);
      new IntersectionObserver(function(entries){
        set(entries[0].intersectionRatio < .5);
      }, { threshold: th }).observe(hero);
    }
    PF.theme.onChange(apply);
  })();
})(window.PF);
