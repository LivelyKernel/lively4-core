import Morph from './Morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import CommandHistory  from "src/client/command-history.js";
import paper from "src/external/paperjs/paper-core.js";
import {pt} from "src/client/graphics.js";

// window.paper = paper;

export default class LivelyDrawboard extends Morph {
  
  
  // Lively Window API
  get isWindow() {
    return this.parentElement && !this.parentElement.isWindow
  }
  
  isMinimized() {
    return false
  }
  
  getOffset(obj) {
    var bounds = obj.getBoundingClientRect()
    return  pt(bounds.left, bounds.top)
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
    
    svg.setAttribute("data-is-meta", true)
    
    // we cannot disable the events here, because we need them for drawing
    // the downside is, that the SVG element shows up in the Halo
    // svg.style.pointerEvents = "none"
    
    
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);

    lively.addEventListener("drawboard", this.svg, "pointerdown", 
      (e) => this.onPointerDown(e));
    lively.addEventListener("drawboard", this.svg, "pointerup", 
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
    
    this.get("lively-resizer").target = this // shadow root cannot look outside
    
    this.setAttribute("tabindex", 0)
  }
  
  attachedCallback() {
    if (this.parentElement.isWindow) {
      this.fixedControls = true 
      this.get("#controls").hidden =false 

    } else {
      this.get('#controls').draggable = false
      this.fixedControls = false 
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
      // evt.preventDefault()
      
      this.focus()
      // return 
    }
    
    if (evt.pointerType == "touch") {
      // console.log("ignor touch events for drawing...")
      return
    }

    if ((evt.pointerType == "mouse" && evt.button == 2) 
        || evt.ctrlKey 
        || ContextMenu.visible()) {
      // context menu
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
    var id = evt.pointerId;   
    this.offset  = this.getOffset(this.svg);
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", this.color);
    path.setAttribute("stroke-width", 2);        
    path.setAttribute("fill", "none");        
    this.get("#svg").appendChild(path)
    
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
    path.points = []
    var eventPos = this.eventPos(evt)
    this.screenOffset = this.eventPos(evt).subPt( pt(evt.clientX, evt.clientY))

    // use screenX and screenY for higher resolution
    var pos = eventPos.subPt(this.offset).subPt(this.screenOffset)

    path.points.push(pos)
    this.renderPath(path)
    
    lively.addEventListener("drawboard", this, "pointermove", (e) => this.onPointerMove(e), false);
    
    // this.setPointerCapture(evt.pointerId);
  }  
  
  renderPath(path) {
    if (!path.points || path.points.length == 0) return 
    // console.log("render " + path.points)
    var first, rest;
    [first, ...rest]= path.points
    path.setAttribute("d", "M "+ first.x +" " + first.y + 
      rest.map(ea => "L " + ea.x + " "+ ea.y).join(" "))
  }
  
  // Event handler called for each pointerdown event:
  onPointerMove(evt) {
    // console.log("move " + (Date.now() - this.lastMove))
    // this.lastMove = Date.now()
    
    // DEBUG
    // window.eventRecorder = []
    // window.eventRecorder && window.eventRecorder.push(evt)
    var id = evt.pointerId;   
    var path = this.lastPath[id];
    
    if (!path) return
    
    var eventPos = this.eventPos(evt)
    var pos = eventPos.subPt(this.offset).subPt(this.screenOffset)

    path.points.push(pos)
    this.renderPath(path)

  }

  onPointerUp(evt) {
    // this.releasePointerCapture(evt.pointerId)
    
    
    var id = evt.pointerId;
    var path = this.lastPath[id];
    if (!path) return;
    this.lastPointerUp  = Date.now()

    
    if (path.points.length ==  1) {
     var pos = this.eventPos(evt).subPt(this.offset).subPt(this.screenOffset)
     // ensure a visible stroke if no pointer was not moved
     path.points.push(pos.addPt(pt(1,1)))
    }

    this.renderPath(path)

    // lively.notify("strokes: " + path.points.length )
    
    // path.setAttribute("d", path.getAttribute("d") + 
    //   path.points.map( ea => " L "+ ea.x +" " + ea.y ).join(""))

    lively.removeEventListener("drawboard", this, "pointermove")    


    delete this.lastPath[id];
    
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
      this.get("#svg").appendChild(path)

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
      if (this.lastPointerUp && (Date.now() - this.lastPointerUp < 1000)) {
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
  
  /*
    // 100% NoPinch
    window.outerWidth // 1440
    window.innerWidth  // 1440
    document.documentElement.clientWidth // 1440
    
    // 100% MaxPinch
    window.outerWidth // 1440
    window.innerWidth // 360
    document.documentElement.clientWidth // 1440
    
    // 200% NoPinch
    window.outerWidth // 1440 
    window.innerWidth // 720
    document.documentElement.clientWidth // 712
  */
  getScreenScale() {
    return window.innerWidth / window.outerWidth;
  }
  
  eventPos(evt) {
    // return pt(evt.clientX, evt.clientY)

    var scale = this.getScreenScale()
    return pt(evt.screenX * scale, evt.screenY * scale)
  }
  
  onDragStart(evt) {
    if (this.fixedControls) return
    this.dragOffset = lively.getPosition(this).subPt( pt(evt.clientX, evt.clientY))

    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
    evt.stopPropagation(); 
  }
  
  onDrag(evt) {
    if (this.fixedControls) return

    if (evt.clientX == 0) return // #Issue bug in browser? Ignore garbage event
    
    var pos =  pt(evt.clientX, evt.clientY)
    // console.log("drag " + pos.x)
    
        // DEBUG
    // window.eventRecorder = []
    // window.eventRecorder && window.eventRecorder.push(evt)

    
    
    lively.setPosition(this, pos.addPt(this.dragOffset))
  }
  
  onDragEnd() {
    if (this.fixedControls) return
    
  }
  
  
  livelyMigrate(other) {

  }
  
}
      

     
      