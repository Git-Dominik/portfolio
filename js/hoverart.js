(function(PF){
  "use strict";
  var reduce = PF.reduce, $$ = PF.$$;

  /* ---- Hover art on the dividers ----
     One shared element chases the pointer. Each divider carries the image to show in
     data-hover-img, so swapping or adding art is an edit in the HTML, not in here.

     The hit area is tested in JS against each divider's rect, NOT with a transparent
     overlay element. Two reasons that matters:
       - the next <section> is position:relative and paints over any absolutely positioned
         pseudo-element, so an overlay only works if you raise its z-index, which then
         silently swallows clicks on whatever content sits inside the band;
       - the band reaches up to 112px past the rule, which is exactly where the next
         heading lives. Proximity testing leaves no footprint, so nothing is blocked.

     The whole transform (position, side-flip, mirror, entrance bounce) is composed in a
     single rAF pass. Writing `transform` from JS while a CSS transition or keyframe also
     targets it is the classic way these end up fighting, so CSS only owns opacity here. */
  (function(){
    var dividers = $$('.divider[data-hover-img]').filter(function(d){ return d.getAttribute('data-hover-img'); });
    if(!dividers.length) return;

    // No fine pointer, or the visitor asked for less motion: leave the art out entirely.
    if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if(reduce) return;

    var wrap = document.createElement('div');
    wrap.className = 'hover-art';
    wrap.setAttribute('aria-hidden','true');
    var img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    wrap.appendChild(img);
    document.body.appendChild(wrap);

    /* Hit area, in px around each divider. Down is weighted heavier because that is where
       the whitespace is: the next section has 88px of top padding under the rule.
       Capped at 136px total because consecutive dividers sit 144px apart - any taller and
       two bands overlap, so the art flickers between two characters in the gap. */
    var PAD_TOP = 24, PAD_BOTTOM = 112, PAD_SIDE = 0.18;   // PAD_SIDE is a fraction of width
    var FLIP_AT = 2, EDGE = 8;
    /* Smoothing is time-based, not per-frame: a fixed 0.18 step lands in a different place
       at 144Hz than at 60Hz, which reads as inconsistent rather than smooth. */
    var SMOOTH = 22, SETTLED = 0.4;

    var POP_FROM = 0.55, POP_MS = 520, POP_W = 9, POP_Z = 0.45;
    function popScale(t){
      if(t <= 0) return POP_FROM;
      if(t >= 1) return 1;
      var zw = POP_Z * POP_W;
      var wd = POP_W * Math.sqrt(1 - POP_Z * POP_Z);
      var step = 1 - Math.exp(-zw * t) * (Math.cos(wd * t) + (zw / wd) * Math.sin(wd * t));
      return POP_FROM + (1 - POP_FROM) * step;
    }

    function now(){ return performance.now(); }

    var boxes = [], atX = -1, atY = -1;
    function refresh(){
      boxes = dividers.map(function(d){
        var r = d.getBoundingClientRect();
        var pad = r.width * PAD_SIDE;
        return { el:d, src:d.getAttribute('data-hover-img'), line:r.top,
                 // padded band = the hit area; rl/rr = the rule itself, which is what the
                 // artwork is not allowed to spill outside of
                 rl:r.left, rr:r.right,
                 l:r.left - pad, r:r.right + pad,
                 t:r.top - PAD_TOP, b:r.bottom + PAD_BOTTOM };
      });
      atX = window.scrollX; atY = window.scrollY;
    }
    /* Re-measure only when the page has actually moved. Relying on the scroll event alone
       proved unreliable here: the bands silently kept their pre-scroll rects and every
       hit test missed. Verifying the scroll position directly cannot go stale. */
    function ensureFresh(){
      if(window.scrollX !== atX || window.scrollY !== atY) refresh();
    }

    function hitAt(x, y){
      for(var i = 0; i < boxes.length; i++){
        var k = boxes[i];
        if(x >= k.l && x <= k.r && y >= k.t && y <= k.b) return k;
      }
      return null;
    }

    var cx = 0, tx = 0;                 // X only: the art slides, the Y is locked to the rule
    var lineY = 0;
    var dir = 1, lastX = null, flippedAt = 0;
    var active = null, raf = 0, shownAt = 0, last = 0;
    var w = 0, h = 0;

    function measure(){ w = img.offsetWidth || 0; h = img.offsetHeight || 0; }

    function place(scale){
      /* Horizontally the art is centred on the pointer: no side offset, no swapping
         sides. scaleX(-dir) turns the character the opposite way to the travel, so
         moving left shows it facing right, and moving right shows it facing left. */
      var vw = window.innerWidth;
      /* Centred on the pointer, but never wider than the rule it belongs to: the hit band
         deliberately extends past both ends, and without this the character hangs off the
         edge of the line. The mirror needs no positional compensation either, because
         transform-origin is 50% 100% and scaleX(-1) about the element's own centre flips
         the artwork inside the box without moving the box. */
      var lo = active ? active.rl : EDGE, hi = (active ? active.rr : vw) - w;
      if(hi < lo) lo = hi = lo + (active ? active.rr - active.rl - w : 0) / 2;
      var dx = Math.max(lo, Math.min(cx - w / 2, hi));
      // Locked to the rule: the bottom edge sits exactly ON the line, whatever the
      // pointer's Y does. The one exception is a divider scrolled right up to the top of
      // the viewport, where an untouched lock would put the art entirely off screen.
      var dy = Math.max(EDGE, lineY - h);
      wrap.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ') scaleX(' + (-dir) + ')';
    }

    function loop(now){
      // Cap dt so a backgrounded tab or a long stall cannot teleport the art on return.
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      cx += (tx - cx) * (1 - Math.exp(-SMOOTH * dt));

      var t = (now - shownAt) / POP_MS;
      var scale = popScale(t);
      place(scale);

      // Run only while there is something to animate. Holding the pointer still over a
      // divider settles the position and the loop stops, so idle hovering costs no frames.
      var animating = t < 1;
      if(animating || Math.abs(tx - cx) > SETTLED) raf = requestAnimationFrame(loop);
      else { raf = 0; last = 0; }
    }

    function kick(){ if(!raf){ last = 0; raf = requestAnimationFrame(loop); } }

    /* Accept a dropped-in file whatever its extension: try the given name, then the
       obvious alternative. A missing file simply means no art on that divider. */
    var ALT = { png:'.jpg', jpg:'.png', jpeg:'.png', webp:'.png', gif:'.png' };
    function load(src){
      img.onload = function(){ measure(); };
      img.onerror = function(){
        var m = src.match(/\.([a-z0-9]+)$/i);
        var alt = m && ALT[m[1].toLowerCase()];
        if(!alt || img.dataset.tried) return;   // one retry, then give up quietly
        img.dataset.tried = '1';
        img.src = src.replace(/\.[a-z0-9]+$/i, alt);
      };
      delete img.dataset.tried;
      img.src = src;
    }

    function enter(box, x, y){
      active = box;
      lineY = box.line;
      if(img.getAttribute('src') !== box.src){ load(box.src); measure(); }
      tx = cx = x;
      lastX = x;
      shownAt = performance.now();
      wrap.classList.add('on');
      kick();
    }

    function leave(){
      active = null;
      wrap.classList.remove('on');
    }

    document.addEventListener('mousemove', function(e){
      ensureFresh();
      var box = hitAt(e.clientX, e.clientY);
      if(box !== active){
        if(box) enter(box, e.clientX, e.clientY);
        else leave();
      } else if(box){
        tx = e.clientX;                       // Y is deliberately not tracked
        // A dead zone plus a short cooldown: flipping re-rasters the image, so a pointer
        // trembling across the threshold would repaint it dozens of times a second.
        var moved = lastX !== null && Math.abs(e.clientX - lastX) > FLIP_AT;
        if(moved && now() - flippedAt > 90){
          if(e.clientX > lastX !== (dir > 0)) dir = dir > 0 ? -1 : 1;
          flippedAt = now();
        }
        lastX = e.clientX;
      }
      kick();
    }, { passive: true });

    document.addEventListener('mouseleave', leave);
    document.addEventListener('scroll', function(){
      if(active) leave();              // never let art linger over a stale position
    }, { passive: true });
    window.addEventListener('blur', leave);
    window.addEventListener('resize', function(){ refresh(); measure(); }, { passive: true });
    document.addEventListener('visibilitychange', function(){ if(document.hidden) leave(); });

    refresh();
    measure();
  })();
})(window.PF);