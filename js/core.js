window.PF = (function(){
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(sel, root){ return [].slice.call((root || document).querySelectorAll(sel)); }
  function $(sel, root){ return (root || document).querySelector(sel); }

  /* ---- Theme ----
     index.html sets data-theme on <html> before first paint, so all this does is read it,
     own the writes, and tell anyone who cares when it changes. */
  var root = document.documentElement;
  var listeners = [];

  /* theme-color follows the theme, not the OS. Both metas are gated on
     prefers-color-scheme, which is only right until someone presses the toggle: the page
     then flips while the status bar keeps the OS's colour, and on a phone that is a bright
     strip sitting on a dark page. Rewriting both means whichever one the browser picks is
     the one the page is actually wearing. The values are the body --bg for each theme. */
  var CHROME = { dark: '#17171a', light: '#faf9f6' };
  function paintChrome(theme){
    $$('meta[name="theme-color"]').forEach(function(m){ m.setAttribute('content', CHROME[theme]); });
  }

  var theme = {
    get current(){ return root.dataset.theme === 'dark' ? 'dark' : 'light'; },
    get isDark(){ return theme.current === 'dark'; },
    set: function(next){
      if(next !== 'light' && next !== 'dark') return;
      if(next === theme.current) return;
      root.dataset.theme = next;
      try{ localStorage.setItem('theme', next); }catch(e){}
      paintChrome(next);
      listeners.forEach(function(fn){ fn(theme.current); });
    },
    toggle: function(){ theme.set(theme.current === 'dark' ? 'light' : 'dark'); },
    onChange: function(fn){ listeners.push(fn); }
  };
  paintChrome(theme.current);

  return { reduce: reduce, $$: $$, $: $, theme: theme };
})();