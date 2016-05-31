'use strict';

function mainDemo() {
  var sliderC = document.querySelector('#celsius');
  var sliderF = document.querySelector('#fahrenheit');
  
  console.log('inserting active expr..');
  var expr = new lively.ActiveExpr.Expr(
    // Condition
    function() { 
      return c.value == (f.value - 32) / 1.8;
    },
    
    // Callback
    function(newValue) { 
      c.value = (f.value - 32) / 1.8;
    },
    
    // Context
    { c: sliderC, f: sliderF }
  );
}

lively.import('ActiveExpr', 'https://lively-kernel.org/lively4/active-expressions/src/active-expressions.js').then(function() {
  // mainDemo();
});