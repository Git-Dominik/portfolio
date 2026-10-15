(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Accepts either a hex colour (what --greet-* are, and what the greeting assigns straight
     to el.style.color) or an "R,G,B" triple, and returns normalised floats. */
  function parseColor(css, fallback) {
    var raw = css.trim();
    var hex = /^#?([0-9a-f]{6})$/i.exec(raw);
    if (hex) {
      var n = parseInt(hex[1], 16);
      return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }
    var parts = raw.replace(/\s+/g, '').split(',').map(parseFloat);
    if (parts.length === 3 && parts.every(function (n) { return !isNaN(n); })) {
      return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
    }
    return fallback;
  }

  /* ---- Variant configs ----------------------------------------------------
     One renderer, several instances. The hero passes colours:null, which means
     "read --greet-1/2/3 live so the ribbon tracks the rotating greeting"; a
     background instance passes a fixed palette instead and opts out of the theme
     observer entirely. Everything else is the shape of the ribbon:

       dir       0 lays the ribbon along x, 1 rotates it to run down y
       anchor    where the centreline sits, 0..1 down the host
       spread    thickness multiplier
       fold      multiplier on the per-strand cross-fold (the hero's 0.06)
       fadeY/R/A  falloff around a point, so nothing draws a hard edge at the clip
       alpha     multiplier on --wave-alpha, which stays the global dial          */

  var HERO = {
    dir: 0, anchor: 0.46, spread: 1, fold: 0.06,
    lines: 112, linesNarrow: 70, samples: 96, samplesNarrow: 56,
    glowEvery: 5, glowHw: 3.5,
    fadeY: 0.5, fadeR: 1, fadeAmt: 0,
    alpha: 1, speed: 1, scroll: 0.0011,
    colors: null, fallback2D: true, themeBlend: true
  };

  /* The closing block behind contact + footer. Two treatments, one per theme, because
     additive blending cannot work on a light ground at all - adding light to near-white is
     a no-op, which is why the dark ribbon had to be hidden outright on light. The light
     entry is the Wash variant: same rising anchor and geometry, but composited source-over
     instead of additively, with a much higher alpha because the shader's strand curve is
     authored for a dark ground where 4%-per-strand accumulates into a ribbon and under
     source-over nothing accumulates. The bloom behind it is a sibling element, in the
     markup, so the shader does not have to grow a second drawing mode. */
  var CLOSING = {
    dark: {
      blend: 'additive',
      dir: 0, anchor: 0.74, spread: 1.5, fold: 0.7,
      lines: 120, linesNarrow: 74, samples: 96, samplesNarrow: 64,
      glowEvery: 5, glowHw: 3.5,
      fadeY: 0.74, fadeR: 0.66, fadeAmt: 1,
      alpha: 0.62, speed: 0.55, scroll: 0.0011,
      colors: ['#5563E9', '#A56BFF', '#FF7FA8'], fallback2D: false
    },
    light: {
      blend: 'normal',
      dir: 0, anchor: 0.74, spread: 1.5, fold: 0.7,
      lines: 120, linesNarrow: 74, samples: 96, samplesNarrow: 64,
      glowEvery: 3, glowHw: 4.5,
      fadeY: 0.74, fadeR: 0.52, fadeAmt: 1,
      alpha: 2.1, speed: 0.55, scroll: 0.0011,
      colors: ['#4C5BD6', '#FF6F9E', '#9B5CEA'], fallback2D: false
    }
  };

  /* The ribbon centreline, its thickness, and the per-line fold - with exact
     analytic derivatives, so each vertex gets a correctly oriented normal
     without any neighbour lookups. */
  var CURVE = [
    'float cenY(float x, float t){',
    '  return 0.46 + 0.24*x + 0.08*sin(x*3.1 + t) + 0.035*sin(x*7.3 - t*1.5);',
    '}',
    'float cenD(float x, float t){',
    '  return 0.24 + 0.08*3.1*cos(x*3.1 + t) + 0.035*7.3*cos(x*7.3 - t*1.5);',
    '}',
    'float thY(float x, float t){',
    '  return max(0.025, 0.17 + 0.12*sin(x*2.3 + t*0.8 + 1.2) + 0.05*sin(x*5.7 - t*1.2));',
    '}',
    'float thD(float x, float t){',
    '  return 0.12*2.3*cos(x*2.3 + t*0.8 + 1.2) + 0.05*5.7*cos(x*5.7 - t*1.2);',
    '}',
    'float foldY(float x, float u, float t){',
    '  return 0.5*sin(x*8.5 + u*6.0 + t*1.7) + 0.5*sin(x*4.1 - u*3.0 - t*1.1);',
    '}',
    'float foldD(float x, float u, float t){',
    '  return 0.5*8.5*cos(x*8.5 + u*6.0 + t*1.7) + 0.5*4.1*cos(x*4.1 - u*3.0 - t*1.1);',
    '}'
  ].join('\n');

  var VERT = [
    'precision highp float;',
    'attribute vec2 aPos;',   // x in 0..1 along the line, u in 0..1 across the ribbon
    'attribute vec2 aMeta;',  // line index, side (-1 / +1)
    'uniform vec2 uRes;',
    'uniform float uTime, uDir, uAnchor, uSpread, uFold, uGlowEvery, uGlowHw;',
    'varying float vU;',
    'varying float vSide;',
    'varying float vGlow;',
    'varying float vAlong;',
    'varying float vY;',
    CURVE,
    'void main(){',
    '  float x = aPos.x, u = aPos.y, t = uTime;',
    '  float edge = 1.0 - abs(u - 0.5) * 2.0;',
    '',
    // Same shape as the original 2D version: drift + thickness envelope + fold, with the
    // centreline expressed relative to uAnchor so one shader serves both instances.
    '  float y  = uAnchor + (cenY(x,t) - 0.46)',
    '                   + (u - 0.5) * thY(x,t) * uSpread',
    '                   + foldY(x,u,t) * uFold * (0.25 + edge);',
    '  float dy =            cenD(x,t)',
    '                   + (u - 0.5) * thD(x,t) * uSpread',
    '                   + foldD(x,u,t) * uFold * (0.25 + edge);',
    '',
    // uDir picks the orientation. The normal is rebuilt from the derivative in each
    // frame so a strand keeps a constant screen-space width instead of smearing where
    // the curve is steep, which is what happens if you rotate the position alone.
    '  vec2 n;',
    '  vec2 p;',
    '  if (uDir < 0.5) {',
    '    p = vec2(x * uRes.x, y * uRes.y);',
    '    n = normalize(vec2(-dy * uRes.y, uRes.x));',
    '  } else {',
    '    p = vec2(y * uRes.x, x * uRes.y);',
    '    n = normalize(vec2(uRes.y, -dy * uRes.x));',
    '  }',
    '',
    // Every 5th line is the wide, faint glow strand (the old lineWidth 7 pass).
    '  float glow = step(mod(aMeta.x, uGlowEvery), 0.5);',
    '',
    // Sampled before the half-width offset, or the falloff gets skewed sideways by up to
    // uGlowHw - 3.5px on the glow strands, which is wide enough to see.
    '  vY = p.y / uRes.y;',
    '  p += n * (aMeta.y * mix(0.5, uGlowHw, glow));',
    '',
    '  vec2 ndc = p / uRes * 2.0 - 1.0;',
    '  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);',
    '',
    '  vU = u; vSide = aMeta.y; vGlow = glow; vAlong = x;',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'varying float vU;',
    'varying float vSide;',
    'varying float vGlow;',
    'varying float vAlong;',
    'varying float vY;',
    'uniform vec3 uRgb1;',
    'uniform vec3 uRgb2;',
    'uniform vec3 uRgb3;',
    'uniform float uAlpha;',
    'uniform float uFadeY;',
    'uniform float uFadeR;',
    'uniform float uFadeAmt;',
    'void main(){',
    '  float edge = 1.0 - abs(vU - 0.5) * 2.0;',
    '  float a = 0.022 + 0.15 * pow(1.0 - edge, 1.5) + 0.03 * edge;',
    '  a *= mix(1.0, 0.28, vGlow);',
    '',
    // Feather across the strand: a hard 7px quad would read as a solid bar,
    // so the glow pass gets a soft edge and the 1px pass a little antialiasing.
    '  float f = smoothstep(0.0, 1.0, 1.0 - abs(vSide));',
    '  a *= mix(0.3 + 0.7 * f, f, vGlow);',
    '',
    // Match the old horizontal gradient stops (0.8 / 1.0 / 0.8 / 0.55).
    '  float g;',
    '  if (vAlong < 0.35)     g = mix(0.8, 1.0, vAlong / 0.35);',
    '  else if (vAlong < 0.8) g = mix(1.0, 0.8, (vAlong - 0.35) / 0.45);',
    '  else                   g = mix(0.8, 0.55, (vAlong - 0.8) / 0.2);',
    '  a *= g * uAlpha;',
    '',
    // The canvas is inset:0, so anything still visible at an edge gets cut in a straight
    // line. A background instance runs fadeAmt 1 and dissolves on all sides instead.
    '  a *= mix(1.0, 1.0 - smoothstep(uFadeR * 0.2, uFadeR, abs(vY - uFadeY)), uFadeAmt);',
    '',
    // The greeting palette, swept along the strand and wrapping back to the first stop at
    // the far end so the ribbon reads as a cycle rather than a fade-out.
    '  vec3 tint;',
    '  if (vAlong < 0.34)      tint = mix(uRgb1, uRgb2, vAlong / 0.34);',
    '  else if (vAlong < 0.67) tint = mix(uRgb2, uRgb3, (vAlong - 0.34) / 0.33);',
    '  else                     tint = mix(uRgb3, uRgb1, (vAlong - 0.67) / 0.33);',
    '',
    '  gl_FragColor = vec4(tint * a, a);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      var which = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
      console.warn('[wave] ' + which + ' shader failed to compile: ' + gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function mountWebGL(gl, canvas, host, cfg) {
    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      console.warn('[wave] Shader compilation failed — this wave will be blank.');
      canvas.remove();
      return;
    }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[wave] Shader program failed to link: ' + gl.getProgramInfoLog(prog)
        + ' — this wave will be blank.');
      canvas.remove();
      return;
    }
    gl.useProgram(prog);

    var uRes = gl.getUniformLocation(prog, 'uRes');
    var uTime = gl.getUniformLocation(prog, 'uTime');
    var uDir = gl.getUniformLocation(prog, 'uDir');
    var uAnchor = gl.getUniformLocation(prog, 'uAnchor');
    var uSpread = gl.getUniformLocation(prog, 'uSpread');
    var uFold = gl.getUniformLocation(prog, 'uFold');
    var uGlowEvery = gl.getUniformLocation(prog, 'uGlowEvery');
    var uGlowHw = gl.getUniformLocation(prog, 'uGlowHw');
    var uRgb1 = gl.getUniformLocation(prog, 'uRgb1');
    var uRgb2 = gl.getUniformLocation(prog, 'uRgb2');
    var uRgb3 = gl.getUniformLocation(prog, 'uRgb3');
    var uAlpha = gl.getUniformLocation(prog, 'uAlpha');
    var uFadeY = gl.getUniformLocation(prog, 'uFadeY');
    var uFadeR = gl.getUniformLocation(prog, 'uFadeR');
    var uFadeAmt = gl.getUniformLocation(prog, 'uFadeAmt');
    var aPos = gl.getAttribLocation(prog, 'aPos');
    var aMeta = gl.getAttribLocation(prog, 'aMeta');

    gl.enable(gl.BLEND);

    // The 2D version used globalCompositeOperation='lighter' in dark mode and plain
    // source-over in light. Additive is only meaningful on the dark ground, so which one
    // is in force depends on the config: themeBlend pairs them with the theme for the hero
    // (whose light-mode composite is genuinely source-over), while the closing block states
    // its blend per theme outright because its two treatments differ in more than blending.
    function setBlend() {
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      var additive = cfg.themeBlend ? !isLight : cfg.blend === 'additive';
      if (additive) gl.blendFunc(gl.ONE, gl.ONE);
      else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    setBlend();

    var posBuf = gl.createBuffer();
    var metaBuf = gl.createBuffer();
    var idxBuf = gl.createBuffer();
    var indexCount = 0, indexType = gl.UNSIGNED_SHORT;

    // One quad strip per filament, rebuilt only when the line count changes.
    function buildGeometry(lines, samples) {
      var verts = new Float32Array(lines * samples * 2 * 2);
      var meta = new Float32Array(lines * samples * 2 * 2);
      var idx = new Uint32Array(lines * (samples - 1) * 6);
      var v = 0, m = 0, n = 0;

      for (var i = 0; i < lines; i++) {
        var u = i / (lines - 1);
        var base = i * samples * 2;
        for (var k = 0; k < samples; k++) {
          var x = k / (samples - 1);
          for (var s = 0; s < 2; s++) {
            verts[v++] = x; verts[v++] = u;
            meta[m++] = i;  meta[m++] = s === 0 ? -1 : 1;
          }
        }
        for (var k = 0; k < samples - 1; k++) {
          var a = base + k * 2;
          idx[n++] = a; idx[n++] = a + 1; idx[n++] = a + 2;
          idx[n++] = a + 2; idx[n++] = a + 1; idx[n++] = a + 3;
        }
      }

      indexCount = n;

      // 16-bit indices only address 65k vertices; go 32-bit past that.
      var totalVerts = lines * samples * 2;
      var indexData = idx;
      indexType = gl.UNSIGNED_SHORT;
      if (totalVerts > 65535) {
        indexData = idx;
        indexType = gl.UNSIGNED_INT;
      } else {
        // Narrow from the scratch Uint32Array rather than allocating per build.
        indexData = new Uint16Array(lines * (samples - 1) * 6);
        for (var q = 0; q < indexData.length; q++) indexData[q] = idx[q];
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, metaBuf);
      gl.bufferData(gl.ARRAY_BUFFER, meta, gl.STATIC_DRAW);
    }

    // vertexAttribPointer records the buffer bound to ARRAY_BUFFER *at call time*,
    // so each attribute must be pointed at its own buffer explicitly — rebinding
    // afterwards does not retroactively fix it.
    function bindAttribs() {
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, metaBuf);
      gl.enableVertexAttribArray(aMeta);
      gl.vertexAttribPointer(aMeta, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    }

    var builtLines = 0, phase = 0.8, visible = true;

    function resize() {
      var r = host.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width * dpr));
      var h = Math.max(1, Math.round(r.height * dpr));
      var sizeChanged = canvas.width !== w || canvas.height !== h;
      if (sizeChanged) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      var cssW = Math.max(1, Math.round(r.width));
      var lines = cssW < 700 ? cfg.linesNarrow : cfg.lines;
      // The curve's highest frequency is ~8.5 rad across the width, so far
      // fewer samples than the old fixed 6px step are needed to stay smooth.
      var samples = cssW < 700 ? cfg.samplesNarrow : cfg.samples;
      // Build regardless of whether the backing store changed size: a fresh
      // canvas is already 300x150, which would otherwise match and skip.
      if (lines !== builtLines) {
        buildGeometry(lines, samples);
        builtLines = lines;
      }
      // Attribute pointers capture buffer bindings, so re-bind on every
      // resize — resizing a canvas resets GL state.
      bindAttribs();

      if (sizeChanged) draw(phase);
    }

    // --wave-alpha stays the one global dial; cfg.alpha is the per-instance trim on top.
    var waveAlpha = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--wave-alpha')) || 1;

    // Read off cfg every frame rather than capturing the stops once. The closing block
    // swaps its whole config when the theme flips, and a captured copy would leave it
    // painting the dark palette in light mode.
    function draw(t) {
      phase = t;
      var c = cfg.colors;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uDir, cfg.dir);
      gl.uniform1f(uAnchor, cfg.anchor);
      gl.uniform1f(uSpread, cfg.spread);
      gl.uniform1f(uFold, cfg.fold);
      gl.uniform1f(uGlowEvery, cfg.glowEvery);
      gl.uniform1f(uGlowHw, cfg.glowHw);
      gl.uniform3f(uRgb1, c[0][0], c[0][1], c[0][2]);
      gl.uniform3f(uRgb2, c[1][0], c[1][1], c[1][2]);
      gl.uniform3f(uRgb3, c[2][0], c[2][1], c[2][2]);
      gl.uniform1f(uAlpha, waveAlpha * cfg.alpha);
      gl.uniform1f(uFadeY, cfg.fadeY);
      gl.uniform1f(uFadeR, cfg.fadeR);
      gl.uniform1f(uFadeAmt, cfg.fadeAmt);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, indexCount, indexType, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    // A theme swap changes blend mode, and the closing block's two treatments also differ
    // in glow cadence, which is baked into the vertex positions rather than a uniform.
    // resize() rebuilds geometry on its own if the strand counts differ; this forces a
    // redraw either way, so the block does not sit showing the old theme's ribbon until
    // the next scroll tick.
    onTheme = function () { setBlend(); resize(); draw(phase); };

    if (reduceMotion) return;

    // The closing block sits at the very bottom of a long page, so without this its
    // rAF loop would keep submitting draws for a canvas that has been off-screen for
    // most of the session.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; })
        .observe(host);
    }

    (function frame(now) {
      if (visible) draw(now * 0.00022 * cfg.speed + window.scrollY * cfg.scroll);
      requestAnimationFrame(frame);
    })(0);
  }

  // ---- No WebGL: keep the original 2D path so the hero is never empty. Only the hero
  // ---- opts into it; a background ribbon can simply be absent.
  function mount2D(canvas, host, cfg) {
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[wave] 2D fallback also unavailable — this wave will be blank.');
      canvas.remove();
      return;
    }
    console.info('[wave] Using 2D fallback renderer, which costs ~0.9ms of main-thread time per frame.');

    var rgb = [[0.74, 0.76, 0.91], [1, 1, 1], [1, 1, 1]];
    var cs = getComputedStyle(document.documentElement);
    for (var i = 0; i < 3; i++) {
      rgb[i] = parseColor(cs.getPropertyValue('--greet-' + (i + 1)), rgb[i]);
    }
    var alphaScale = (parseFloat(cs.getPropertyValue('--wave-alpha')) || 1) * cfg.alpha;

    var W = 0, H = 0, lines = 112, STEP = 6, grad = null, cen = [], th = [];
    var toRGB = function (i) { return rgb[i].map(function (v) { return Math.round(v * 255); }).join(','); };

    function buildGradient() {
      grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'rgba(' + toRGB(0) + ',0.8)');
      grad.addColorStop(0.35, 'rgba(' + toRGB(1) + ',1)');
      grad.addColorStop(0.8, 'rgba(' + toRGB(2) + ',0.8)');
      grad.addColorStop(1, 'rgba(' + toRGB(0) + ',0.55)');
    }

    function size() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lines = r.width < 700 ? cfg.linesNarrow : cfg.lines;
      buildGradient();
    }

    var dark = document.documentElement.getAttribute('data-theme') === 'dark';

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      ctx.strokeStyle = grad;
      var pts = Math.ceil(W / STEP) + 1, k, i, nx;
      for (k = 0; k < pts; k++) {
        nx = k / (pts - 1);
        cen[k] = H * (cfg.anchor + 0.24 * nx) + H * 0.08 * Math.sin(nx * 3.1 + t)
          + H * 0.035 * Math.sin(nx * 7.3 - t * 1.5);
        th[k] = Math.max(H * 0.025, H * cfg.spread * (0.17
          + 0.12 * Math.sin(nx * 2.3 + t * 0.8 + 1.2)
          + 0.05 * Math.sin(nx * 5.7 - t * 1.2)));
      }
      for (i = 0; i < lines; i++) {
        var u = i / (lines - 1);
        var edge = 1 - Math.abs(u - 0.5) * 2;
        var a = (0.022 + 0.15 * Math.pow(1 - edge, 1.5) + 0.03 * edge) * alphaScale;
        var glow = i % cfg.glowEvery === 0;
        ctx.globalAlpha = glow ? a * 0.28 : a;
        ctx.lineWidth = glow ? cfg.glowHw * 2 : 1;
        ctx.beginPath();
        for (k = 0; k < pts; k++) {
          nx = k / (pts - 1);
          var fold = 0.5 * Math.sin(nx * 8.5 + u * 6 + t * 1.7)
            + 0.5 * Math.sin(nx * 4.1 - u * 3 - t * 1.1);
          var y = cen[k] + (u - 0.5) * th[k] + fold * H * cfg.fold * (0.25 + edge);
          if (k === 0) ctx.moveTo(0, y); else ctx.lineTo(nx * W, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    size();
    draw(0.8);
    window.addEventListener('resize', function () { size(); draw(0.8); });
    new MutationObserver(function () {
      dark = document.documentElement.getAttribute('data-theme') === 'dark';
      draw(0.8);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if (reduceMotion) return;
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(host);
    }
    (function loop(now) {
      if (visible) draw(now * 0.00022 * cfg.speed + window.scrollY * cfg.scroll);
      requestAnimationFrame(loop);
    })(0);
  }

  function mount(canvas, host, spec) {
    if (!canvas || !host) return;

    // The object every closure below holds on to. Mutated in place across theme changes.
    var cfg = {};
    applyInto(cfg, resolveFor(spec));
    // Called back after a theme swap so the instance can re-apply GL state that is not a
    // per-frame uniform: blend mode, and geometry if the two themes disagree on strand count.
    var onTheme = null;

    var gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power'
    }) || canvas.getContext('experimental-webgl');

    if (!gl) {
      if (!cfg.fallback2D) return;
      // Surface the real cause — a silently missing hero is much harder to
      // diagnose than an explicit console warning.
      var why = (function () {
        try {
          var probe = document.createElement('canvas');
          var ctx2 = probe.getContext('webgl2') || probe.getContext('webgl');
          if (ctx2) {
            var ext = ctx2.getExtension('WEBGL_debug_renderer_info');
            return 'getContext("webgl") returned null despite the probe succeeding'
              + (ext ? ' (renderer: ' + ctx2.getParameter(ext.UNMASKED_RENDERER_WEBGL) + ')' : '')
              + ' — the context may have been lost or blocked by the requested attributes';
          }
          var probe2d = probe.getContext('2d');
          if (!probe2d) return 'neither WebGL nor 2D canvas contexts are available';
          return 'WebGL is not supported by this browser or is disabled'
            + ' (hardware acceleration may be off, or the GPU may be blocklisted)';
        } catch (e) {
          return 'getContext("webgl") threw: ' + (e && e.message ? e.message : e);
        }
      })();
      console.warn('[wave] WebGL unavailable — ' + why);
      mount2D(canvas, host, cfg);
      return;
    }

    // A spec is either one config (the hero) or {dark, light} (the closing block, whose two
    // treatments differ in blend and palette, not just in appearance). The live config is
    // mutated IN PLACE on a theme change rather than reassigned, because resize(), draw()
    // and setBlend() all close over this object - replacing the binding would leave them
    // reading the config the instance started with.
    function resolveFor(spec) {
      if (spec.dark && spec.light) {
        return document.documentElement.getAttribute('data-theme') === 'light'
          ? spec.light : spec.dark;
      }
      return spec;
    }

    function applyInto(target, next) {
      for (var k in target) delete target[k];
      for (var j in next) target[j] = next[j];
    }

    function parseColors(target) {
      if (target.colors) {
        target.colors = target.colors.map(function (c) { return parseColor(c, [1, 1, 1]); });
      } else {
        // The ribbon is painted from the same three colours the greeting cycles through,
        // read straight out of CSS as --greet-1/2/3 so the two cannot drift apart.
        var cs = getComputedStyle(document.documentElement);
        target.colors = [0, 1, 2].map(function (i) {
          return parseColor(cs.getPropertyValue('--greet-' + (i + 1)),
            [[0.74, 0.76, 0.91], [1, 1, 1], [1, 1, 1]][i]);
        });
      }
    }
    parseColors(cfg);

    // One observer for both reasons a theme change matters here: the closing block swaps
    // its entire treatment, and the hero's palette is theme-driven. Kept even for a fixed
    // palette so blend() can be re-applied if that config ever gains a light variant.
    new MutationObserver(function () {
      applyInto(cfg, resolveFor(spec));
      parseColors(cfg);
      if (onTheme) onTheme();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    mountWebGL(gl, canvas, host, cfg);
  }

  mount(document.getElementById('heroWave'), document.querySelector('.hero'), HERO);

  var closing = document.querySelector('.closing');
  if (closing) mount(closing.querySelector('canvas'), closing, CLOSING);
})();