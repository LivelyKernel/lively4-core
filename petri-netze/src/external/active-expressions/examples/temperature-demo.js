'use strict';

import { AExpr } from '../src/active-expressions.js';

function mainDemo() {
  var sliderC = document.querySelector('lively-container #celsius');
  var sliderF = document.querySelector('lively-container #fahrenheit');

  console.log(sliderC, sliderF);

  let expr = new AExpr(
    function watch(c, f) {
      return c.value;
    })
    .applyOn(sliderC, sliderF)
    .onChange(function(c, f) {
      f.value = c.value * 1.8 + 32;
    });

  let expr2 = new AExpr(
    function watch(c, f) {
      return f.value;
    })
    .applyOn(sliderC, sliderF)
    .onChange(function(c, f) {
      c.value = -32/1.8 + f.value/1.8;
    });
}

mainDemo();