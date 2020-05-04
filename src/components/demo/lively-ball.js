import Morph from 'src/components/widgets/lively-morph.js';
import {pt}  from 'src/client/graphics.js'


export default class LivelyBall extends Morph {
  
  async initialize() {
    this.a = this.a || -1
    this.v = this.b || 0
    this.s = this.s || 300
    this.step()
    this.path = this.path || []
  }
  
  simulate(t) {
    this.v = this.v + this.a * t
    this.s = this.s + this.v * t
    if (this.s < 0) {
      this.s = 0
      this.v = this.v * -0.9;
    }   
  }
 

  render(t) {
    // console.log("A")
    var p = pt(20, lively.getExtent(this.parentElement).y - this.s - lively.getExtent(this).y)
    lively.setPosition(this, p)  
    p.x  = (this.lastTime - this.startTime) * 0.01    
    this.path.push(p)
  }
  
  step() {
    if (!lively.isInBody(this)) return;
    // console.log("B")
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
  
  
  // LivelyBall.livelyExample(document.body)
  static async livelyExample(parent) {
    var container = document.createElement("div");
    container.style.position = "absolute"
    container.style.backgroundColor = "lightgray"
    // container.innerHTML = "<button id='reset'>reset</button>"
    lively.setExtent(container, pt(150,400))
    var ball = this.create()
    await lively.components.openIn(container, ball)
    ball.livelyExample()
    // container.querySelector("#reset").addEventListener("click", () => { 
    //   ball.s = 200;
    //   ball.v = 0;
    //   ball.path = [];
    //   ball.livelyExample()
    // })
    if (parent) parent.appendChild(container)
    return container
  }
  
  static create(){
    return document.createElement("lively-ball")
  }
  
  livelyExample() {
    lively.setExtent(this, pt(30,30)) 
    
    var div = document.createElement("div")
    div.id = "log"
    this.parentElement.appendChild(div)
  }
  
  livelyMigrate(other) {
    this.a = other.a
    this.s = other.s
    this.v = other.v
    
  }
  
}