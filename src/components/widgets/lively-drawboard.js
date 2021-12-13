/*MD # Drawboad 

![](lively-drawboard.png){width=400px}

MD*/


import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import CommandHistory  from "src/client/command-history.js";
import paper from "src/external/paperjs/paper-core.js";
import {pt} from "src/client/graphics.js";

import _ from 'src/external/lodash/lodash.js'

const debouncedObjects = new WeakMap();
function debounceMember(that, func, ...args) {
  if(!debouncedObjects.has(that)) {
    debouncedObjects.set(that, new Map());
  }
  let debouncedObject = debouncedObjects.get(that);
  if(debouncedObject.has(func)) {
    clearTimeout(debouncedObject.get(func));
  }
  
  let clearId = setTimeout(() => {
    that[func](...args);
  }, 1000);
  debouncedObject.set(func, clearId);
}

export default class LivelyDrawboard extends Morph {
  
  initSVGInteraction() {
    lively.addEventListener("drawboard", this.svg, "pointerdown", 
      (e) => this.onPointerDown(e));
    lively.addEventListener("drawboard", this.svg, "pointerup", 
      (e) => this.onPointerUp(e));
  }
  
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
    return this.querySelector("#svg");
  }
  
  get paper() {
    if (!this._paper) {
      paper.setup(document.createElement("canvas"));
      this._paper = paper;
    }
    return this._paper;
  }
  
  initialize() {
    this.resetWindowTitle();

    this.lastPath = new Object();

    var svg = this.get("#svg");
    if (!svg) {
      svg =  document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svg.id = "svg";
      svg.style = `position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
        border: none;
        opacity: 1;
        touch-action: none;`;
      this.appendChild(svg);
    }
    
    svg.setAttribute("data-is-meta", true);
    
    // we cannot disable the events here, because we need them for drawing
    // the downside is, that the SVG element shows up in the Halo
    // svg.style.pointerEvents = "none"
    
    
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);

    this.initSVGInteraction();
    lively.addEventListener("drawboard", this, "extent-changed", 
      e => this.onExtentChanged(e));
    lively.addEventListener("drawboard", this, "focus", 
      e => this.onFocus(e));
    lively.addEventListener("drawboard", this, "blur", 
      e => this.onBlur(e));
    lively.addEventListener("drawboard", this.get('#backgroundColor'), "value-changed", 
      e => this.onBackgroundColor(e.detail.value));  
    lively.addEventListener("drawboard", this.get('#penColor'), "value-changed", 
      e => this.onPenColor(e.detail.value));  
    lively.addEventListener("drawboard", this.get('#penSize'), "value-changed", 
      e => this.onPenSize(e.detail.value));  

    
    this.get('#controls').draggable = true
    lively.addEventListener("drawboard", this.get('#controls'), "dragstart", 
      e => this.onDragStart(e));  
    lively.addEventListener("dragboard", this.get('#controls'), "drag", 
      e => this.onDrag(e));  
    lively.addEventListener("dragboard", this.get('#controls'), "dragend", 
      e => this.onDragEnd(e));  

    this.color = "black";
    
    this.updateCanvasExtent();
    this.observeHTMLChanges();
   
    this.get("#backgroundColor").value = this.background;
    this.get("#penColor").value = this.color;
    this.get("#penSize").value = this.penSize;
   
    this.strokes = new CommandHistory();
    this.registerButtons();
    
    this.get("lively-resizer").target = this; // shadow root cannot look outside
    
    this.setAttribute("tabindex", 0);
  }
  
  attachedCallback() {
    if (this.parentElement.isWindow) {
      this.fixedControls = true;
      this.get("#controls").hidden = false ;
      this.get("lively-resizer").hidden = true;
    } else {
      this.get('#controls').draggable = false;
      this.fixedControls = false;
      this.get("lively-resizer").hidden = false;
    }
    setTimeout(() => this.updateCanvasExtent(), 1000);
  }
  
  onExtentChanged() {
    this.updateCanvasExtent();
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
            this.onExtentChanged()
          }
        })
    });
    this.mutationObserver.observe(this, {
      childList: false, 
      subtree: false, 
      characterData: false, 
      attributes: true});
  }

  freehand() {
    this.classList.add("freehand")
    this.get("#svg").style.overflow = "visible";
    
    // this.style.backgroundColor = "transparent"
    // this.style.border = "0pxffffff"        
    // this.get("svg").style.overflow = "visible"
  }
    
  onPointerDown(evt) {
    if (!this.svg) return
    
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
    
    // #BUG seems to jump back...
    // if (evt.getCoalescedEvents) {
    //   var i=1
    //   var missedEvents = evt.getCoalescedEvents()
    //   // lively.showPath(missedEvents.map( ea => pt(ea.clientX, ea.clientY)))
    //   missedEvents.forEach(ea => {
    //     lively.showPoint(lively.getPosition(evt), 10000).innerHTML = "" + i++      
    //     this.onPointerMove(ea)
    //   })
    // }
    
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
        Array.from(this.get("#svg").querySelectorAll("path"))
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
    debounceMember(this, "saveSVG");
  }
  
  simplifyPath(path) {
    // if (true) {
    //   var tmp = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    //   tmp.innerHTML = path.outerHTML
    //   var debugPath = tmp.querySelector("path")
    //   debugPath.setAttribute("stroke", "red")
    //   path.parentElement.appendChild(debugPath)            
    // }
    
    this.paper.project.activeLayer.removeChildren();
    this.paper.project.importSVG(path)
    var paperPath = paper.project.getItems({class: paper.Path})[0]
    paperPath.simplify(3)
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
    
    // return pt(evt.pageX * scale, evt.pageY * scale)
    return pt(evt.clientX, evt.clientY)
    // #HACK for subpixel precision
    /// return pt(evt.screenX * scale, evt.screenY * scale)
  }
  
  onDragStart(evt){ 
    lively.notify("drag start")
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

  async onLoadFile() {
    let fileName = await lively.prompt('Load the following file:', 'https://lively4/dropbox/_test.svg');
    if(!fileName) { return; }

    this.svg && this.svg.remove();
    
    let s = await fetch(fileName);
    let svgString = await s.text();
    
    // svgString to html element
    let div = document.createElement('div');
    div.innerHTML = svgString;
    this.appendChild(div.firstChild);
    
    this.initSVGInteraction();
    this.setAutosaveTarget(fileName);
    this.strokes.clear();
  }
  
  setAutosaveTarget(fileName) {
    this.autosaveTo = fileName;

    this.resetWindowTitle();
    this.windowTitle += ": " + fileName;
  }
  
  resetWindowTitle() {
    this.windowTitle = "Draw Board";
  }
  
  async onActivateSave() {
    let fileName = await lively.prompt('Choose file to sync with:', 'https://lively4/dropbox/_test.svg');
    this.autosaveTo = undefined;
    this.resetWindowTitle();
    
    if(fileName) {
      this.setAutosaveTarget(fileName);
      this.saveSVG();
    }
  }
  
  async saveSVG() {
    let urlString = this.autosaveTo;

    if(!urlString || urlString === '') { return; }
    
    this.get('#svg').setAttribute("width", lively.getExtent(this).x)
    this.get('#svg').setAttribute("height", lively.getExtent(this).y)
    
    let svg = this.get('#svg').outerHTML;
    
    try {
      new URL(urlString);
      await lively.files.saveFile(urlString, svg);
      lively.notify("saved drawboard", urlString);
    } catch(err) {
      lively.notify(err);
    }
  }

  livelyExample() {
     this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" id="svg" data-is-meta="true" style="position: absolute; top: 30px; left: 0px; width: 650px; height: 350.807px; border: none; opacity: 1; touch-action: none;"><path stroke="rgb(255,142,0)" stroke-width="2" fill="none" d="M146,47.80682c-19.32721,0 -28.34628,7.00971 -43,18c-10.8015,8.10113 -18.41714,16.15086 -25,28c-10.29464,18.53035 -18.67394,41.95635 -15,64c1.2894,7.73639 10.373,14.746 14,22c7.6676,15.33519 14.53424,30.76162 23,46c31.56566,56.81819 121.97168,69.56227 179,65c5.06981,-0.40558 21.98473,-3.0375 27,-5c4.08832,-1.59978 20.94649,-13.42967 23,-15c29.61184,-22.64435 10.93081,-61.34595 5,-91c-2.98498,-14.92491 -1.964,-28.92801 -9,-43c-2.07446,-4.14893 -4.43785,-4.41299 -7,-8c-10.93404,-15.30765 -17.56364,-22.42273 -33,-34c-7.47776,-5.60832 -13.18705,-13.09352 -21,-17c-3.28654,-1.64327 -11.44268,-2.40711 -15,-3c-2.19593,-0.36599 -3.50121,-2.87591 -5,-4c-4.9657,-3.72427 -14.39235,-1.13078 -20,-3c-1.94657,-0.64886 -1.02322,-3.25581 -4,-4c-9.08588,-2.27147 -16.7621,-3.15242 -26,-5c-3.30657,-0.66131 -4.03294,-3.01098 -7,-4c-5.66079,-1.88693 -11.28596,-2.04766 -17,-3c-1.64399,-0.274 -2.82149,-1.82149 -4,-3c-3.10012,-3.10012 -14.47683,-3 -19,-3"></path><path stroke="rgb(255,142,0)" stroke-width="2" fill="none" d="M125,107.80682c-1.05088,0 -5.3369,-0.6631 -6,0c-1.20644,1.20644 -0.48308,18.3559 0,19c6.23341,8.31121 17.47112,34.61155 34,28c3.11115,-1.24446 4.53133,-6.42983 6,-9c1.28479,-2.24838 14.10284,-25.89716 10,-30c-2.0199,-2.0199 -3.75818,-7.75818 -7,-11c-3.79356,-3.79356 -20.82568,-5.58716 -26,-3c-1.79343,0.89671 -1.78126,2.78126 -3,4"></path><path stroke="rgb(255,142,0)" stroke-width="2" fill="none" d="M226,109.80682c-4.1372,4.1372 -11.28308,7.13231 -13,14c-1.5695,6.278 -0.08992,25.91008 3,29c4.51687,4.51687 24.02083,4 31,4c1.03326,0 8.68465,0.6307 9,0c1.80814,-3.61628 0,-12.98538 0,-17c0,-38.59747 -15.61932,-44.39448 -52,-34"></path><path stroke="rgb(255,142,0)" stroke-width="2" fill="none" d="M151,214.80682c0,6.02818 2.08588,14.27147 9,16c0.98765,0.24691 4.35185,-0.37037 5,0c1.63717,0.93553 2.52758,2.82206 4,4c0.80899,0.64719 24.04656,0 27,0c6.32993,0 14.34507,1.39296 20,-2c7.95421,-4.77253 13.32877,-6.49315 19,-15c2.70716,-4.06074 7,-14.50934 7,-12"></path><path stroke="rgb(255,142,0)" stroke-width="2" fill="none" d="M137,135.80682c0,0.57403 0,6 0,6c0,0 3.2404,-8.2404 4,-9c6.46556,-6.46556 21.91491,-10.08509 28,-4c2.67133,2.67133 -9.18942,2 -10,2c-6.39201,0 -13.98449,-6.03103 -18,2c-0.76896,1.53792 -0.30484,16.84758 0,17c7.98862,3.99431 22.95086,-10.04914 18,-15c-0.66667,-0.66667 -3.33333,0.66667 -4,0c-5.90622,-5.90622 -4,6.18127 -4,11"></path><path stroke="rgb(255,142,0)" stroke-width="2" fill="none" d="M223,131.80682c0,-4.62548 -5.03929,-3.84285 -6,0c-1.58231,6.32922 6.73401,25.26599 14,18c0.42441,-0.42441 -0.19517,-4.4145 0,-5c2.66775,-8.00326 -0.45066,-10.90131 -3,-16c-0.01206,-0.02413 -7.81677,-0.36647 -8,0c-0.29814,0.59628 0.3698,1.4453 0,2c-0.94475,1.41712 -3.33497,18.33252 -2,19c2.32766,1.16383 5.06477,3.06477 7,5c1.35442,1.35442 1.60355,3.79882 4,3c7.51719,-2.50573 3.83722,-28.91861 -8,-23c-2.49031,1.24515 -5.88455,14.55772 -3,16c11.47818,5.73909 11.62877,-12 3,-12"></path><path stroke="rgb(255,142,0)" stroke-width="2" fill="none" d="M562,126.80682c0.33333,0.33333 0.66667,0.66667 1,1"></path></svg>`
     this.initSVGInteraction()
  }
  
  livelyMigrate(other) {
    // TODO: should include:
    // - strokes
    // - autosave path
    // (- history)
  }
}
      

     
      