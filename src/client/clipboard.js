import {pt} from 'src/client/graphics.js';
import Halo from "templates/lively-halo.js"

export default class Clipboard {
  
  
  static load() {
    lively.removeEventListener("Clipboard", document)
    lively.removeEventListener("Clipboard", document.body)
    lively.addEventListener("Clipboard", document, "click", evt => this.onBodyClick(evt))
    lively.addEventListener("Clipboard", document.body, "paste", evt => this.onPaste(evt))
    lively.addEventListener("Clipboard", document.body, "cut", evt => this.onCut(evt))
    lively.addEventListener("Clipboard", document.body, "copy", evt => this.onCopy(evt))
    
    document.body.setAttribute("tabindex", 0) // just ensure focusabiltity
  }
  
  static onCut(evt) {
    if ((!HaloService.areHalosActive() || !that)) 
      return 
    this.onCopy(evt)
    that.remove()
    Halo.hideHalos()
  }
  
  static onCopy(evt) {
    if (lively.selection.nodes.length > 0) {
      var html = lively.selection.nodes.map(ea => ea.outerHTML).join("\n")
      evt.clipboardData.setData('text/plain', html);
      evt.clipboardData.setData('text/html', html);
      evt.preventDefault(); 
      return 
    }

    if (HaloService.areHalosActive()  && (that !== undefined)) {
        evt.clipboardData.setData('text/plain', that.outerHTML);
        evt.clipboardData.setData('text/html', that.outerHTML);
        lively.notify("data: " + that.outerHTML)
        evt.preventDefault(); 
    }
  }

  static onPaste(evt) {
    if (!this.lastClickPos) return; // we don't know where to paste it...this.lastClickPos
    
    if (document.activeElement !== document.body) return
    
    var data = evt.clipboardData.getData('text/html')
    if (data) {
      
      // lively.notify("paste html: " + data)
      // data = data.replace(/.*<!--StartFragment-->/,"")
      // data = data.replace(/<!--StartFragment-->.*/,"")
      
      var div = document.createElement("div")
      div.style.backgroundColor = "red"
      lively.setExtent(div, pt(100,100))
      div.innerHTML = data
      document.body.appendChild(div)
      lively.setGlobalPosition(div, this.lastClickPos)
  
      
      // only add a div as container when it is needed, otherwise get rid of it
      var lastPos
      div.querySelectorAll(":scope > *").forEach(child => {
        document.body.appendChild(child)
        if(!lastPos) lastPos = lively.getPosition(child)
        var pos = lively.getPosition(child)
        lively.setGlobalPosition(child, this.lastClickPos)
        // keep relative positions...
        lively.setPosition(child, lively.getPosition(child).addPt(lastPos.subPt(pos)))
        lastPos = pos
      })
      div.remove()
      return 
    }
  
  
  
    var data = evt.clipboardData.getData('text/plain')
    if (data) {
      var div = document.createElement("div")
      div.innerHTML = data
      document.body.appendChild(div)
      lively.setGlobalPosition(div, this.lastClickPos)
      return 
    }
    
    var items = (event.clipboardData || evt.clipboardData).items;
    if (items.length> 0) {
      for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
          var blob = item.getAsFile();
          var reader = new FileReader();
          reader.onload = (event) => {
            var img = document.createElement("img")
            img.src = event.target.result
            img.classList.add("lively-content")
            document.body.appendChild(img)
            lively.setGlobalPosition(img, this.lastClickPos)
          }; // data url!
          reader.readAsDataURL(blob);
        }
      }
      return 
    }
  }

  static onBodyClick(evt) {
    if(document.body.parentElement ===  evt.path[0]) {
      document.body.focus()
      this.lastClickPos = pt(evt.clientX,evt.clientY)
      // lively.showPoint(this.lastClickPos)
    }
  }
}

Clipboard.load()