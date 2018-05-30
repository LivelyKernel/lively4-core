export default class MpmAnimation {
  constructor() {
    this.particles = [];
    this.animating = false;
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

  get running() {
    return this.animating;
  }
}