'use strict';

import { AExpr } from '../src/active-expressions.js?123';
import { ActiveDOMView } from '../src/active-view.js';

function mainDemo() {
  let outOfScreen = new AExpr(
    window => { 
      return parseInt(window.style.top) < 0 || parseInt(window.style.left) < 0;
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