import Morph from './Morph.js';
import {pt}  from 'src/client/graphics.js'


const a = -1

export default class LivelyBall extends Morph {
  async initialize() {
    this.v = 0
    this.s = 400
    this.step()
    this.path = []
  }
  
  simulate(t) {
    this.v = this.v + a * t
    this.s = this.s + this.v * t
    if (this.s < 0) {
      this.s = 0
      this.v = this.v * -0.8;
    }
  }

  render(t) {
    if (!this.parentElement) return;
    var p = pt(20, lively.getExtent(this.parentElement).y - this.s - lively.getExtent(this).y)
    lively.setPosition(this, p)  
    p.x  = (this.lastTime - this.startTime) * 0.01    
    this.path.push(p)
    var svg = lively.createPath(this.path, "blue", false)
    svg.id = "plot"
    var plot = this.parentElement.querySelector("#plot")
    if (plot) plot.remove()
    this.parentElement.appendChild(svg)
      
    var log = this.parentElement.querySelector("#log")
    if (log) log.innerHTML = " s= " + this.s + "<br>" + " v= " + this.v
  }
  
  step() {
    var time = Date.now()
    if (this.lastTime) {
      var t = (time - this.lastTime) * 0.01
      this.simulate(t)
      this.render()
    } else {
      this.startTime = time 
    }
    window.requestAnimationFrame(() => this.step()); 
    this.lastTime = time
  }
  
  livelyExample() {
    lively.setExtent(this, pt(30,30)) 
    
    var div = document.createElement("div")
    div.id = "log"
    this.parentElement.appendChild(div)
  }
  
}