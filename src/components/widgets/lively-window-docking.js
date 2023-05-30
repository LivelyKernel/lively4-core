import Morph from 'src/components/widgets/lively-morph.js';
import {pt,rect} from 'src/client/graphics.js';
export default class LivelyWindowDocking extends Morph {
  
  
  async initialize() {
    lively.windowDocking = this;
    
    // dynamically set the helper size to squares that are small - maybe setting height / width in css is not needed then
    this.windowDockingHelperSize = Math.min(window.innerWidth, window.innerHeight);
    
    // keep track of different docking areas the helpers can act in
    // because the window can be resized, the screen is seen from 0,0 to 1,1
    this.availableDockingAreas = [rect(0,0,1,1)];
    
    lively.removeEventListener("docking", document.body);
    lively.addEventListener("docking", document.body, "showDockingHelpers", (e) => {
      this.style.visibility = "visible";
    });
    lively.addEventListener("docking", document.body, "hideDockingHelpers", (e) => {
      this.style.visibility = "hidden";
    });
  }
  
  get previewArea() {
    return this.get('#helper-preview')
  }
  
  setPreviewArea(top, left, width, height) {
    this.previewArea.style.top = top;
    this.previewArea.style.left = left;
    this.previewArea.style.width = width + "px";
    this.previewArea.style.height = height + "px";
    console.log(this.previewArea.style);
  }
  
  adjustDockingPreviewArea(type) {
    var bounds = lively.windowDockingCurrentBounds
    this.previewArea.style.visibility = (!(type == "hide") ? "visible" : "hidden"); 
      switch (type) {
        case "top":
          this.setPreviewArea(bounds[0], bounds[1], bounds[2], bounds[3] / 2);
          break;
        case "left":
          this.setPreviewArea(bounds[0], bounds[1], bounds[2] / 2, bounds[3]);
          break;
        case "bottom":
          this.setPreviewArea(bounds[0], bounds[1] + (bounds[3] / 2), bounds[2], bounds[3] / 2);
          break;
        case "right":
          this.setPreviewArea(bounds[0] + (bounds[2] / 2), bounds[1], bounds[2] / 2, bounds[3]);
          break;
      }
  }
  
  // @TODO move window docking helpers to new boundary without changing their size
  
  checkDraggedWindow(draggedWindow, evt) {
    const cursorX = evt.clientX;
    const cursorY = evt.clientY;
    
    // @TODO set this.draggingDockingHelper value or comparable to not spam events

    var allDockingHelperAreas = [];
    // takes all the docking helpers on the sides and fills allDockingHelperAreas with the bounding client rect (and the id to know which helper it was)
    var helpers = this.shadowRoot.querySelectorAll('.helper-fixed');
    for (let node of helpers) {
      allDockingHelperAreas.push({"rect": node.getBoundingClientRect(), "id": node.id});
    }
    
    // should return max 1, so is forEach the correct thing?
    allDockingHelperAreas.filter((area) => (cursorX > area.rect.left && cursorX < area.rect.right && cursorY > area.rect.top && cursorY < area.rect.bottom)).forEach((area) => {
      var type = "hide";
      switch (area.id) {
        case "helper-top":
          type = "top";
          break;
        case "helper-left":
          type = "left";
          break;
        case "helper-right":
          type = "right";
          break;
        case "helper-bottom":
          type = "bottom";
          break;
      }
      this.adjustDockingPreviewArea(type);
    });
}
  
}



// managing visibility with events


if (!lively.windowDocking) {
  lively.create("lively-window-docking").then(comp => {
    

    document.body.appendChild(comp)
  })
}


