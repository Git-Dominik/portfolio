(function(PF){
  "use strict";
  var $ = PF.$, $$ = PF.$$;

  /* ---- Theme toggle ----
     The button only writes; js/core.js owns the attribute and the storage, and every module
     that needs to know about a change subscribes there. The label is rewritten here because
     it has to describe what pressing the button will do, not what is currently showing. */
  var LABEL = {
    nl: { on: 'Donkere modus', off: 'Lichte modus' },
    en: { on: 'Dark mode', off: 'Light mode' },
    pl: { on: 'Tryb ciemny', off: 'Tryb jasny' }
  };
  var btn = $('#theme-toggle');
  if(!btn) return;

  function label(){
    var lang = document.documentElement.lang || 'nl';
    var set = LABEL[lang] || LABEL.nl;
    // In dark theme the button offers light; in light it offers dark.
    btn.querySelector('.sr-only').textContent = PF.theme.isDark ? set.off : set.on;
    btn.setAttribute('aria-label', PF.theme.isDark ? set.off : set.on);
    btn.setAttribute('aria-pressed', PF.theme.isDark ? 'true' : 'false');
  }

  btn.addEventListener('click', function(){ PF.theme.toggle(); label(); });
  label();

  // Following a language switch has to re-render the label, or it stays in the old one.
  $$('.lang-switch button').forEach(function(b){
    b.addEventListener('click', function(){ setTimeout(label, 0); });
  });

  // Another tab changing the theme should not leave this one lying about its state.
  window.addEventListener('storage', function(e){ if(e.key === 'theme') label(); });
})(window.PF);