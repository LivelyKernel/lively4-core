
import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js';

/*MD 

# HandWriting 

## Based on Tom's Smalltalk Grafiti Implementation 

## Idea: 

- (1) Convert Strokes to a String of Directions
- (2) User Regular Expressions to match Characters

MD*/


export default class LivelyHandwriting extends Morph {
  async initialize() {
    this.windowTitle = "LivelyHandwriting";
    this.registerButtons()

     lively.html.registerKeys(this); // automatically installs handler for some methods

    // lively.addEventListener("livelyhandwriting", this, "pointerdown", evt => this.onMouseDown(evt))
    this.addEventListener("pointerdown", evt => this.onMouseDown(evt), true)
    
	
    this.recording = false;
    this.points = []
    this.text = ''
	
    lively.setExtent(this, lively.pt(1000,300))
    this.changed()
   // instanceVariableNames: 'points recording text'
  }

  get height() {
    return lively.getExtent(this).y
  }
  
  get fontHeight() {
    return 100
  }
  
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onFirstButton() {
    lively.notify("hello")
  }

  
  async livelyExample() {
 
  }
  


  characterFromStrokes(aCollection, aPointCollection) {
     
    let seq = aCollection.map(ea => ea[0]).join(""); 
    
    this.get("#log").textContent = "seq=" +seq
    
    if(seq.match(/^r$/)) {return " "}
    if(seq.match(/^l$/)) {return "\b"}

    if(seq.match(/^ur?dl?r?$/)) {return "A"}
    if(seq.match(/^durdl?rd?l$/)) {return "B"}
    if(seq.match(/^u?ldru?$/)) {return "C"}
    if(seq.match(/^dur?dl$/)) {
      return this.pointInUpper(aPointCollection.last, 0.7, aPointCollection) ? "P" : "D"
    }
    if(seq.match(/^ld?r?l?d?r$/)) {return "E"}
    if(seq.match(/^lr?d$/)) {return "F"}
    if(seq.match(/^l?drul?rd?$/)) {
      return this.pointInUpper(aPointCollection.last, 0.2, aPointCollection) ? "Q" : "G"
    }
    if(seq.match(/^dr?u?r?d$/)) {return "H"}
    if(seq.match(/^d$/)) {return "I"}
    if(seq.match(/^dl$/)) {return "J"}
    if(seq.match(/^l?dlurdr?$/)) {return "K"}
    if(seq.match(/^dr$/)) {
      return (aPointCollection.last.y > (this.height * 0.6)) ? "L" : "4" // potentially wonky, maybe relative? 
    }
    if(seq.match(/^ur?dr?u?r?d$/)) {return "M"}
    if(seq.match(/^ur?dr?u$/)) {return "N"}
    
    if(seq.match(/^l?drul$/)) {
      return (this.pointInUpper(aPointCollection.last, 0.3, aPointCollection)) ? "O" : "6"
    }

    if(seq.match(/^dur?dl?d?r?$/)) {return "R"}
    // disambiguate against 8 by checking that we ended in a low area
    if(seq.match(/^ld?r?d?lu?r?$/) && !(this.pointInUpper(aPointCollection.last, 0.3, aPointCollection))) {
      return "S"
    }
    if(seq.match(/^rd$/)) {
      return (this.pointInUpper(aPointCollection.last, 0.6, aPointCollection)) ? "7" : "T"
    }
    if(seq.match(/^drud?$/)) {return "U"}
    if(seq.match(/^dur?$/)) {return "V"}
    if(seq.match(/^dr?u?dr?u$/)) {return "W"}
    if(seq.match(/^dlur?$/)) {return "X"}
    if(seq.match(/^dru?d?l?ur?$/)) {return "Y"}
    if(seq.match(/^rl?dl?d?r$/)) {return "Z"}

    if(seq.match(/^rdlur$/)) {return "0"}
    if(seq.match(/^u$/)) {return "1"}
    if(seq.match(/^urdl?d?r$/)) {return "2"}
    if(seq.match(/^u?rdl?d?rdlu?$/)) {return "3"}
    if(seq.match(/^drdlu?$/)) {return "5"}
    if(seq.match(/^u?l?dr?d?lur?u?l?$/)) {return "8"}
    if(seq.match(/^ldrudl?u?r?$/)) {return "9"}

    return undefined
  }
  
  directionFromTo(aPoint, anotherPoint) {
    if (!aPoint || !anotherPoint) return
    
    let sub = (aPoint.subPt(anotherPoint))
    let delta = pt(Math.abs(sub.x), Math.abs(sub.y))
    if (delta.x > delta.y) {
      return (aPoint.x > anotherPoint.x) ? "left" : "right"
    } else {
      return (aPoint.y > anotherPoint.y) ? "up" : "down"
    }
  }

       
  changed() {
    var fontHeight = this.fontHeight;
    
    let canvas = this.get("canvas")
    var extent = lively.getExtent(this)
    canvas.setAttribute("width",  extent.x)
    canvas.setAttribute("height", extent.y)

    canvas.style.width =  extent.x + "px"
    canvas.style.height =  extent.y + "px"
    
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "lightgray"
    ctx.fillRect(0, 0,extent.x, extent.y)

    ctx.fillStyle = "black"
    ctx.font = fontHeight + 'px arial';
    ctx.fillText(this.text, 0, fontHeight);
    
    var cursorStart = pt(ctx.measureText(this.text).width, 0)
    
    ctx.strokeStyle = "red"
    ctx.lineWidth = "2px"
    ctx.beginPath();
    ctx.moveTo(cursorStart.x, cursorStart.y);
    ctx.lineTo(cursorStart.x, cursorStart.y + fontHeight);
    ctx.stroke();
    
    
    for(let i=0; i < this.points.length - 1; i++) {
      let start = this.points[i]
      let end = this.points[i+1]
      let direction = this.directionFromTo(start,  end)
      
      ctx.fillStyle = "red"
      ctx.fillRect(start.x - 3, start.y - 3, 6, 6)
      
      ctx.lineWidth = "2px"
      ctx.strokeStyle = ({
          left: "red",
          right: "green",
          up: "blue",
          down: "gray"
      })[direction]
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    }  
  }


  onMouseDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    
    lively.addEventListener("livelyhandwriting", document.body, "pointermove", evt => this.onMouseMove(evt))
    lively.addEventListener("livelyhandwriting", document.body, "pointerup", evt => this.onMouseUp(evt))
    
    
    this.recording = true
    this.points = []
    this.points.push(lively.getPosition(evt).subPt(lively.getGlobalPosition(this)))
    this.changed()
  }

  onMouseMove(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    
    
    if (!this.recording) return 
    var p = lively.getPosition(evt).subPt(lively.getGlobalPosition(this))
    // console.log("p", lively.getPosition(evt))
    this.points.push(p)
    this.changed()

  }


  onMouseUp(evt) {
    evt.stopPropagation()
    evt.preventDefault()
   
    
    lively.removeEventListener("livelyhandwriting", document.body)

    this.recording = false;
    if(this.points.length == 1) {
      this.text = ''
      this.changed()
      return
    } 
      
    " thin "
    // #TODO maybe use inject?
    let newPoints = []
    let currentPoint = this.points[0]  
    newPoints.push(currentPoint)    
    for(let i=1; i < this.points.length; i++) {
      let point = this.points[i]
      if (currentPoint.distSquared(point) > this.smoothingThresholdSquared()) {
        currentPoint = point
        newPoints.push(currentPoint)
      }
    }
    this.points = newPoints
          
    " isolate directions "
    let strokes = []
    let currentDirection
    for(let i=0; i < this.points.length - 1; i++) {
      let from = this.points[i]
      let to = this.points[i+1]
      let direction = this.directionFromTo(from,  to)
      if (direction != currentDirection) {
        strokes.push(direction)
        currentDirection = direction
      }
    }   

    let character = this.characterFromStrokes(strokes, this.points)
    if (character) {
      if (character == '\b') {
        this.text = this.text.slice(0, this.text.length - 1)
      }  else {
        this.text += character
      }
      this.changed()
    }
  }

/*
point: aPoint inLeft: aNumber of: aCollection

	| rangeX refX |
	rangeX := aCollection inject: (9e8 to: 0) into: [:interval :point | | ret |
		ret := interval.
		point x < ret start ifTrue: [ret := point x to: ret stop].
		point x > ret stop ifTrue: [ret := ret start to: point x].
		ret].
	
	refX := aPoint x - rangeX start.
	^ (refX / rangeX extent) < aNumber! !

*/
  
  
  pointInLeft(aPoint, aNumber, aCollection) {
    var start = 9e8
    var stop = 0
    for (var point of aCollection) {
      if (point.x < start) { start = point.x }
      if (point.x > stop) { stop = point.x }
    }
    
    let refX= aPoint.x - start;
    return (refX / Math.abs(start - stop)) < aNumber
  }

  pointInUpper(aPoint, aNumber, aCollection) {

    var start = 9e8
    var stop = 0
    for (var point of aCollection) {
      if (point.y < start) {start = point.y}
      if (point.y > stop) { stop = point.y}
    }
    
    let refY = aPoint.y - start;
    return (refY / Math.abs(start - stop)) < aNumber
  }

  smoothingThresholdSquared() {
    return 200
  } 
}