'use strict';

function setUpBall(ball) {
  ball.id = 'bouncy-ball';
  ball.setAttribute('style', `
    position: absolute; 
    top: 0; left: 0; right: auto; bottom: auto;
    width: 30px; height: 30px;
    background: red;
    border-radius: 50%;
    z-index: 1000;`);
    
  document.body.appendChild(ball);
  
  ball.velocity = 0.0;
  ball.direction = Math.PI/4; // degrees
  
  ball.dx = 2.0;
  ball.dy = 3.0;
  
  ball.style.left = 300;
  ball.style.top = 300;
}

function mainDemo() {
  
  // remove previous ball
  var b = document.querySelector('* /deep/ #bouncy-ball');
  if (b) b.remove();
  
  window.ball = document.createElement('div');
  let ball = window.ball;
  
  setUpBall(ball);
  
  var timer = setInterval(function() {
    var x = parseFloat(ball.style.left);
    var y = parseFloat(ball.style.top);
    
    if (!ball || !ball.parentElement) {
      clearInterval(timer);
      return;
    }

    var parent = ball.parentElement.getBoundingClientRect();

    if (x <= 0 || x >= parent.width - 30) {
      ball.dx = -ball.dx;
    }

    if (y <= 0 || y >= parent.height - 30) {
      ball.dy = -ball.dy;
    }

    ball.style.left = '' + (x + ball.dx) + 'px';
    ball.style.top = '' + (y + ball.dy) + 'px';
  }, 10);
  
  return;
  
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

lively.import('ActiveExpr', 'https://lively-kernel.org/lively4/active-expressions/src/active-expressions.js').then(function() {
  mainDemo();
});