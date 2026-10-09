window.PF = (function(){
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(sel, root){ return [].slice.call((root || document).querySelectorAll(sel)); }
  function $(sel, root){ return (root || document).querySelector(sel); }
  return { reduce: reduce, $$: $$, $: $ };
})();
