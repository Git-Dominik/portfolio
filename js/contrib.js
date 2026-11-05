(function(PF){
  "use strict";
  var $ = PF.$;

  /* ---- GitHub contribution graph ----
     GitHub only serves this through its GraphQL API, which needs a token, and a token cannot
     live in a static site's source. jogruber's public proxy exposes the same calendar without
     one (CORS open). The cost is a third-party dependency: if it is down the block simply
     stays hidden, which is why the markup ships with [hidden]. */
  var box = $('#contrib');
  if(!box) return;

  fetch('https://github-contributions-api.jogruber.de/v4/Git-Dominik?y=last')
    .then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .then(function(d){
      var days = d.contributions;
      if(!days || !days.length) throw 0;

      var grid = $('#contrib-grid'), frag = document.createDocumentFragment();
      days.forEach(function(day, i){
        var c = document.createElement('i');
        c.className = 'l' + day.level;
        c.title = day.date + ': ' + day.count;
        // Columns are weeks starting Sunday; the first column may begin mid-week.
        if(i === 0) c.style.gridRowStart = new Date(day.date + 'T00:00:00Z').getUTCDay() + 1;
        frag.appendChild(c);
      });
      grid.appendChild(frag);
      $('#contrib-total').textContent = d.total.lastYear;

      box.hidden = false;    })
    .catch(function(){ /* leave hidden */ });
})(window.PF);
