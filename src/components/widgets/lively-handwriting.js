
import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js';

/*MD 

# HandWriting 

## Based on Tom's Smalltalk Grafiti Implementation 

![](lively-handwriting.png){width="50%"}

## Idea: 

- (1) Convert Strokes to a String of Directions
- (2) User Regular Expressions to match Characters

 
MD*/

export default class LivelyHandwriting extends Morph {
  async initialize() {
    this.windowTitle = "LivelyHandwriting";
    this.registerButtons()

    // lively.html.registerKeys(this); // automatically installs handler for some methods

    // lively.addEventListener("livelyhandwriting", this, "pointerdown", evt => this.onMouseDown(evt))
    this.addEventListener("pointerdown", evt => this.onMouseDown(evt), true)
    
    this.extent = lively.pt(400,200)
    this.recording = false;
    this.points = []
    this.text = ''

    // this.debugMode = true
    
    this.changed()
   // instanceVariableNames: 'points recording text'
  }

  set extent(extent) {
    lively.setExtent(this, extent)
    lively.setExtent(this.get("#content"), extent)
  }

  get extent() {
    return lively.getExtent(this)
  }

  get height() {
    return lively.getExtent(this).y
  }
  
  get width() {
    return lively.getExtent(this).x
  }
  
  get fontHeight() {
    return 50
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
  


  characterFromStrokes(aCollection, strokesWithDiagonals,  aPointCollection) {
     
    let seq = aCollection.map(ea => ea[0]).join(""); 
    let diag = strokesWithDiagonals.map(ea => ea[0]).join(""); 
    
    this.get("#log").textContent = "seq=" +seq + " diag=" + diag
    
    if(diag.match(/^C$/)) {return "\n"}
    if(diag.match(/^A$/)) {return "leftArrow"}
    if(diag.match(/^B$/)) {return "rightArrow"}
    
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
    if(seq.match(/^d$/)) {
      return this.inTextArea(aPointCollection) ? "I" : "1"
    }
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
      return this.inTextArea(aPointCollection) ? "T" : "7"

      // return (this.pointInUpper(aPointCollection.last, 0.6, aPointCollection)) ? "7" : "T"
    }
    if(seq.match(/^drud?$/)) {return "U"}
    if(seq.match(/^dur?$/)) {return "V"}
    if(seq.match(/^dr?u?dr?u$/)) {return "W"}
    if(seq.match(/^dlur?$/)) {return "X"}
    if(seq.match(/^dru?d?l?ur?$/)) {return "Y"}
    if(seq.match(/^rl?dl?d?r$/)) {
      return this.inTextArea(aPointCollection) ? "Z" : "2"
    }

    if(seq.match(/^u$/)) {
      this.shiftDown = !this.shiftDown;
      return "SHIFT"
    }
    // if(seq.match(/^u$/)) {return "1"}
    
    if(seq.match(/^rdlur$/)) {return "0"}
    if(seq.match(/^urdl?d?r$/)) {return "2"}
    if(seq.match(/^u?rdl?d?rdlu?$/)) {return "3"}
    if(seq.match(/^drdlu?$/)) {return "5"}
    if(seq.match(/^u?l?dr?d?lur?u?l?$/)) {return "8"}
    if(seq.match(/^ldrudl?u?r?$/)) {return "9"}

    return undefined
  }
  
//   directionFromTo(aPoint, anotherPoint) {
//     if (!aPoint || !anotherPoint) return
    
//     let sub = (aPoint.subPt(anotherPoint))
//     let delta = pt(Math.abs(sub.x), Math.abs(sub.y))
//     if (delta.x > delta.y) {
//       return (aPoint.x > anotherPoint.x) ? "left" : "right"
//     } else {
//       return (aPoint.y > anotherPoint.y) ? "up" : "down"
//     }
//   }
  
  
  directionFromTo(aPoint, anotherPoint, directions) {
    if (!directions) directions = ["left", "up", "right", "down"]
    
    if (!aPoint || !anotherPoint) return
    
    var directionAngle = 360 / directions.length
    let sub = (aPoint.subPt(anotherPoint))
    var angle = sub.theta() / (2*Math.PI) * 360
    if (angle < 0) angle = angle + 360
    
    var index = Math.round(angle / directionAngle)
    if ((index >= directions.length) || (index < 0)) index = 0
    var result = directions[index]
    
    return result
  }

  get alphaNumberSpaceRatio() {
    return 0.7
  }
   
  drawOn(canvas, scale=1) {
    var extent = lively.getExtent(this)
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "lightgray"
    ctx.fillRect(0, 0, scale * extent.x, scale * extent.y)

    ctx.fillStyle = "black"
    ctx.font = this.fontHeight + 'px arial';
    ctx.fillText(this.text, 0, this.fontHeight);
    
    var cursorStart = pt(ctx.measureText(this.text).width, 0)

    ctx.strokeStyle = "gray"
    ctx.lineWidth = "1px"
    ctx.beginPath();
    ctx.moveTo(this.width * this.alphaNumberSpaceRatio, scale * 0);
    ctx.lineTo(this.width * this.alphaNumberSpaceRatio, scale * 10);

    ctx.moveTo(this.width * this.alphaNumberSpaceRatio, scale * this.height);
    ctx.lineTo(this.width * this.alphaNumberSpaceRatio, scale * this.height - 10);

    ctx.stroke();
    
    ctx.strokeStyle = "red"
    ctx.lineWidth = "2px"
    ctx.beginPath();
    ctx.moveTo(cursorStart.x,  cursorStart.y);
    ctx.lineTo( cursorStart.x,  (cursorStart.y + this.fontHeight));
    ctx.stroke();
    
    
    for(let i=0; i < this.points.length - 1; i++) {
      let start = this.points[i]
      let end = this.points[i+1]
      let direction = this.directionFromTo(start,  end)
      
      ctx.fillStyle = "red"
      ctx.fillRect(scale * start.x - 1, scale * start.y - 1, 2, 2)
      
      ctx.lineWidth = "1px"
      ctx.strokeStyle = ({
          left: "red",
          right: "green",
          up: "blue",
          down: "gray"
      })[direction]
    
    ctx.beginPath();
    ctx.moveTo(scale * start.x, scale * start.y);
    ctx.lineTo(scale * end.x, scale *end.y);
    ctx.stroke();
    } 
  } 
  
  
  async changed() {
    
    if (this.shiftDown) {
      this.get("#mode").innerHTML = `<i class="fa fa-arrow-circle-o-up" aria-hidden="true"></i>`
    } else if (this.capslock) {
      this.get("#mode").innerHTML = `<i class="fa fa-arrow-circle-up" aria-hidden="true"></i>`
    } else {
      this.get("#mode").innerHTML = ""
    }
    
    let canvas = this.get("canvas")
    var extent = lively.getExtent(this)
    canvas.setAttribute("width",  extent.x)
    canvas.setAttribute("height", extent.y)

    canvas.style.width =  extent.x + "px"
    canvas.style.height =  extent.y + "px"
    this.drawOn(canvas)
    
    if (this.debugMode) {
      
      var debugCanvas = document.body.querySelector("#HandwritingDebug") 
      if (!debugCanvas) {
        debugCanvas = <canvas id="HandwritingDebug"></canvas>
        document.body.appendChild(debugCanvas)
      }
      
      var debugLog = document.body.querySelector("#HandwritingDebugLog") 
      if (!debugLog) {
        debugLog = await lively.openWorkspace()
        debugLog.parentElement.setAttribute("title", "Handwriting DebugLog")
        debugLog.id = "HandwritingDebugLog"
      }
      this._debugLog = debugLog

      const ctx = debugCanvas.getContext('2d');
        
      var scale = 3
     
      debugCanvas.width =  scale * extent.x 
      debugCanvas.height = scale * extent.y 
      debugCanvas.style.width =  scale * extent.x + "px"
      debugCanvas.style.height =   scale * extent.y + "px"
      
      this.drawOn(debugCanvas, scale)
      
      
    }
    
    
     
  }
  
  debugLog(s) {
    if (!this._debugLog) return;
    this._debugLog.value += s + "\n"
  }

  onMouseDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    
    lively.addEventListener("livelyhandwriting", document.body, "pointermove", evt => this.onMouseMove(evt))
    lively.addEventListener("livelyhandwriting", document.body, "pointerup", evt => this.onMouseUp(evt))
    
    
    this.recording = true
    this.points = []
    this.points.push(lively.getPosition(evt).subPt(lively.getClientPosition(this)))
    this.changed()
  }

  onMouseMove(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    
    
    if (!this.recording) return 
    var p = lively.getPosition(evt).subPt(lively.getClientPosition(this))
    // console.log("p", lively.getPosition(evt))
    this.points.push(p)
    this.changed()

  }

  isolateDirections(directions) {
   let strokes = []
    let currentDirection
    for(let i=0; i < this.points.length - 1; i++) {
      let from = this.points[i]
      let to = this.points[i+1]
      let direction = this.directionFromTo(from,  to, directions)
      if (direction != currentDirection) {
        strokes.push(direction)
        currentDirection = direction
      }
    }   
    return strokes
  }
  
  smoothingThresholdSquared() {
    var a = 20
    return a * a
  } 

//   angleThreshold() {
//     return 20
//   } 

//   thetaDEG(pointA, pointB) {
//     var thetaDiff =  (pointA.subPt(pointB)).theta() / (2 * Math.PI) * 360
//     return (thetaDiff + 180) % 360 - 180
//   }
  
  // #TOOD a more intelligent point thining seems not to be better
//   thinPoints(points) {
//     // #TODO maybe use inject?
//     let newPoints = []
//     let currentPoint = points[0]  
//     let smoothPoint = points[0]
//     newPoints.push(currentPoint) 
//     let lastTheta = 0 
//     for(let i=1; i < points.length - 1; i++) {
//       let point = points[i]
//       let theta =  this.thetaDEG(point, smoothPoint) 
//       let thetaDiff = (lastTheta - theta) 
            
//       // use angle and distance to thin point list
//       // ignore point
      
      
//       if (Math.abs(thetaDiff) > this.angleThreshold())  {

        
//         currentPoint = points[i-1]
//         lastTheta = this.thetaDEG(point, currentPoint) 
//         newPoints.push(currentPoint)   
        
//       } 
      
//       if ((currentPoint.distSquared(point) < this.smoothingThresholdSquared())) {
        
//         smoothPoint = point
//       }
//       console.log("theta ", theta,lastTheta,  thetaDiff )
//     }
//     newPoints.push(points.last)
//     return  newPoints
//   }

  thinPoints(points) {
    let newPoints = []
    let currentPoint = points[0]  
    newPoints.push(currentPoint) 
    let lastTheta
    for(let i=1; i < points.length; i++) {
      let point = points[i]
      let theta = (currentPoint.subPt(point)).theta
      // use angle and distance to thin point list
      if (currentPoint.distSquared(point) < this.smoothingThresholdSquared()) {
        // ignore point
      } else {
        currentPoint = point
        lastTheta = theta
        newPoints.push(currentPoint)
      }

    }
    return  newPoints
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
      
    var originalPoints = this.points
    this.points = this.thinPoints(this.points)
  
    let strokes = this.isolateDirections()
    let strokesWithDiagonals = this.isolateDirections(["left", "A", "up", "B", "right", "D", "down", "C"])
    
    let character = this.characterFromStrokes(strokes, strokesWithDiagonals, this.points)
    if (character) {
      
      if (character.length > 1) { // control symbols
        if (character == "SHIFT") {
          if (this.capslock) {
            this.capslock =  false
            this.shiftDown = false
          } else {
            if (this.lastCharacter == "SHIFT") {
              this.capslock = true  
            } else {
              this.shiftDown = true
            }
          }
          
        } 
      
      } else {
        if (this.shiftDown || this.capslock) {
          character = character.toUpperCase()
          this.shiftDown = false
        } else {
          character = character.toLowerCase()
        }

        if (character == '\b') {
          this.text = this.text.slice(0, this.text.length - 1)
        }  else {
          this.text += character
        }        
      }
      this.applyCharacter(character)  
      this.lastCharacter = character
    }
    this.changed()
    if (this.debugMode) {
      this.debugLog(JSON.stringify({
        character: character,
        points: this.points,
        rawPoints: originalPoints,
        strokes: strokes,
        strokesWithDiagonals: strokesWithDiagonals
      }, undefined, 0))
    }
  }
  
  applyCharacter(char) {
    var activeElement = this.target //  || lively.activeElement(document, "lively-code-mirror")
    if (activeElement && activeElement.localName == "lively-code-mirror") {
      activeElement.fake(char)
    }
  }

  inTextArea(aPointCollection) {
    return aPointCollection.last.x < (this.width * this.alphaNumberSpaceRatio)
  }  
  
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

  
}