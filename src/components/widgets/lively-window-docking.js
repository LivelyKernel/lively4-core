import Morph from 'src/components/widgets/lively-morph.js';
import {pt,rect} from 'src/client/graphics.js';
export default class LivelyWindowDocking extends Morph {
  
  
  async initialize() {
    lively.notify("New doc");
        lively.windowDocking = this;
    
    lively.windowDockingHelperSize = (window.innerWidth * 0.1, window.innerHeight * 0.1); // maybe also apply this to the helper elements directly
    lively.windowDockingCurrentBounds = rect(0,0,window.innerWidth, window.innerHeight);
    lively.windowDockingMaxHorizontalWindows = 2;
    lively.windowDockingMaxVerticalWindows = 2;
    
    lively.removeEventListener("docking", document.body);
    lively.addEventListener("docking", document.body, "showDockingHelpers", (e) => {
      this.style.visibility = "visible";
    });
    lively.addEventListener("docking", document.body, "hideDockingHelpers", (e) => {
      this.style.visibility = "hidden";
    });
    lively.addEventListener("docking", document.body, "adjustDockingPreviewArea", (e) => {
       lively.notify("adjust docking");
      if (!e.detail || !e.detail.type) return; // or is throwing an error actually preferable?
      debugger;
     
      
      console.log(this.previewArea); // this logs, but I don't know why style does not get applied
    })
    
    // window hat auch nicht funktioniert
    // this.dispatchEvent(new CustomEvent("setPreviewArea", { top: "0%", left: "50%", width:"50%", height:"100%" }));

    // lively.addEventListener VS this.addEventListener?
    // => event würde im Window geworfen werden und hier gecatcht
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


