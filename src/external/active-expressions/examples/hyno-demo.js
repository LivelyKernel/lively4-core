
import { AExpr } from '../src/active-expressions.js';
import { ActiveDOMView } from '../src/active-view.js';

class Timer {
  constructor(tickRate) {
    this.tickRate = tickRate || 1000;
    this.ticks = 0;
    this._interval = null;
  }
  
  start() {
    this.stop();
    this._interval = setInterval(() => this._tick(), this.tickRate);
  }
  
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
  
  reset() {
    this.ticks = 0;
    this.stop();
  }
  
  setTickRate(tickRate) {
    this.tickRate = tickRate;
    this.reset();
  }
  
  _tick() {
    this.ticks++;
    // console.log('TICK!', this.ticks);
  }
}

function addCircle() {
  var c = document.createElement('div');
  c.style = 'position: absolute; top: 203px; left: 628px; width: 100px; height: 100px; z-index: 200; border-radius: 50%; transform: scale(1); background: maroon;';
  c.id = 'hypno';
  document.body.appendChild(c);
}


var circle = document.querySelector('#hypno');

if (circle) {
  if (!window.timer) {
    window.timer = new Timer(100);
  }

  window.timer.reset();
  
  new AExpr(function condition(t) {
    return t.ticks;
  })
    .applyOn(window.timer)
    .onChange(function(t) {
      document.querySelector('#hypno')
        .style.transform = 'scale(' + Math.sin(t.ticks % 6 - 3) * 2.0 + ')';
    });
  
  window.timer.start();
}




