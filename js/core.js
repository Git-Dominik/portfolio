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
  var theme = {
    get current(){ return root.dataset.theme === 'dark' ? 'dark' : 'light'; },
    get isDark(){ return theme.current === 'dark'; },
    set: function(next){
      if(next !== 'light' && next !== 'dark') return;
      if(next === theme.current) return;
      root.dataset.theme = next;
      try{ localStorage.setItem('theme', next); }catch(e){}
      listeners.forEach(function(fn){ fn(theme.current); });
    },
    toggle: function(){ theme.set(theme.current === 'dark' ? 'light' : 'dark'); },
    onChange: function(fn){ listeners.push(fn); }
  };

  return { reduce: reduce, $$: $$, $: $, theme: theme };
})();