
// import... HaloService from /templates/classes/Halo.js

export default class Selecting {

  static load() {
     if (!window.lively) {
      return setTimeout(() => {Selecting.load()}, 100) // defere
    }
    // use capture to prevent the default behavior...
    lively.removeEventListener("selecting"); // in case of a reload
    // #UseCase #COP get rid of the explict "selecting" context/domain and replace it with the context of the module "Selecting.js"
    lively.addEventListener("selecting", document.body.parentElement, 'mousedown', 
      (evt) => this.handleMouseDown(evt), true);
    lively.addEventListener("selecting", document.body.parentElement, 'mouseup', 
      (evt) => this.handleMouseUp(evt), true);
    lively.addEventListener("selecting", document.body.parentElement, 'click', 
      (evt) => this.handleSelect(evt), true);
  }


  static handleMouseDown(e) {
    // lively.showElement(e.path[0])
    if (e.ctrlKey || e.metaKey) {
      // console.log("mouse down " + e.target.tagName)
      e.stopPropagation();
      e.preventDefault();
    }
  }

  static handleMouseUp(e) {
    if (e.ctrlKey || e.metaKey) {
      // console.log("mouse up " + e.target.tagName)
      e.stopPropagation();
      e.preventDefault();
    } else {
       this.hideHalos()
    }
  }
  
  static isIgnoredOnMagnify(element) {
    
    return !(element instanceof HTMLElement) 
      || element instanceof ShadowRoot 
      || element instanceof HTMLContentElement 
      || element.getAttribute("data-is-meta") 
      || element.isMetaNode
      || (element.tagName == "I" && element.classList.contains("fa")) // font-awesome icons
      || (element.tagName == "A") // don't go into text, just structural 
      || element === window 
      || element === document 
      || element === document.body 
      || element === document.body.parentElement // <HTML> element
  }

  static handleSelect(e) {
    if (e.ctrlKey || e.metaKey) {


      var rootNode = this.findRootNode(document.body)

      var path = e.path.reverse()
        .filter(ea => ! this.isIgnoredOnMagnify(ea))
      
      if (e.shiftKey) {
        var idx = e.path.indexOf(document.body);
        path= path.reverse();
      } else {
        // by default: don't go into the shadows
        path = path.filter(ea => rootNode === this.findRootNode(ea))
      }
      this.onMagnify(path[0], e, path);
      e.stopPropagation();
      e.preventDefault();
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
    
    if (HaloService.lastIndicator) HaloService.lastIndicator.remove();
    HaloService.lastIndicator = lively.showElement(el);
  
    
    if (HaloService.lastIndicator) {
      HaloService.lastIndicator.style.border = "1px dashed blue"
      HaloService.lastIndicator.querySelector("pre").style.color = "blue"

    //   var div = document.createElement("div")
    //   div.innerHTML = path.reverse().map(ea => (ea === el ? "<b>" : "") + (ea.tagName ? ea.tagName : "") + " " + (ea.id ? ea.id : "") 
    //     + " " + (ea.getAttribute && ea.getAttribute("class")) + (ea === el ? "</b>" : "")).join("<br>")
    //   this.lastIndicator.appendChild(div)
      
    //   div.style.fontSize = "8pt"
    //   div.style.color = "gray"
    }
    
    HaloService.showHalos(el, path);
  }

  static hideHalos() {
    HaloService.hideHalos();
  }

  static areHalosActive() {
    return HaloService.areHalosActive();
  }
}

Selecting.load()
