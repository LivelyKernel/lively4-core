'use strict';

import { AExpr } from '../src/active-expressions.js';
import { ActiveDOMView } from '../src/active-view.js';


let outOfScreen = AExpr(
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
