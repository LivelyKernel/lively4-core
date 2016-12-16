
import Morph from './Morph.js';


export default class LivelyDrawboard extends Morph {
      
  get colours() {
    return ['red', 'green', 'blue', 'yellow', 'black'];
  }
  
  getOffset(obj) {
    return  obj.getBoundingClientRect()
  } 
  
  initialize() {
    this.lastPath = new Object();
    this.lastPt = new Object();

    this.svg = this.get("#svg");
    this.canvas = this.get("#canvas");
    this.ctx = this.canvas.getContext("2d");
    
    lively.addEventListener("drawboard", this.canvas, "pointerdown", 
      (e) => this.onPointerDown(e));

    lively.addEventListener("drawboard", this.canvas, "pointerup", 
      (e) => this.onPointerUp(e));
  }

  onPointerDown(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    var id = evt.pointerId;   
    this.offset  = this.getOffset(this.canvas);
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", "red");
    path.setAttribute("stroke-width", 3);        
    path.setAttribute("fill", "none");        
    this.lastPath[id] = path;
    var x = evt.pageX - this.offset.left;
    var y = evt.pageY - this.offset.top;
    this.lastPt[id] = {x: x, y: y} // for canvas

    path.setAttribute("d", "M "+ x +" " + y)
    path.points = []
    this.svg.appendChild(path)


    lively.addEventListener("drawboard", this.canvas, "pointermove", (e) => this.onPointerMove(e), false);
  }  
  
  // Event handler called for each pointerdown event:
  onPointerMove(evt) {

    var id = evt.pointerId;   
    var path = this.lastPath[id];
    
    var x = evt.pageX - this.offset.left;
    var y = evt.pageY - this.offset.top;
    
    var lastPt = this.lastPt[id];
    this.ctx.beginPath();
    this.ctx.moveTo(lastPt.x, lastPt.y);
    this.ctx.lineTo(x, y);
    this.ctx.strokeStyle = this.colours[id%this.colours.length];
    this.ctx.lineWidth=1; 
    this.ctx.stroke();
    var p = {x:x, y:y}
    path.points.push(p)
    this.lastPt[id] = p;
  }

  onPointerUp(evt) {
    var id = evt.pointerId;


    var path = this.lastPath[id];
    path.setAttribute("d", path.getAttribute("d") + 
    path.points.map( ea => " L "+ ea.x +" " + ea.y ).join(""))

    lively.removeEventListener("drawboard", this.canvas, "pointermove")    

    delete this.lastPt[id];
    delete this.lastPath[id];
  }
}
      

     
      