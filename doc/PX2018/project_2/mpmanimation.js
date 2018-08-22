export default class MpmAnimation {
  constructor() {
    this._particles = [];
    this.animating = false;
  }
  
  get particles() {
    return this._particles;
  }
  
  set particles(value) {
    return this._particles = value;
  }
  
  stopAnimating() {
    this.animating = false;
  }
  
  startAnimating(caller) {
    this.animating = true; 
    this.animate(caller)
  }
  
  animate(caller) {
    this.calculate(caller);
    caller.draw(this.particles);
    
    if (this.animating) {
      window.requestAnimationFrame(this.animate.bind(this, caller));  
    }
  }

  step(caller) {
    this.calculate(caller);
    caller.draw(this.particles);
  }
  
  get running() {
    return this.animating;
  }
}