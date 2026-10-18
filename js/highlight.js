/* Syntax highlighting for the project pages.
   ---------------------------------------------------------------
   The code on a project page is written by hand, in HTML, inside <pre><code data-lang="go">.
   The alternative - pre-marked <span class="tok-*"> elements, as a build step would emit - means
   every pasted line has to be re-tagged by hand the moment it is edited, and one forgotten span
   shows up as a single uncoloured token rather than as a failed build. So the markup stays plain
   and this paints it once on load.

   It is deliberately a scanner, not a parser: no scope tracking, no nesting, no "is this a
   string or a comment inside a string". Go, TypeScript and the handful of shell lines on these
   pages do not need any of that, and a rule set that cannot get confused is worth more here than
   one that colours a template literal three levels down.

   Tokens are matched in order at each position, so comments and strings run before keywords and
   a word inside a string is never re-coloured. Anything that matches no rule is emitted as plain
   text, which is also why a language with no entry below renders cleanly instead of not at all. */
(function(){
  "use strict";

  /* Sticky (/y) throughout: every rule is tried at exactly the cursor, so a keyword can never
     match halfway through an identifier the way an unanchored \b-less pattern would. */
  var RULES = {
    go: [
      ['com', /\/\/[^\n]*/y],
      ['str', /"(?:[^"\\\n]|\\.)*"|`[^`]*`/y],
      ['key', /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b|\b(?:nil|true|false)\b/y],
      /* Builtins first, then any capitalised identifier. Go's export convention means a capital
         is a type, a function or a constant - close enough for colour, and it keeps json.Number,
         http.StatusOK and MyConfig apart from the local variables around them. */
      ['typ', /\b(?:any|bool|byte|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64)\b|\b[A-Z][A-Za-z0-9_]*\b/y],
      ['num', /\b\d+(?:\.\d+)?\b/y]
    ],
    ts: [
      ['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
      ['str', /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y],
      ['key', /\b(?:abstract|as|async|await|break|case|catch|class|const|continue|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|of|private|protected|public|readonly|return|set|static|super|switch|this|throw|try|type|typeof|var|void|while|yield)\b|\b(?:true|false|null|undefined)\b/y],
      ['typ', /\b(?:any|boolean|never|number|object|string|unknown|Promise|Array|Record|Error|Response)\b|\b[A-Z][A-Za-z0-9_]*\b/y],
      ['num', /\b\d+(?:\.\d+)?\b/y]
    ],
    json: [
      ['typ', /"(?:[^"\\]|\\.)*"(?=\s*:)/y],
      ['str', /"(?:[^"\\]|\\.)*"/y],
      ['num', /-?\b\d+(?:\.\d+)?\b/y]
    ],
    sh: [
      ['com', /#[^\n]*/y],
      ['str', /"(?:[^"\\]|\\.)*"|'[^']*'/y],
      ['key', /\b(?:bash|cd|cat|chmod|cp|curl|docker|echo|export|go|git|grep|kill|ls|mkdir|mv|npm|ps|rm|sh|systemctl)\b/y],
      ['num', /\b\d+(?:\.\d+)?\b/y]
    ]
  };

  function esc(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function paint(src, rules){
    if(!rules) return esc(src);
    var out = '', plain = '', i = 0;
    function flush(){ if(plain){ out += esc(plain); plain = ''; } }
    while(i < src.length){
      var hit = null;
      for(var r = 0; r < rules.length; r++){
        var re = rules[r][1];
        re.lastIndex = i;
        var m = re.exec(src);
        // A zero-length match would spin the loop without advancing; skip it rather than guard
        // every rule, since none of them can produce one today.
        if(m && m[0].length){ hit = { cls: rules[r][0], text: m[0] }; break; }
      }
      if(hit){
        flush();
        out += '<span class="tok-' + hit.cls + '">' + esc(hit.text) + '</span>';
        i += hit.text.length;
      } else {
        plain += src[i++];
      }
    }
    flush();
    return out;
  }

  /* An <code> with no data-lang is left alone on purpose. A .env file is two bare
     KEY=value lines: there is no token worth colouring in it, and painting the key as a string
     would read as if the value mattered too. Plain --code-fg is the honest rendering, and this
     is what makes it - a missing language is not an error. */
  function highlight(){
    var blocks = document.querySelectorAll('pre > code[data-lang]');
    for(var i = 0; i < blocks.length; i++){
      var code = blocks[i];
      // data-done marks a block already painted, so a second call - or a language switch that
      // re-runs this - cannot wrap the spans it just created inside another set of spans.
      if(code.getAttribute('data-done')) continue;
      code.innerHTML = paint(code.textContent, RULES[code.getAttribute('data-lang')]);
      code.setAttribute('data-done','');
    }
  }

  /* Deferred with everything else, so the blocks arrive already coloured rather than flashing
     a page of unstyled code first. DOMContentLoaded is still the right trigger when this file
     is loaded without defer, so it waits for whichever one applies. */
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', highlight);
  else highlight();
})();