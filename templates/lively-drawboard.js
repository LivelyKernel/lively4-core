import Morph from './Morph.js';

import ContextMenu from 'src/client/contextmenu.js';
import CommandHistory  from "src/client/command-history.js";

import paper from "src/external/paperjs/paper-core.js";


import {pt} from "src/client/graphics.js"

window.paper = paper 

export default class LivelyDrawboard extends Morph {
  
  
  // Lively Window API
  get isWindow() {
    return this.parentElement && !this.parentElement.isWindow
  }
  
  isMinimized() {
    return false
  }
  
  getOffset(obj) {
    return  obj.getBoundingClientRect()
  } 
  
  get color() {
    return this.getAttribute("color")
  }
  
  set color(value) {
    this.setAttribute("color", value)
  }
  
  get penSize() {
    return this.getAttribute("pen-size")
  }
  
  set penSize(value) {
    this.setAttribute("pen-size", value)
  }
  
  get background() {
    return this.style.backgroundColor
  }
  
  set background(value) {
    this.style.backgroundColor = value
  }
  
  get canvas() {
    return this.get("#canvas");
  }
  
  get svg() {
    return this.get("#svg");
  }
  
  get paper() {
    if (!this._paper) {
      paper.setup(document.createElement("canvas"))
      this._paper = paper
    }
    return this._paper
  }
  
  initialize() {
    this.lastPath = new Object();
    this.lastPt = new Object();

    var svg = this.get("#svg");
    if (!svg) {
      svg =  document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "svg"
      svg.style = `position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
        border: none;
        opacity: 1;
        touch-action: none;`
      this.appendChild(svg)
    }
  

    
    this.ctx = this.canvas.getContext("2d");
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);


    lively.addEventListener("drawboard", this.canvas, "pointerdown", 
      (e) => this.onPointerDown(e));
    lively.addEventListener("drawboard", this.canvas, "pointerup", 
      (e) => this.onPointerUp(e));
    lively.addEventListener("drawboard", this, "size-changed", 
      (e) => this.onSizeChanged(e));
    lively.addEventListener("drawboard", this, "focus", 
      (e) => this.onFocus(e));
    lively.addEventListener("drawboard", this, "blur", 
      (e) => this.onBlur(e));
    lively.addEventListener("drawboard", this.get('#backgroundColor'), "value-changed", 
      (e) => this.onBackgroundColor(e.detail.value));  
    lively.addEventListener("drawboard", this.get('#penColor'), "value-changed", 
      (e) => this.onPenColor(e.detail.value));  
    lively.addEventListener("drawboard", this.get('#penSize'), "value-changed", 
      (e) => this.onPenSize(e.detail.value));  

    
    this.get('#controls').draggable = true
    lively.addEventListener("drawboard", this.get('#controls'), "dragstart", 
      (e) => this.onDragStart(e));  
    lively.addEventListener("dragboard", this.get('#controls'), "drag", 
      (e) => this.onDrag(e));  
    lively.addEventListener("dragboard", this.get('#controls'), "dragend", 
      (e) => this.onDragEnd(e));  


    
    this.color = "black"
    
    this.updateCanvasExtent()
    this.observeHTMLChanges()
   
    this.get("#backgroundColor").value = this.background
    this.get("#penColor").value = this.color
   this.get("#penSize").value = this.penSize
   
    this.strokes = new CommandHistory();
    lively.html.registerButtons(this)
    
    this.setAttribute("tabindex", 0)
  }
  
  attachedCallback() {
    if (this.parentElement.isWindow) {
      this.fixedControls = true 
      this.get("#controls").hidden =false 
    } else {
      this.fixedControls = false 
      this.get("#controls").hidden = true 
    }
    setTimeout(() => {
       this.updateCanvasExtent()  
    }, 1000)
  }
  
  onSizeChanged() {
    this.updateCanvasExtent()
  }
  
  updateCanvasExtent() {
    var offsetY = 0;
    var offsetX = 0;
    if (this.fixedControls) {
      offsetY = 30
      this.get("#controls").style.top = "0px"
    } else {
      this.get("#controls").style.top = "-28px"
    }
    
    var bounds = this.getBoundingClientRect()
    var width = (bounds.width - offsetX) + "px"
    var height = (bounds.height - offsetY) + "px"
    if (this.canvas) {
      lively.setPosition(this.canvas, pt(offsetX, offsetY))
      this.canvas.style.width = width
      this.canvas.setAttribute("width", width)
      this.canvas.style.height = height
      this.canvas.setAttribute("height", height)
    }
    if (this.svg) {
      lively.setPosition(this.svg, pt(offsetX, offsetY))
      this.svg.style.width = width
      this.svg.style.height = height
    }
  }
  
  observeHTMLChanges() {
    if (this.mutationObserver) this.mutationObserver.disconnect()
    this.mutationObserver = new MutationObserver((mutations, observer) => {
        mutations.forEach(record => {
          if (record.target == this) {
            this.onSizeChanged()
          }
        })
    });
    this.mutationObserver.observe(this, {
      childList: false, 
      subtree: false, 
      characterData: false, 
      attributes: true});
  }


  onPointerDown(evt) {
    var isFocused = document.activeElement == this
    if (!isFocused) {
      this.style['z-index'] = 200
      return this.focus()
    }
    
    if ((evt.pointerType == "mouse" && evt.button == 2) 
        || evt.ctrlKey 
        || ContextMenu.visible()) {
      // context menu
      return;
    }
    console.log("pointer down " + evt.button)
    // window.eventRecorder = []
    window.eventRecorder && window.eventRecorder.push(evt)
    
    evt.stopPropagation();
    evt.preventDefault();
    var id = evt.pointerId;   
    this.offset  = this.getOffset(this.canvas);
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", this.color);
    path.setAttribute("stroke-width", 2);        
    path.setAttribute("fill", "none");        
    
    
    if ((evt.pointerType == "pen" && evt.button == 2)
      || evt.altKey ) {
      path.command = "delete";
      path.setAttribute("stroke", "red");
      path.setAttribute("stroke-width", 4);        
    } else {
      path.setAttribute("stroke", this.color);
      path.setAttribute("stroke-width", this.penSize);        
    }
    
    
    this.lastPath[id] = path;
    var x = evt.clientX - this.offset.left;
    var y = evt.clientY - this.offset.top;
    
    this.lastPt[id] = {x: x, y: y} // for canvas

    path.setAttribute("d", "M "+ x +" " + y)
    path.points = []
    this.get("#svg").appendChild(path)


    lively.addEventListener("drawboard", this.canvas, "pointermove", (e) => this.onPointerMove(e), false);
  }  
  
  // Event handler called for each pointerdown event:
  onPointerMove(evt) {

    var id = evt.pointerId;   
    var path = this.lastPath[id];
    
    if (!path) return
    
    
    var x = evt.clientX - this.offset.left;
    var y = evt.clientY - this.offset.top;
    
    var lastPt = this.lastPt[id];
    this.ctx.beginPath();
    this.ctx.moveTo(lastPt.x, lastPt.y);
    this.ctx.lineTo(x, y);
    if (path.command == "delete") {
      this.ctx.strokeStyle = "red"
      this.ctx.lineWidth=5; 
    
    } else {
      this.ctx.strokeStyle = this.color
      this.ctx.lineWidth = this.penSize; 
    }
    this.ctx.stroke();
    var p = {x:x, y:y}
    path.points.push(p)
    this.lastPt[id] = p;
  }
  
  

  onPointerUp(evt) {
    var id = evt.pointerId;
    var path = this.lastPath[id];
    if (!path) return;
    
    if (path.points.length == 0) {
     var x = evt.clientX - this.offset.left;
     var y = evt.clientY - this.offset.top;
     // ensure a visible stroke if no pointer was not moved
     path.points.push({x: x + 1, y: y + 1})
    }
    
    path.setAttribute("d", path.getAttribute("d") + 
      path.points.map( ea => " L "+ ea.x +" " + ea.y ).join(""))
  


    lively.removeEventListener("drawboard", this.canvas, "pointermove")    

    delete this.lastPt[id];
    delete this.lastPath[id];
    debugger
    var paperPath =  new this.paper.Path(path.getAttribute("d"))
    
    if (path.command == "delete") {
        lively.array(this.get("#svg").querySelectorAll("path"))
          .filter( ea => {
            var eaPath = new paper.Path(ea.getAttribute("d"))
          
            try { 
              return eaPath.intersects(paperPath);  
            } catch(e) { return false}
          })
          .forEach( ea => {
            var command = {
              type: "delete",
              stroke: ea,
              container: this.get("#svg"),
              execute: function(){
                this.stroke.remove();
              },
              unexecute: function(){
                this.container.addChild(this.stroke);
              }
            };
            this.strokes.addCommand(command);
            command.execute();
          });
        path.remove();
    } else {
      this.simplifyPath(path)
      
    
      var command = {
        type: "stroke",
        stroke: path,
        container: this.get("#svg"),
        execute: function() {
          this.container.appendChild(this.stroke);
        },
        unexecute: function(){
          this.stroke.remove();
        }
      }
      this.strokes.addCommand(command)
    }    
    this.clearTempCanvas()
  }
  
  simplifyPath(path) {
    this.paper.project.activeLayer.removeChildren();
    this.paper.project.importSVG(path)
    var paperPath = paper.project.getItems({class: paper.Path})[0]
    paperPath.simplify(1)
    var paperSVG = paper.project.exportSVG()
    var paperSVGPath = paperSVG.querySelector("path")
    path.setAttribute("d", paperSVGPath.getAttribute("d"))
  }
  
  clearTempCanvas() {
    // Store the current transformation matrix
    this.ctx.save();
    
    // Use the identity matrix while clearing the canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Restore the transform
    this.ctx.restore();
  }
  
  clear() {
    this.get("#svg").innerHTML = ""
  }
  
  undoStroke() {
    this.strokes.undo();
  }

  redoStroke() {
    this.strokes.redo();
  }
  
  onUndoStroke() {
    this.undoStroke();
  }
  
  onRedoStroke() {
    this.redoStroke();
  }
  
  onContextMenu(evt) {
    // if (this.lastPointerUp && (this.lastPointerUp - Date.now() < 1000)) {
    //     evt.stopPropagation();
    //     evt.preventDefault();
    //     return; // #HACK custom prevent default....
    //   }
      
      if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();

        var menu = new ContextMenu(this, [
              ["clear", () => this.clear()],
              ["undo stroke", () => this.undoStroke()],
              ["redo stroke", () => this.redoStroke()],
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }

  }
  
  onFocus() {
    if (!this.fixedControls)
      this.get("#controls").hidden = false
  }
  
  onBlur() {
    if (!this.fixedControls)
      this.get("#controls").hidden = true
  }
  
  onBackgroundColor(color) {
    this.style.backgroundColor = color
  }
  
  onPenColor(color) {
    this.color = color
  }
  
  onPenSize(size) {
    this.penSize = size
  }
  
  async onClose() {
    if (await lively.confirm("Remove drawing?")) {
      this.remove()
    }
  }
  
  onDragStart(evt) {
    this.dragOffset = lively.getPosition(this).subPt(pt(evt.clientX, evt.clientY))

    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
    evt.stopPropagation(); 
  }
  
  onDrag(evt) {
    if (evt.clientX == 0) return // #Issue bug in browser? Ignore garbage event
    var pos = pt(evt.clientX, evt.clientY)
    lively.setPosition(this, pos.addPt(this.dragOffset))
  }
  
  onDragEnd() {
    
  }
  
  
  livelyMigrate(other) {

  }
  
}
      

     
      