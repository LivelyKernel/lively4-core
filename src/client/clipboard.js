// #Clipboard - Cut,Copy, and Paste for Lively4

import {pt} from 'src/client/graphics.js';
import Halo from "templates/lively-halo.js"
import generateUUID from './uuid.js';
import persistence from "src/client/persistence.js"

export default class Clipboard {
  
  static load() {
    lively.removeEventListener("Clipboard", document)
    lively.removeEventListener("Clipboard", document.body)
    lively.addEventListener("Clipboard", document, "mousedown", evt => this.onBodyMouseDown(evt))
    lively.addEventListener("Clipboard", document.body, "paste", evt => this.onPaste(evt), true)
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
    // lively.notify("hide halos")
    Halo.hideHalos()
  }
  
  static onCopy(evt) {
    // lively.notify("on copy")

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
  
  
  static pasteHTMLDataInto(data, container) {
    // add everthing into a container 
    var div = document.createElement("div")
    div.classList.add("lively-content")
    lively.setExtent(div, pt(800,10))
    div.innerHTML = data
    container.appendChild(div)
    lively.setPosition(div, pt(0,0))

    // paste oriented at a shared topLeft
    var all = Array.from(div.querySelectorAll(":scope > *"))
    all.forEach(child => {
      persistence.initLivelyObject(child)
      
      var id = child.getAttribute("data-lively-id")
      child.remove()
      
      // if we have an ID, some other me might be lying around somewhere...
      if (id) {
        var otherMe = lively.elementByID(id)
        if (otherMe) {
          // so there is an identiy crysis... so we have to become somebody new...
          var newId = generateUUID()
          // ... and I have to notify my buddies that I am no longer myself
          all.forEach(other => {
            for(var i=0; i < other.attributes.length; i++) {
              var attr = other.attributes[i]
              if (attr.value == id) {
                // lively.notify("found a reference to me: " + other + "." + attr.name)
                attr.value = newId
              }
            }
          })
        }
      }
      div.appendChild(child)
     })
    var topLeft
    all.forEach(ea => {
      if (!topLeft) 
        topLeft = lively.getGlobalPosition(ea);
      else
        topLeft = topLeft.minPt(lively.getGlobalPosition(ea))
    })
    var offset = this.lastClickPos.subPt(topLeft)
    
    var result = div
    all.forEach(child => {
      if (child.classList.contains("lively-content") || child.tagName == "LIVELY-WINDOW") {
        container.appendChild(child)
        lively.moveBy(child, offset)
        result = child
      } else {
        // child.classList.add("lively-content")
      }
      // lively.showPath([
      //   lively.getGlobalPosition(child,),
      //   lively.getGlobalPosition(child).addPt(offset)
      // ])
    })
     // attach lively4script from the instance
   
    
    // clean up if neccesary
    if (div.childNodes.length == 0) {
      div.remove() // and get rid of the tmp container
    } else {
      // ajust position and content size
      lively.setGlobalPosition(div, this.lastClickPos)
      div.style.height = "max-content"
    }
    return result
  }
  
  static pasteTextDataInto(data, container) {
    var div = document.createElement("div")
    div.innerHTML = data
    div.classList.add("lively-content")
    container.appendChild(div)
    lively.setGlobalPosition(div, this.lastClickPos)
  }

  static onPaste(evt) {
    if (!this.lastClickPos) return; // we don't know where to paste it...this.lastClickPos
    // lively.notify("onPaste in " + this.lastTarget)
    
    if (!lively.hasGlobalFocus()) return
    
    evt.stopPropagation()
    evt.preventDefault(); 
    
    var data = evt.clipboardData.getData('text/html')
    if (data) {
      this.pasteHTMLDataInto(data, this.lastTarget) 
      return 
    }

    var data = evt.clipboardData.getData('text/plain')
    if (data) {
       this.pasteTextDataInto(data, this.lastTarget) 
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

  static highlight(element) {
    if (this._highlight) this._highlight.remove()
    this._highlight = lively.showElement(element)
    this._highlight.innerHTML = ""  + element.id
    this._highlight.style.border = "1px solid blue"
  }

  static onBodyMouseDown(evt) {
    var target = evt.path[0]
    if (target == document.body.parentElement) target = document.body
    // lively.notify('down ' + target)

    if(target && target.classList) {
      if (target.classList.contains("lively-no-paste")) {
        target = evt.path.find(ea => ea.tagName == "LIVELY-CONTAINER")
      } else {
        if (evt.path.find(ea => ea.constructor.name == "ShadowRoot")) { // #TODO is there a better test for the shadow root?
          // lively.notify("shadow")
          this.lastTarget = null
          this.lastClickPos = null
          return // we are in the shadows
        }
      }
      // this.highlight(target)
      lively.globalFocus()
      this.lastTarget = target
      this.lastClickPos = pt(evt.clientX,evt.clientY)
    }
  }
}

Clipboard.load()