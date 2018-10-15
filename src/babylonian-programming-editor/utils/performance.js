class Performance {
  
  constructor() {
    self.BabylonianPerformance = this;
    this.reset();
  }
  
  reset() {
    this.steps = {};
    this.lastTime = null;
    this.curStep = null;
  }
  
  step(stepName) {
    // Log old step if there was one
    if(this.curStep) {
      // Get duration
      const duration = this.duration();

      // Push current duration
      this.steps[this.curStep].push(duration);
    }
    
    // Add next step
    this.curStep = stepName
    if(!(this.curStep in this.steps)) {
      this.steps[this.curStep] = [];
    }
    
    // Start timer
    this.lastTime = this.now();
  }
  
  stop() {
    // Get duration
    const duration = this.duration();
    
    if(!this.curStep) {
      return;
    }
    
    // Push current duration
    this.steps[this.curStep].push(duration);
    
    this.curStep = null;
  }
  
  duration() {
    return this.now() - this.lastTime;
  }
  
  now() {
    return performance.now();
  }
  
}

// Only export as Singleton
export default new Performance();