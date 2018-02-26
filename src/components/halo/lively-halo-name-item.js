import HaloItem from 'src/components/halo/lively-halo-item.js';

export default class HalloNameItem extends HaloItem {
  
  initialize() {
    lively.html.registerKeys(this.get("#name"), "Halo", this)
    this.draggable = true
    this.addEventListener("dragstart", evt => this.onCustomDragStart(evt))
    this.addEventListener("drag", evt => this.onCustomDrag(evt))

  }
  
  async onCustomDragStart(evt) {
    // lively.notify("drag2")
    var target = that
    let url = lively.files.tempfile(),
      name = (target.id || "unnamed") + ".html",
      mimetype = "text/html"
    lively.files.saveFile(url, target.outerHTML)
    // there can be a race condition, when the url is faster requested 
    // than it is actually loaded #Hack 
    // This is a #Problem, but we cannot wait after until after we told the server, because the dataTransfer have to be intialized syncronously 
    // so we hope fore the best!
    evt.dataTransfer.setData("DownloadURL", `${mimetype}:${name}:${url}`);    
    
    evt.dataTransfer.setData("text/html", target.outerHTML);    
    evt.dataTransfer.setData("text/plain", target.textContent);    
  }
    
  onCustomDrag(evt) {
    evt.stopPropagation()
  }

  onEnterDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    this.target.id = this.get("#name").textContent 
    lively.focusWithoutScroll(document.body)
  }
  
  onLeftDown(evt) {
    evt.stopPropagation(); // don't move halo, but text cursor
  }
  
  onRightDown(evt) {
    evt.stopPropagation(); // don't move halo, but text cursor
  }


  updateTarget(target) {
    this.target = target
    if (target.id) {
      this.get("#name").textContent = target.id
    } else {
      this.get("#name").textContent = ""
    }

      this.get("#classname").textContent = this.target.tagName.toLowerCase()

  }
}