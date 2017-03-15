import Morph from './Morph.js';
import paper from "src/external/paperjs/paper-core.js";

import ContextMenu from 'src/client/contextmenu.js';

import CommandHistory  from "src/client/command-history.js";

let Path = paper.Path,
	Point = paper.Point;


export default class LivelyPaper extends Morph {
      
  get colours() {
    return ['red', 'green', 'blue', 'yellow', 'black'];
  }
  
  getOffset(obj) {
    return  obj.getBoundingClientRect();
  } 
  
  initPaper() {
    if (this.paper) return this.paper;
    this.paper = new paper.PaperScope();
    this.canvas = this.get("#canvas");
    this.paper.setup(this.canvas);
  }
  
  initialize() {
    this.lastPath = {};
    this.initPaper();

    lively.addEventListener("drawboard", this.canvas, "pointerdown", 
      (e) => this.onPointerDown(e));

    lively.addEventListener("drawboard", this.canvas, "pointerup", 
      (e) => this.onPointerUp(e));
      
    this.strokes = new CommandHistory();
    
    lively.html.registerButtons(this);
    
    var height = this.getAttribute("height")
    if (height) {
      this.canvas.style.height = height
      this.canvas.setAttribute("height", height)
    }
    
    var width = this.getAttribute("width")
    if (width) {
      this.canvas.style.width = width
      this.canvas.setAttribute("width", width)
    }
    
    this.addEventListener('contextmenu', (evt) => {
      if (this.lastPointerUp && (this.lastPointerUp - Date.now() < 1000)) {
        evt.stopPropagation();
        evt.preventDefault();
        return; // #HACK custom prevent default....
      }
      
      if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();

        var menu = new ContextMenu(this, [
              ["clear", () => this.clear()],
              ["undo stroke", () => this.undoStroke()],
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
    }, false);
    
    // setTimeout(() => {
    //  this.load(); // #Hack I don't get it when is paper.js ready? #Issue
    // },10000)

    var obj  =this
    window.setTimeout(function()  {
      try {
        obj.load(); // #Hack I don't get it when is paper.js ready? #Issue
      } catch(e) {
        console.log("Load Paper error: " + e)
      }
    },1000)

  }
  
  
  
  load() {
    // #TODO we know that the state of the svg might diverge frome the state of paper
    var svg = this.querySelector("svg");
    //if (!svg || !this.paper.project) {
    //  setTimeout(() => this.load(), 100) // load later
    //  return
    // }
    // lively.notify("[paper] loaded!")
    // console.log("project", this.paper.project)
    this.paper.project.importSVG(svg);
  }

  clear() {
    this.paper.project.clear();
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
  
  onPointerDown(evt) {
    this.paper.activate();
    if (evt.pointerType == "mouse" && evt.button == 2) {
      // context menu
      return;
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
      path.command = "delete";
      path.strokeColor = "red";
    } else {
      path.strokeColor = "blue";
      path.strokeWidth = 2;

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
    this.lastPointerUp = Date.now(); // #Hack custom prevent default
    evt.stopPropagation();
    evt.preventDefault();
    
    var id = evt.pointerId;
    var path = this.lastPath[id];
    if (path) {
      if (path.command == "delete") {
        this.paper.project.activeLayer.getItems({class: Path})
          .filter( ea => {
            try { 
              return ea.intersects(path);  
            } catch(e) { return false}
          })
          .forEach( ea => {
            var command = {
              type: "delete",
              stroke: ea,
              container: this.paper.project.activeLayer,
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
        path.simplify(1);

        var command = {
          type: "stroke",
          stroke: path,
          container: this.paper.project.activeLayer,
          execute: function() {
            this.container.addChild(this.stroke);
          },
          unexecute: function(){
            this.stroke.remove();
          }
        }
        this.strokes.addCommand(command)
        
      }
      lively.removeEventListener("drawboard", this.canvas, "pointermove");    
      delete this.lastPath[id];

    }
  }
  
  save() {
    this.innerHTML = "";
    this.appendChild(this.paper.project.exportSVG());
  }
  
  livelyPrepareSave() {
    this.save()
  }
  
  livelyMigrate(other) {
    var svg = other.paper.project.exportSVG();
    this.initPaper();
    this.paper.project.importSVG(svg);
  }
  
}
      

     
      