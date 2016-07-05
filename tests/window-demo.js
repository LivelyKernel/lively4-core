'use strict';

import { AExpr } from '../src/active-expressions.js';
import { ActiveDOMView } from '../src/active-view.js?324234';

function mainDemo() {
  let outOfScreen = new AExpr(
    function condition(w) { 
      return parseInt(w.style.top) < 0 || parseInt(w.style.left) < 0
    }
  );
  
  function adjustPosition(node) {
    if (parseInt(node.style.top) < 0) {
      node.style.top = 0;
    }
    if (parseInt(node.style.left) < 0) {
      node.style.left = 0;
    }
  }
  
  new ActiveDOMView('lively-window').onEnter(function(node) {
    console.log('window entered');
    outOfScreen
      .applyOn(node)
      .onChange(adjustPosition);
  });
}

mainDemo();
// lively.import('ActiveExpr', 'https://lively-kernel.org/lively4/active-expressions/src/active-expressions.js').then(function() {
//   mainDemo();
// });