// #Clipboard - Cut,Copy, and Paste for Lively4

/* global that */

import {pt} from 'src/client/graphics.js';
import Halo from "src/components/halo/lively-halo.js";
import { uuid } from 'utils';
import persistence from "src/client/persistence.js"

import {default as HaloService} from "src/components/halo/lively-halo.js"

export default class Clipboard {
  
  static load() {
    lively.removeEventListener("Clipboard", document)
    lively.removeEventListener("Clipboard", document.body)
    
    lively.addEventListener("Clipboard", document, "mousedown", evt => this.onBodyMouseDown(evt), true)
    lively.addEventListener("Clipboard", document.body, "paste", evt => this.onPaste(evt), true)
    lively.addEventListener("Clipboard", document.body, "cut", evt => this.onCut(evt))
    lively.addEventListener("Clipboard", document.body, "copy", evt => this.onCopy(evt))
    
    document.body.setAttribute("tabindex", 0) // just ensure focusabiltity

    lively.clipboard = Clipboard; // #TODO make cyclic dependencies work
  }
  
  static onCut(evt) {
    if ((!HaloService.areHalosActive() || !that)) {
      return;
    }
    this.onCopy(evt)
    if (lively.selection.nodes.length > 0) {
      lively.selection.nodes.forEach(ea => {
        ea.remove()
      })
      lively.selection.remove()
       
    } else {
      that.remove()
    }
    Halo.hideHalos()
  }
  
  static nodesToHTML(nodes) {
    // prepare for serialization
    nodes.forEach(node => {
      node.querySelectorAll("*").forEach( ea => {
        if (ea.livelyPrepareSave) ea.livelyPrepareSave();
      });
    })
    
    return nodes.map(ea => ea.outerHTML).join("\n")
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
    var html = this.nodesToHTML(nodes)
    evt.clipboardData.setData('text/plain', html);
    evt.clipboardData.setData('text/html', html);
  }
  
  static initializeElements(all, searchInshadow = true) {
    const worldElements = [...lively.allElements(searchInshadow)];
    function worldElementByID(id) {
      return worldElements.find(ele => ele && ele.getAttribute && ele.getAttribute("data-lively-id") == id)
    }

    function makeLivelyIdNonConflicting(me, all) {
      const idAttribute = "data-lively-id";
      const id = me.getAttribute(idAttribute);
      if (!id) { return; }

      // if we have an ID, some other me might be lying around somewhere...
      const otherMe = worldElementByID(id);
      if (!otherMe) { return; }

      // so there is an identiy crisis... so we have to become somebody new...
      const newId = uuid();
      me.setAttribute(idAttribute, newId);

      // ... and I have to notify my buddies that I am no longer myself
      const pattern = new RegExp(id, 'ig');
      all.forEach(other => {
        for(let i = 0; i < other.attributes.length; i++) {
          const attr = other.attributes[i];
          attr.value = attr.value.replace(pattern, newId);
        }
      })
    }
    
    all.forEach(child => makeLivelyIdNonConflicting(child, all));
    all.forEach(child => persistence.initLivelyObject(child));
  }
  
  static getTopLeft(elements) {
    var topLeft
    elements.forEach(ea => {
      if (!topLeft) 
        topLeft = lively.getGlobalPosition(ea);
      else
        topLeft = topLeft.minPt(lively.getGlobalPosition(ea))
    })
    return topLeft || pt(0,0)
  }
  
  static pasteHTMLDataInto(data, container, flat, pos=this.lastClickPos) {
    // add everthing into a container 
    var div = document.createElement("div")
    div.classList.add("lively-content")
    lively.setExtent(div, pt(800,10))
    div.innerHTML = data
    container.appendChild(div)
    lively.setPosition(div, pt(0,0))
    
    // paste oriented at a shared topLeft
    var topLevel = Array.from(div.querySelectorAll(":scope > *"))
    var all = Array.from(div.querySelectorAll("*"))
    
    this.initializeElements(all)
    
    
    // somehow zIndex gets lost...
    var zIndexMap = new Map()
    topLevel.forEach(ea => {
       zIndexMap.set(ea, ea.style.zIndex)
    })
    
    
    // topLevel = _.sortBy(topLevel, ea => ea.style && ea.style.zIndex).reverse()
    // topLevel.forEach(ea => ea.remove())
    // topLevel.forEach(ea => ea.style.zIndex = "")
    topLevel.forEach(ea => div.appendChild(ea))
    var offset = (pos || pt(0,0)).subPt(this.getTopLeft(topLevel))
    var result = div
    
    // #TODO #CleanUp
    
    topLevel.forEach(child => {
      if (child.classList.contains("lively-content") || child.tagName == "LIVELY-WINDOW") {
        container.appendChild(child)
        lively.moveBy(child, offset)
        result = child; // return last result?
      }
    })
    
    // restore zIndex in an Async way... it seems focus is responsible for it #Hack
    lively.sleep(0).then(() => {
      topLevel.forEach(ea => {
        ea.style.zIndex = zIndexMap.get(ea)
      })
    })
    
    // clean up if neccesary
    
    if (div.childElementCount == 0) {
      div.remove() // and get rid of the tmp container
    } else {
      // ajust position and content size
      lively.setGlobalPosition(div, pos || pt(0,0))
      div.style.height = "max-content"
    }
    if (flat) {
      return topLevel
    }
    lively.components.loadUnresolved(result, true, "pasteHTMLDataInto", true)
    
    return result
  }
  
  static pasteTextDataInto(data, container) {
    var div = document.createElement("div")
    div.innerHTML = data
    div.classList.add("lively-content")
    container.appendChild(div)
    lively.components.loadUnresolved(div, true, "pasteHTMLDataInto", true)
    lively.setGlobalPosition(div, this.lastClickPos)
  }
  
  static async pasteBibtexDataInto(data, container) {
    var bibtex = await (<lively-bibtex class="lively-content"></lively-bibtex>)
    bibtex.setBibtex(data)
    container.appendChild(bibtex)
    lively.setGlobalPosition(bibtex, this.lastClickPos)
  }
  
   static pasteFileInto(fileItem, container) {
    var blob = fileItem.getAsFile();
    var reader = new FileReader();
    reader.onload = (event) => {
      var img = document.createElement("img")
      img.src = event.target.result
      img.classList.add("lively-content")
      container.appendChild(img)
      lively.setGlobalPosition(img, this.lastClickPos)
    }; // data url!
    reader.readAsDataURL(blob);
  }

  static onPaste(evt) {
    if (!this.lastClickPos) return; // we don't know where to paste it...this.lastClickPos
    // lively.notify("onPaste in " + this.lastTarget)
    
    if (!lively.hasGlobalFocus()) return
    
    evt.stopPropagation()
    evt.preventDefault(); 
    lively.notify("[clipboard] paste")
    
    var textData = evt.clipboardData.getData('text/plain')
    var htmlData = evt.clipboardData.getData('text/html')
    
    // guess it is bibtex? Maybe we should allow pattern matting like in drag and drop?
    if (textData.match(/@[A-Za-z]+{/)) {
      return this.pasteBibtexDataInto(textData, this.lastTarget)
    }
    
    if (htmlData) {
      this.pasteHTMLDataInto(htmlData, this.lastTarget) 
      return 
    }
 
    
    if (textData) {
       this.pasteTextDataInto(textData, this.lastTarget) 
      return 
    }
    
    var items = (event.clipboardData || evt.clipboardData).items;
    if (items.length> 0) {
      for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
          this.pasteFileInto(item, this.lastTarget) 
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
    var target = evt.composedPath()[0]
    if (target == document.body.parentElement) target = document.body
    
    if(target && target.classList) {
      if (target.classList.contains("lively-no-paste")) {
        target = evt.composedPath().find(ea => ea.tagName == "LIVELY-CONTAINER")
      } else {
        var container = evt.composedPath().find(ea => ea.tagName == "LIVELY-CONTAINER")
        if (container && !container.isEditing()) {
          target = container
          var activeElement = container.shadowRoot.activeElement
          if (activeElement && 
              (activeElement.tagName == "INPUT" || activeElement.contentEditable)) {         
          // the element itself will handle the paste
            this.lastTarget = null
            this.lastClickPos = null
            return 
          }
        } else {
            // this.lastTarget = container
          // } else {
          if (evt.composedPath().find(ea => ea.constructor.name == "ShadowRoot")) { // #TODO is there a better test for the shadow root?
            // lively.notify("shadow")
            this.lastTarget = null
            this.lastClickPos = null
            return // we are in the shadows
          }                    
        }
        
      }
      // this.highlight(target)
      lively.globalFocus()
      this.lastTarget = target
      if (this.lastTarget.livelyTarget) {
        this.lastTarget = this.lastTarget.livelyTarget()
        // lively.showElement(this.lastTarget)
      }
      this.lastClickPos = pt(evt.clientX,evt.clientY)
    }
  }
}


Clipboard.load()