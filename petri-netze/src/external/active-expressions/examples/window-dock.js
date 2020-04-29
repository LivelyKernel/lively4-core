import { AExpr } from 'src/../../active-expressions/src/active-expressions.js?3523';
import { ActiveDOMView } from 'src/../../active-expressions/src/active-view.js';

function updateDock(view) {
  console.log('minimized:', [...view.elements].filter(w => w.isMinimized()));
  console.log('not minimized:', [...view.elements].filter(w => !w.isMinimized()));
}

function demo() {
  var minMax = new AExpr(w => w.positionBeforeMinimize, {debug: true});
  
  console.log('new domview');
  var view = new ActiveDOMView('lively-window')
  	.onEnter(w => {
  		console.log('enter', w);
  		minMax.applyOn(w).onChange(w => {
  			// console.log(w, 'minimized?', w.isMinimized())
  			updateDock(view);
  		});
  	})
  	.onExit(w => {
  		console.log('exit', w);
  	});
  console.log(view);
}

demo();