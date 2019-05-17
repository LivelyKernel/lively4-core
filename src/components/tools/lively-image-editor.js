import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyImageEditor extends Morph {
  async initialize() {
    this.windowTitle = "Image Editor";

    this.canvas = this.get("#canvas")

    this.canvas.height = 500
    this.canvas.width = 500

    this.ctx = this.canvas.getContext("2d");

    lively.removeEventListener("pointer", this)
    lively.addEventListener("pointer", this, "pointerdown", e => this.onPointerDown(e))
    lively.addEventListener("pointer", this, "pointermove", e => this.onPointerMove(e))
    lively.addEventListener("pointer", this, "pointerup", e => this.onPointerUp(e))

    lively.addEventListener('pointer', this, "contextmenu", evt => {
      if (!evt.shiftKey) {
        this.onContextMenu(evt)
        evt.stopPropagation();
        evt.preventDefault();
        return true;
      }
    }, false);
    
    var url = this.getAttribute("src")
    if (url) this.loadImage(url)
    
  }
  
  loadImage(url) {
    this.setAttribute("src", url)
    var img = new Image();
    img.onload = () => {
      this.canvas.height = img.height
      this.canvas.width = img.width
      lively.notify("load " + url)
      this.ctx.drawImage(img, 0, 0); // Or at whatever offset you like
    };
    img.src = "https://lively-kernel.org/lively4/foo/test.png";
  }

  posFromEvent(evt) {
    return lively.getPosition(evt).subPt(lively.getGlobalPosition(this.canvas))
  }
  
  paint(pos) {
    this.ctx.fillStyle = "#FF0000";
    this.ctx.fillRect(pos.x, pos.y, 4, 4);
  }

  onPointerDown(evt) {
    this.isDown = true
    var pos = this.posFromEvent(evt)
    this.paint(pos)
  }
  
  onPointerMove(evt) {
    if (this.isDown) {
      var pos = this.posFromEvent(evt)
      this.paint(pos)
    }
  }

  onPointerUp(evt) {
    var pos = this.posFromEvent(evt)
    this.paint(pos)
    this.isDown = false
  }
  
  async onSave(url) {
    url = url || this.getAttribute("src") 
    if (url) {
      this.setAttribute("src", url)
      await lively.files.copyURLtoURL(this.canvas.toDataURL(), url)
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
      this.loadImage(url)
    }
  }

  async onContextMenu(evt) {
    const menuElements = [
      ["save", () => this.onSave()],
      ["save as...", () => this.onSaveAs()],
      ["open image", () => this.onOpen()],
    ];

    const menu = new lively.contextmenu(this, menuElements)
    menu.openIn(document.body, evt, this)

  }

  livelyMigrate(other) {

  }

  livelyPrepareSave() {

  }

 
  
  
  async livelyExample() {
    this.loadImage("https://lively-kernel.org/lively4/foo/test.png")
  }


}
