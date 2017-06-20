import {pt} from 'src/client/graphics.js';
import Halo from "templates/lively-halo.js"

export default class Clipboard {
  
  
  static load() {
    lively.removeEventListener("Clipboard", document)
    lively.removeEventListener("Clipboard", document.body)
    lively.addEventListener("Clipboard", document, "mousedown", evt => this.onBodyMouseDown(evt))
    lively.addEventListener("Clipboard", document.body, "paste", evt => this.onPaste(evt))
    lively.addEventListener("Clipboard", document.body, "cut", evt => this.onCut(evt))
    lively.addEventListener("Clipboard", document.body, "copy", evt => this.onCopy(evt))
    
    document.body.setAttribute("tabindex", 0) // just ensure focusabiltity
  }
  
  static onCut(evt) {
    if ((!HaloService.areHalosActive() || !that)) {
      return;
    }
    this.onCopy(evt)
    if (lively.selection.nodes.length > 0) {
      var html = lively.selection.nodes.forEach(ea => {
        ea.remove()
      })
      lively.selection.remove()
       
    } else {
      that.remove()
    }
    Halo.hideHalos()
  }
  
  static onCopy(evt) {
    if ((!HaloService.areHalosActive() || !that)) {
      return;
    }
    evt.preventDefault(); 
    evt.stopPropagation()
    var nodes = []
    if (lively.selection.nodes.length > 0) {
      nodes = lively.selection.nodes
    } else if ((that !== undefined)) {
      nodes = [that]
    }

    // prepare for serialization
    nodes.forEach(node => {
      node.querySelectorAll("*").forEach( ea => {
        if (ea.livelyPrepareSave) ea.livelyPrepareSave();
      });
    })
    
    var html = nodes.map(ea => ea.outerHTML).join("\n")
    evt.clipboardData.setData('text/plain', html);
    evt.clipboardData.setData('text/html', html);
  }

  static onPaste(evt) {
    if (!this.lastClickPos) return; // we don't know where to paste it...this.lastClickPos
    
    if (document.activeElement !== document.body) return
    evt.stopPropagation()
    evt.preventDefault(); 
    
    var data = evt.clipboardData.getData('text/html')
    if (data) {
      // temporarily add everthing into a container 
      var div = document.createElement("div")
      div.style.backgroundColor = "red"
      lively.setExtent(div, pt(100,100))
      div.innerHTML = data
      document.body.appendChild(div)
      lively.setGlobalPosition(div, pt(0,0))
  
      // paste oriented at a shared topLeft
      var all = lively.array(div.querySelectorAll(":scope > *"))
       all.forEach(child => {
        document.body.appendChild(child)
       })
      var topLeft
      all.forEach(ea => {
        if (!topLeft) 
          topLeft = lively.getGlobalPosition(ea);
        else
          topLeft = topLeft.minPt(lively.getGlobalPosition(ea))
      })
      var offset = this.lastClickPos.subPt(topLeft)
      all.forEach(child => {
        document.body.appendChild(child)
        lively.setPosition(child, lively.getPosition(child).addPt(offset))
        // lively.showPath([
        //   lively.getGlobalPosition(child,),
        //   lively.getGlobalPosition(child).addPt(offset)
        // ])
      })
      div.remove() // and get rid of the tmp container

      return 
    }

    var data = evt.clipboardData.getData('text/plain')
    if (data) {
      var div = document.createElement("div")
      div.innerHTML = data
      document.body.appendChild(div)
      lively.setGlobalPosition(div, this.lastClickPos)
      evt.stopPropagation()
      evt.preventDefault(); 
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
      evt.stopPropagation()
      evt.preventDefault(); 
      return 
    }
 
  }

  static onBodyMouseDown(evt) {
    if(document.body.parentElement ===  evt.path[0]) {
      lively.globalFocus()
      this.lastClickPos = pt(evt.clientX,evt.clientY)
      // lively.showPoint(this.lastClickPos)
    }
  }
}

Clipboard.load()