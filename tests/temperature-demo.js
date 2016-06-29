'use strict';

import { AExpr } from '../src/active-expressions.js';

function mainDemo() {
  var sliderC = document.querySelector('lively-container /deep/ #celsius');
  var sliderF = document.querySelector('lively-container /deep/ #fahrenheit');

  let expr = AExpr(
    function watch(c, f) {
      return c.value;
    }, {debug: true})
    .applyOn(sliderC, sliderF)
    .onChange(function(c, f) {
      f.value = c.value * 1.8 + 32;
    });

  let expr2 = AExpr(
    function watch(c, f) {
      return f.value;
    })
    .applyOn(sliderC, sliderF)
    .onChange(function(c, f) {
      c.value = -32/1.8 + f.value/1.8;
    });
}

mainDemo();

// lively.ActiveExpr = undefined;
// lively.import('ActiveExpr', 'https://lively-kernel.org/lively4/active-expressions/src/active-expressions.js').then(function() {
//   mainDemo();
// });