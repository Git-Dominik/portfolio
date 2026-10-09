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
    var G = [
      {t:'Hello', c:'#8E99FF', f:"'Bricolage Grotesque',sans-serif", s:'normal', w:'800'},
      {t:'Cześć', c:'#FF7FA8', f:"'Fraunces',serif", s:'italic', w:'500'},
      {t:'Hoi',   c:'#3FDDD1', f:"'Space Mono',monospace", s:'normal', w:'700'}
    ], i = 0, timer = null;
    function paint(){ var g = G[i]; el.textContent = g.t; el.style.color = g.c; el.style.fontFamily = g.f; el.style.fontStyle = g.s; el.style.fontWeight = g.w; }
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
     Now it flips the moment the hero is about half off-screen, and the CSS eases the colours. ---- */
  (function(){
    var hero = document.querySelector('.hero');
    if(!('IntersectionObserver' in window)){ window.addEventListener('scroll', function(){ document.body.classList.toggle('transitioned', window.scrollY > hero.offsetHeight * .5); }, {passive:true}); return; }
    var th = []; for(var k = 0; k <= 20; k++) th.push(k / 20);
    new IntersectionObserver(function(entries){
      document.body.classList.toggle('transitioned', entries[0].intersectionRatio < .5);
    }, { threshold: th }).observe(hero);
  })();

  /* ---- Blob leans gently toward the pointer ---- */
  (function(){
    var field = document.getElementById('blobField');
    if(reduce || !field || !window.matchMedia('(hover:hover)').matches) return;
    var hero = document.querySelector('.hero');
    hero.addEventListener('mousemove', function(e){
      var x = (e.clientX / window.innerWidth - .5) * 2, y = (e.clientY / window.innerHeight - .5) * 2;
      field.style.setProperty('--px', (x * -28).toFixed(1) + 'px');
      field.style.setProperty('--py', (y * -22).toFixed(1) + 'px');
    }, {passive:true});
  })();

  /* ---- 3D object: a metallic torus knot lit in the page's indigo / pink / teal ---- */
  (function(){
    var canvas = document.getElementById('gl'), hero = document.querySelector('.hero');
    if(!canvas) return;
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onerror = function(){ canvas.style.display = 'none'; };
    s.onload = function(){
      var THREE = window.THREE, renderer;
      try{ renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }); }
      catch(e){ canvas.style.display = 'none'; return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, .1, 50);
      cam.position.z = 8;
      var group = new THREE.Group(); scene.add(group);
      var geo = new THREE.TorusKnotGeometry(1.15, .38, 240, 36, 2, 3);
      group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x6f7cff, metalness: .55, roughness: .22 })));
      var shell = new THREE.Mesh(new THREE.TorusKnotGeometry(1.15, .46, 90, 14, 2, 3), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .09 }));
      group.add(shell);
      scene.add(new THREE.AmbientLight(0x303060, 1.1));
      [[0x7c89ff, 2.4, 3, 3, 3], [0xff7fa8, 2.2, -3.5, -1, 2], [0x3fddd1, 1.8, 0, -3.5, -2]].forEach(function(l){
        var p = new THREE.PointLight(l[0], l[1], 20); p.position.set(l[2], l[3], l[4]); scene.add(p);
      });

      function size(){ var w = canvas.clientWidth || 400; renderer.setSize(w, w, false); }
      size(); window.addEventListener('resize', size);

      var mx = 0, my = 0, tx = 0, ty = 0, visible = true, raf = 0;
      if(window.matchMedia('(hover:hover)').matches) hero.addEventListener('mousemove', function(e){
        mx = (e.clientX / window.innerWidth - .5) * 2; my = (e.clientY / window.innerHeight - .5) * 2;
      }, { passive: true });
      /* Stop the loop outright while the hero is off screen. The old version re-scheduled
         requestAnimationFrame before its visibility check, so it kept a 60fps loop running
         for the entire time the visitor was reading the rest of the page. */
      function start(){ if(!raf && visible) raf = requestAnimationFrame(frame); }
      function stop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } }
      if('IntersectionObserver' in window) new IntersectionObserver(function(es){
        visible = es[0].isIntersecting;
        if(visible) start(); else stop();
      }).observe(hero);

      function frame(){
        raf = 0;
        if(!visible) return;
        var sc = Math.min(1, window.scrollY / window.innerHeight);
        /* Parallax stays well inside the frame: the knot is ~1.6 units wide, so anything
           past ~0.5 units of travel plus perspective would push a lobe off the canvas edge. */
        tx += (mx * .42 - tx) * .06; ty += (my * .36 - ty) * .06;
        group.rotation.x += .0045; group.rotation.y += .007;
        group.rotation.z = sc * 1.2;
        group.position.x = tx; group.position.y = -ty;
        group.scale.setScalar(1 - sc * .3);
        shell.rotation.y -= .004;
        renderer.render(scene, cam);
        raf = requestAnimationFrame(frame);
      }
      if(reduce){ group.rotation.set(.5, .6, 0); renderer.render(scene, cam); }
      else frame();
      canvas.classList.add('ready');
    };
    document.head.appendChild(s);
  })();
})(window.PF);
