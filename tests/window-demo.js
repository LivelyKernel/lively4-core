'use strict';

function mainDemo() {
  var expr = new lively.ActiveExpr.Expr(
    // Condition
    function() { 
      return parseInt(w.style.top) > 0
    },
    
    // Callback
    function(newValue) { 
      if (!newValue) {
        this.w.dragging = false;
        this.w.window.classList.remove('dragging');
      }
    },
    
    // Context
    { w: document.querySelector('lively-window') }
  );
}


// activeExpr {
//   var w = document.querySelector('lively-window')
// }, {
//   parseInt(w.style.top) > 0;
// }, {
//   if (!newValue) {
//     w.dragging = false;
//     w.window.classList.remove('dragging');
//   }
// }


lively.import('ActiveExpr', 'https://lively-kernel.org/lively4/active-expressions/src/active-expressions.js').then(function() {
  mainDemo();
});