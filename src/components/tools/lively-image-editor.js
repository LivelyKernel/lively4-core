import Morph from 'src/components/widgets/lively-morph.js';


export default class LivelyImageEditor extends Morph {
  async initialize() {
    this.windowTitle = "Image Editor";

    this.canvas = this.get("#canvas")
    this.canvas.height = 500
    this.canvas.width = 500

    this.ctx = this.canvas.getContext("2d");

    if(this.migrateCanvas) {
      this.ctx.drawImage(this.migrateCanvas, 0, 0)
    }
    
    
    this.get("#penColor").value = this.color;
    this.get("#penSize").value = this.penSize;

    lively.html.registerKeys(this, "keys", this, true)
    
    this.get("#crop").addEventListener("click", evt => this.onCrop(evt))
    this.get("#save").addEventListener("click", evt => this.onSave())
  
    
    lively.removeEventListener("pointer", this)
    lively.addEventListener("pointer", this, "pointerdown", e => this.onPointerDown(e))
    lively.addEventListener("pointer", this, "pointermove", e => this.onPointerMove(e), false)
    lively.addEventListener("pointer", this, "pointerup", e => this.onPointerUp(e))


    
    
    lively.addEventListener('pointer', this, "contextmenu", evt => {
      if (!evt.shiftKey) {
        this.onContextMenu(evt)
        evt.stopPropagation();
        evt.preventDefault();
        return true;
      }
    }, false);
    

    
    lively.addEventListener("imageeditor", this.get('#penColor'), "value-changed", 
      e => this.onPenColor(e.detail.value));  
    lively.addEventListener("imageeditor", this.get('#penSize'), "value-changed", 
      e => this.onPenSize(e.detail.value)); 
    
    if(this.target) {
      this.loadFromImageElement(this.target)
    } else {
      var url = this.getAttribute("src")
      if (url) {
        this.loadImage(url)
      }   
    }
  }
  
  // ACCESSORS
  
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
  
  onKeyDown(evt) {
    var key = String.fromCharCode(evt.keyCode)
    if (evt.ctrlKey && key == "S") {
      this.onSave()  
    }
  }

  
  // BEGIN EDITOR API
  saveFile() {
    
    var data = this.canvas.toDataURL()
    this.lastSource = data
    return lively.files.copyURLtoURL(data, this.getURL())
  }

  getURL(url) {
    return this.getAttribute("src")
  }

  setURL(url) {
    if(this.getURL() != url) {
      this.loadImage(url)
    }
  }
  
  currentEditor() {
    var canvas = this.canvas
    return {
      getValue() { return canvas.toDataURL()}
    }
  }
  // END EDITOR API
  
  
  onPenColor(color) {
    this.color = color
  }
  
  onPenSize(size) {
    this.penSize = size
  }
  
  
  
  loadImage(url) {
      
    this.setAttribute("src", url)
      
    if (!url.toString().match(/^https?:\/\//)) {
      var resolvedURL = lively.swxURL(url)
    } else {
      resolvedURL = url
    }
      
    
    var img = new Image();
    img.onload = () => {
      this.loadFromImageElement(img) 
    };
    img.src = resolvedURL
  }
  
  loadFromImageElement(img) {
    this.canvas.height = img.height
    this.canvas.width = img.width
    this.ctx.drawImage(img, 0, 0); // Or at whatever offset you like
    this.lastSource = this.canvas.toDataURL();

  }
  
  posFromEvent(evt) {
    return lively.getPosition(evt).subPt(lively.getClientPosition(this.canvas))
  }
  
  setTarget(img) {
    this.target = img
    this.loadFromImageElement(img)
  }
  

  // #important
  paint(pos) {
    this.ctx.strokeStyle =  this.color;
    this.ctx.lineWidth = this.penSize;
    if (this.lastPos) {
      this.ctx.lineCap =  "round" 
      this.ctx.moveTo(this.lastPos.x, this.lastPos.y);      
      this.ctx.lineTo(pos.x, pos.y);
      //this.ctx.closePath();
      this.ctx.stroke();
    }
    this.lastPos = pos
  }

  onPointerDown(evt) {
    // ensure only painting on the canvas directly
    if(this.canvas !== evt.composedPath()[0]) return
    
    evt.preventDefault()
    evt.stopPropagation()
    
    
        
    var pos = this.posFromEvent(evt)
    this.downPos = pos
    if(evt.button != 0) return; // only left mouse (main button) paints.
    if(this.mode == "crop") {
    
    } else {    
      this.isDown = true
      this.ctx.beginPath()
      this.paint(pos)      
    }
    
  }
  
  get pen() {
     return this.get("#pen")
  }
  
  isOnCanvas(pos) {
    return lively.rect(lively.pt(0,0), lively.getExtent(this.canvas)).containsPoint(pos)
  }
  
  clear() {
    this.ctx.fillStyle = 'white'; // Set the fill color to blue
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  
  // #important
  onPointerMove(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    this.pen.textContent = ""
    this.pen.border = ""
    var pos = this.posFromEvent(evt)
    if (this.mode == "crop") {
      this.pen.style.borderRadius = ""
      this.pen.style.background = "" 
      if (this.downPos) {
        lively.setClientPosition(this.pen, lively.getClientPosition(this.canvas).addPt(this.downPos))
        this.pen.style.border = "1px solid gray"
        lively.setExtent(this.pen, pos.subPt(this.downPos))        
      } else {
        lively.setClientPosition(this.pen, lively.getPosition(evt))

        this.pen.textContent = "crop"
      }
    } else {
      if (this.isDown || this.isOnCanvas(pos)) {
        lively.setClientPosition(
          this.pen, 
          (lively.getClientPosition(this.canvas)
              .addPt(pos)).addPt(lively.pt( -this.penSize / 2 , -this.penSize / 2)))
        lively.setExtent(this.pen, lively.pt(this.penSize,this.penSize))
        this.pen.style.borderRadius = this.penSize / 2 + "px"
        this.pen.style.backgroundColor = this.color      
      } else {
        this.pen.style.backgroundColor = ""   
      }
      if (this.isDown) {
        this.paint(pos)
      }
    }
    
    
  }

  onPointerUp(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    var pos = this.posFromEvent(evt)
    if (this.mode == "crop") {
      if (this.downPos && this.isOnCanvas(pos)) {
        var extent = pos.subPt(this.downPos)
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = this.canvas.width;
        tmpCanvas.height = this.canvas.height;
        tmpCanvas.getContext("2d").drawImage(
          this.canvas,
          0,0, this.canvas.width, this.canvas.height,  
          0,0, this.canvas.width, this.canvas.height);      
      
        this.canvas.width = extent.x
        this.canvas.height = extent.y
        this.ctx = this.canvas.getContext("2d");
        this.ctx.clearRect(0, 0, extent.x,extent.y);
        this.ctx.drawImage(
          tmpCanvas,
          this.downPos.x, this.downPos.y, extent.x, extent.y,  
          0,0,extent.x,extent.y);
        this.pen.style.border = ""
      }
      this.mode = ""
    } else {
      this.paint(pos)
      this.isDown = false
      this.lastPos = undefined
      this.updateChangeIndicator()     
    }
    this.downPos = null
  }
  
  saveToTarget() {
    var data = this.canvas.toDataURL()
    this.lastSource = data
    this.target.src = data
    this.dispatchEvent(new CustomEvent("saved-to-target"));
  }
  
  async onSave(url) {
    if (!url && this.target) {
      return this.saveToTarget()
    }
    
    url = url || this.getAttribute("src") 
    if (url) {
      this.setAttribute("src", url)
      this.saveFile()
      lively.notify("saved " + url)
    } else {
      this.onSaveAs()
    }
  }

  async onSaveAs() {
    var url = await lively.prompt("save as", this.getAttribute("src") || "")
    if (url) {
      this.onSave(url)
    }    
  }  
  
  async onOpen() {
    var url = await lively.prompt("load", this.getAttribute("src") || "")
    if (url) {
      await this.loadImage(url)
      lively.notify("load " + url)
    }
  }
  
  onCrop(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    this.mode = "crop"    
  }

  async onContextMenu(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    const menuElements = [
      ["save", () => this.onSave()],
      ["save as...", () => this.onSaveAs()],
      ["clear", () => this.clear()],
      ["open image", () => this.onOpen()],
    ];
    const menu = new lively.contextmenu(this, menuElements)
    menu.openIn(document.body, evt, this)
  }
 
  get lastSource() {
    return this._lastSource  
  }
  
  set lastSource(value) {
    this._lastSource  = value
    this.updateChangeIndicator()
    
  }
  
  updateChangeIndicator() {
    if (!this.lastSource) return;
    var newSource = this.canvas.toDataURL();
    if (newSource !== this.lastSource) {
      this.get("#changeIndicator").style.backgroundColor = "rgb(200,30,30)";
      this.textChanged = true;
    } else {
      this.get("#changeIndicator").style.backgroundColor = "rgb(200,200,200)";
      this.textChanged = false;
    }
  }
  
  livelyMigrate(other) {
    this.target = other.target
    this.migrateCanvas = other.canvas
  }

  async livelyExample() {    
    this.loadImage("https://lively-kernel.org/lively4/foo/test.png")
  }
}
