import Morph from './Morph.js';
import paper from "src/external/paperjs/paper-core.js"

import ContextMenu from 'src/client/contextmenu.js';


let Path = paper.Path,
	Point = paper.Point;


export default class LivelyPaper extends Morph {
      
  get colours() {
    return ['red', 'green', 'blue', 'yellow', 'black'];
  }
  
  getOffset(obj) {
    return  obj.getBoundingClientRect()
  } 
  
  initPaper() {
    if (this.paper) return this.paper;
    this.canvas = this.get("#canvas");
    paper.setup(this.canvas);
    this.paper = paper
    
  }
  
  initialize() {
    this.lastPath = new Object();
    
    this.initPaper()

    lively.addEventListener("drawboard", this.canvas, "pointerdown", 
      (e) => this.onPointerDown(e));

    lively.addEventListener("drawboard", this.canvas, "pointerup", 
      (e) => this.onPointerUp(e));
      
    this.load()
    this.strokes = []
    this.undoIndex = null
    
    lively.html.registerButtons(this)
    
    this.addEventListener('contextmenu', (evt) => {
      if (this.lastPointerUp && (this.lastPointerUp - Date.now() < 1000)) {
        evt.stopPropagation()
        evt.preventDefault()
        return // #HACK custom prevent default....
      }
      
      if (!evt.shiftKey) {
        evt.stopPropagation()
        evt.preventDefault()

        var menu = new ContextMenu(this, [
              ["clear", () => this.clear()],
              ["undo stroke", () => this.undoStroke()],
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
    }, false);
  }
  
  load() {
    // #TODO we know that the state of the svg might diverge frome the state of paper
    var svg = this.querySelector("svg")
    if (svg) {
      this.paper.project.importSVG(svg);
    }
  }

  clear() {
    this.paper.project.clear()
    this.save()
  }
  
  undoStroke() {
    if (this.undoIndex == undefined) {
      this.undoIndex = this.strokes.length;
    }
    this.undoIndex = Math.max(0, this.undoIndex - 1); 
    var lastStroke = this.strokes[this.undoIndex]
    if(lastStroke) { 
      if (lastStroke.type == "stroke") {
        lastStroke.path.remove()
      } else if (lastStroke.type == "delete") {
        this.paper.project.activeLayer.addChild(lastStroke.path)
      }
    }
    this.save()
  }
  
  
  
  
  redoStroke() {
    if (this.undoIndex == undefined) {
      return;
    }
    var lastStroke = this.strokes[this.undoIndex]
    this.undoIndex = Math.min(this.strokes.length, this.undoIndex + 1); 

    if(lastStroke) { 
      if (lastStroke.type == "stroke") {
        this.paper.project.activeLayer.addChild(lastStroke.path)
      } else if (lastStroke.type == "delete") {
        lastStroke.path.remove()
      }
    }
    this.save()
  }
  
  onUndoStroke() {
    this.undoStroke()
  }
  
  
  onRedoStroke() {
    this.redoStroke()
  }
  
  
  
  onPointerDown(evt) {
    if (evt.pointerType == "mouse" && evt.button == 2) {
      // context menu
      return
    }
    
    if (evt.pointerType == "pen" && evt.button == 2) {
       // context menu
      // return
    }
    

    evt.stopPropagation();
    evt.preventDefault();
    var id = evt.pointerId;   
    this.offset  = this.getOffset(this.canvas);
    var path = new Path();
    
    if (evt.pointerType == "pen" && evt.button == 2) {
      path.command = "delete"
      path.strokeColor = "red"
    } else {
      path.strokeColor = "blue"
    }

    this.lastPath[id] = path;
    var x = evt.pageX - this.offset.left;
    var y = evt.pageY - this.offset.top;

    path.moveTo([x, y]); 

    lively.addEventListener("drawboard", this.canvas, "pointermove", (e) => this.onPointerMove(e), false);
  }  
  
  // Event handler called for each pointerdown event:
  onPointerMove(evt) {
    var id = evt.pointerId;   
    var path = this.lastPath[id];
    if (path) {
      
      var x = evt.pageX - this.offset.left;
      var y = evt.pageY - this.offset.top;
      
      var p = {x:x, y:y};
    
      path.lineTo(p);
    }
  }

  onPointerUp(evt) {
    this.lastPointerUp = Date.now() // #Hack custom prevent default
    evt.stopPropagation();
    evt.preventDefault();
    
    var id = evt.pointerId;
    var path = this.lastPath[id];
    if (path) {
      if (path.command == "delete") {
        this.paper.project.activeLayer.getItems({class: Path})
          .filter( ea => {
            try { 
              return ea.intersects(path) // 
            } catch(e) { return false}
          })
          .forEach( ea => {
            // #TODO refaktor into Undo/Redo Command  + CommandProcessor
            this.strokes.length = this.undoIndex;
            this.strokes.push({
              type: "delete",
              path: ea
            })
            this.undoIndex = this.strokes.length;

            ea.remove();
          })
        path.remove()
      } else {
        path.simplify(3);
        
        this.strokes.length = this.undoIndex;
        this.strokes.push({
          type: "stroke",
          path: path
        });
        this.undoIndex = this.strokes.length;
        
      }
      lively.removeEventListener("drawboard", this.canvas, "pointermove")    
      delete this.lastPath[id];

      this.save()
    }
  }
  
  save() {
    this.innerHTML = ""
    this.appendChild(this.paper.project.exportSVG())
  }
  
  
  livelyMigrate(other) {
    var svg = other.paper.project.exportSVG();
    this.initPaper();
    this.paper.project.importSVG(svg);
  }
  
}
      

     
      