

export default class DelayedCall {

  constructor() {
    this.delay = 500;
    this.freq = 100;
  }  
        
  call(cb) {
    if (!this.lastDelayedCallTime)  {
      this.lastDelayedCallTime = Date.now()
      this.checkForDelayedCall(cb)
    } else {
      this.lastDelayedCallTime = Date.now()
    }
  }
  
  checkForDelayedCall(cb) {
    if (Date.now() - this.lastDelayedCallTime > this.delay) {
       delete this.lastDelayedCallTime
      cb()
    } else {
      setTimeout(() => this.checkForDelayedCall(cb), this.freq)
    }
  }
}