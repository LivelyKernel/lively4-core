
import Ball from "./lively-ball.js"


export default class SoapBubble extends Ball {
  initialize() {
    lively.setExtent(this, pt(30,30)) 
    super.initialize()
    this.a = this.a || -0.003
    this.total = this.total || 0
    lively.addEventListener("soap", this, "click", evt => this.onClick(evt))
  }

  onClick() {
    this.remove()
  }  
  
  simulate(t) {
    super.simulate(t);
    this.total += t;
    if (this.s < 10) this.remove();
  }
  
  static create(){
    return document.createElement("lively-soapbubble")
  }

  
  async livelyExample() {
    
    for(var i=0; i<3;i++) {
      var bubble = document.createElement("lively-soapbubble")
      await lively.components.openIn(this.parentElement, bubble)
      bubble.a  = Math.random() * -1.0
      bubble.s  = Math.random() * 300.0  
    }
  }
  
  livelyMigrate(other) {
    super.livelyMigrate(other)
    this.total = other.total
  }
  
}