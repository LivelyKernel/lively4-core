"disable deepeval"

let debugEventCounter = 0




export default class Selecting {

  static shouldHandle(e) {
    return e.altKey && !lively.haloService.isDragging  && !lively.isDragging
  }
  
  static load() {
     if (!window.lively) {
      return setTimeout(() => {Selecting.load()}, 100) // defere
    }
    // use capture to prevent the default behavior...
    lively.removeEventListener("selecting"); // in case of a reload
    // #UseCase #COP get rid of the explict "selecting" context/domain and replace it with the context of the module "Selecting.js"
    lively.addEventListener("selecting", document.documentElement, 'pointerdown', 
      (evt) => this.handleMouseDown(evt), true);
    lively.addEventListener("selecting", document.documentElement, 'pointerup', 
      (evt) => this.handleMouseUp(evt), true);
    lively.addEventListener("selecting", document.documentElement, 'click', 
      (evt) => this.handleSelect(evt), true);
  }

  static handleMouseDown(evt) {
    // lively.showElement(e.composedPath()[0])
    // lively.lastDragTime = Date.now()
    if (this.shouldHandle(evt)) {
      // lively.showElement(e.composedPath()[0])

      // if (e.composedPath().find(ea => ea.tagName == "LIVELY-HALO")) {
      //   lively.notify("clicked on halo")
      //   this.hideHalos()
      //   e.stopPropagation();
      //   e.preventDefault();
      //   return
      // }
      
      // console.log("[selecting.js] mouse down " + e.target.tagName)
      // var div = lively.showEvent(evt)
      // div.style.backround = "red"
      // div.innerHTML = "STOP"
      
      // evt.stopPropagation();
      // evt.preventDefault();
    }
  }

  static handleMouseUp(evt) {
    
    // var rect = lively.showEvent(evt, {
    //   background: "rgba(0,100,0,0.7)",
    //   fontSize: "8pt",
    //   animate: true,
    //   text: debugEventCounter++ + " handleMouseUp " + this.shouldHandle(evt) + ": " + evt.altKey + " " 
    //         + !lively.haloService.isDragging  + " " + !lively.isDragging })
    
    
    if (this.shouldHandle(evt)) {
      // console.log("[selecting.js] mouse up " + e.target.tagName)
      
      // var div = lively.showEvent(evt)
      // div.style.backround = "red"
      // div.innerHTML = "STOP " + lively.isDragging
      
      // evt.stopPropagation();
      // evt.preventDefault();
      
    } else {
      // if (evt.composedPath()[0] == document.documentElement) {
      // lively.notify("path: " + e.composedPath())
      if (evt.composedPath().find(ea => ea.isHaloItem)) {
        lively.notify("we are doing someing")
      } else {
        // lively.notify("hide Halos! " + evt.composedPath().map(ea => ea.tagName))
        this.hideHalos()
      }
    }
  }
  
  static isIgnoredOnMagnify(element) {
    return !((element instanceof HTMLElement) || (element instanceof SVGElement))
      || element instanceof ShadowRoot 
      || element.getAttribute("data-is-meta") 
      || (element.isMetaNode && !element.isSelection)
      || (element.tagName == "I" && element.classList.contains("fa")) // font-awesome icons
      || (element.tagName == "A") // don't go into text, just structural 
      || element === window 
      || element === document 
      || element === document.body 
      || element === document.documentElement // <HTML> element
  }

  static slicePathIfContainerContent(path) {
    // Special treatment of content in lively-container
    var isContainer  = false;
    var containerIndex;
    var isContent = false;
    path.forEach((ea, index) => {
      if (ea.tagName == "LIVELY-CONTAINER") {
        isContainer = true
        containerIndex = index
      }
      if (ea.tagName == "LIVELY-FIGURE") {
        isContainer = true
        containerIndex = index
      }
      if (ea.id == "container-content") {
        isContent = true
      }
    })
    // lively.notify("container " + isContainer  + " content " + isContent)
    // e.composedPath().forEach(ea => lively.showElement(ea))
    if (isContainer && isContent) {
      // window.lastPath = e.composedPath()
      path = path.slice(0, containerIndex)
    }
    return path
  }
  
  // #important
  static handleSelect(e) {
    // lively.notify("path " + e.composedPath().map(ea => ea.tagName))
    if (lively.lastDragTime  && ((Date.now() - lively.lastDragTime) < 200)) return
    
    
    if (this.shouldHandle(e)) { 
      // lively.showElement(e.composedPath()[0],1300).textContent = "path: " + e.composedPath().map(ea => ea.tagName).join(",")
      var path = this.slicePathIfContainerContent(e.composedPath());

      // workaround weird toplevel event issues... the halo should not get the event
      // lively.notify("path " + e.composedPath().map(ea => ea.tagName))
      if (e.composedPath().find(ea => ea.tagName == "LIVELY-HALO")) {
        path = this.lastPath || e.composedPath()
      }      
      
      // some inception: deal with containers that should behave as if they are their own document
      // if we have found one, treat them as root
      var worldContexts = path
        .map(ea => lively.findWorldContext(ea))
        .filter(ea => ea)
        .filter(ea => ea.id == "container-root")
      if (worldContexts.length > 0) {
        var rootNode = this.findRootNode(worldContexts[0])
      } else {
        rootNode = this.findRootNode(document.body)
      }
      
      this.lastPath = path
      path = path
        // .reverse()
        .filter(ea => ! this.isIgnoredOnMagnify(ea))

      if (e.shiftKey) {
        // var idx = e.composedPath().indexOf(document.body);
        // path = ...
      } else {
        // by default: don't go into the shadows
        path = path.filter(ea => rootNode === this.findRootNode(ea))
      }
      var target = path[0]
      
      
        
  
      
      this.onMagnify(target, e, path);     
      e.stopPropagation();
      e.preventDefault();        
    } else {
      // lively.focusWithoutScroll(document.body)
    }
  }
  
  static findRootNode(node) {
    if (!node.parentNode) return node
    return this.findRootNode(node.parentNode)
  }

  static onMagnify(target, e, path) {
    if (!target) {
      this.hideHalos()
      return 
    }
    var grabTarget = target;
    var that = window.that;
    

    
    // console.log("onMagnify " + grabTarget + " that: " + that);
    var parents = _.reject(path, 
        ea =>  this.isIgnoredOnMagnify(ea))
    if (that && this.areHalosActive()) {
      var index = parents.indexOf(that);
      grabTarget = parents[index + 1] || grabTarget;
    }
    // if there was no suitable parent, cycle back to the clicked element itself
    window.that = grabTarget;
    this.showHalos(grabTarget, parents || path);
  }

  static showHalos(el, path) {
    path = path || []
    
    if (!lively.haloService) return;
    
    if (lively.haloService.lastIndicator) {
      lively.haloService.lastIndicator.style.border = "1px dashed blue"
      lively.haloService.lastIndicator.querySelector("pre").style.color = "blue"

    //   var div = document.createElement("div")
    //   div.innerHTML = path.reverse().map(ea => (ea === el ? "<b>" : "") + (ea.tagName ? ea.tagName : "") + " " + (ea.id ? ea.id : "") 
    //     + " " + (ea.getAttribute && ea.getAttribute("class")) + (ea === el ? "</b>" : "")).join("<br>")
    //   this.lastIndicator.appendChild(div)
      
    //   div.style.fontSize = "8pt"
    //   div.style.color = "gray"
    }
    
    lively.haloService.showHalos(el, path);
  }

  static hideHalos() {
    lively.haloService.hideHalos()
  }

  static areHalosActive() {
    return lively.haloService.areHalosActive()
  }
}

Selecting.load()
