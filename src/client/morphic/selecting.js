
// import... HaloService from /templates/classes/Halo.js

export default class Selecting {

  static load() {
    // use capture to prevent the default behavior...
    lively.removeEventListener("selecting"); // in case of a reload
    // #UseCase #COP get rid of the explict "selecting" context/domain and replace it with the context of the module "Selecting.js"
    lively.addEventListener("selecting", document.body, 'mousedown', 
      (evt) => this.handleMouseDown(evt), true);
    lively.addEventListener("selecting", document.body, 'mouseup', 
      (evt) => this.handleMouseUp(evt), true);
    lively.addEventListener("selecting", document.body, 'click', 
      (evt) => this.handleSelect(evt), true);
  }

  static handleSelect(e) {
    
    if (e.ctrlKey || e.metaKey) {
      if (e.target.getAttribute("data-is-meta") === "true") {
          return;
      }
      // console.log("click" + e.path[0])
      this.onMagnify(e);
      e.stopPropagation();
      e.preventDefault();
    }
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
      // hide halos if the user clicks somewhere else
      if (window.that && !$(e.target).is("lively-halos")) {
        this.hideHalos();
      }
    }
  }

  static onMagnify(e) {
    var grabTarget = e.target;
    if (e.shiftKey)
        grabTarget = e.path[0];
    var that = window.that;
    // console.log("onMagnify " + grabTarget + " that: " + that);
    var parents = _.reject(e.path, 
        ea =>  ea instanceof ShadowRoot || ea instanceof HTMLContentElement || !(ea instanceof HTMLElement));
    if (that && this.areHalosActive()) {
      var index = parents.indexOf(that);
      grabTarget = parents[index + 1] || grabTarget;
    }
    // if there was no suitable parent, cycle back to the clicked element itself
    window.that = grabTarget;
    this.showHalos(grabTarget, parents || e.path);
  }



  static showHalos(el, path) {
    if (this.lastIndicator) $(this.lastIndicator).remove();
    this.lastIndicator = lively.showElement(el);
    var div = document.createElement("div")
    
    div.innerHTML = path.reverse().map(ea => (ea === el ? "<b>" : "") + (ea.tagName ? ea.tagName : "") + " " + (ea.id ? ea.id : "") 
      + " " + (ea.getAttribute && ea.getAttribute("class")) + (ea === el ? "</b>" : "")).join("<br>")
    this.lastIndicator.appendChild(div)
    
    div.style.fontSize = "8pt"
    div.style.color = "gray"
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
