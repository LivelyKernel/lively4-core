import Morph from './Morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import CommandHistory  from "src/client/command-history.js";

import paper from "src/external/paperjs/paper-core.js";


window.paper = paper 

export default class LivelyDrawboard extends Morph {
      
  getOffset(obj) {
    return  obj.getBoundingClientRect()
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
    
      
    this.color = "black"
    
    this.updateCanvasExtent()
    this.observeHTMLChanges()
   
   
    this.strokes = new CommandHistory();

    
  }
  
  attachedCallback() {
    setTimeout(() => {
      this.updateCanvasExtent()  
    }, 1000)
  }
  
  onSizeChanged() {
    this.updateCanvasExtent()
  }
  
  updateCanvasExtent() {
    var bounds = this.getBoundingClientRect()
    this.canvas.style.width = bounds.width + "px"
    this.canvas.setAttribute("width", bounds.width + "px")
    this.canvas.style.height = bounds.height + "px"
    this.canvas.setAttribute("height", bounds.height + "px")
  
    this.svg.style.width = bounds.width + "px"
    this.svg.style.height = bounds.height + "px"

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
    if ((evt.pointerType == "mouse" && evt.button == 2) || ContextMenu.visible()) {
      // context menu
      return;
    }
    
    
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
      path.setAttribute("stroke-width", 1.3);        
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
      this.ctx.lineWidth=1; 
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
  
  
  
  livelyMigrate(other) {

  }
  
}
      

     
      