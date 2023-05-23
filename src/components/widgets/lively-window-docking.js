import Morph from 'src/components/widgets/lively-morph.js';
export default class LivelyWindowDocking extends Morph {
  
  
  async initialize() {
    lively.removeEventListener("docking", document.body)
    lively.addEventListener("docking", document.body, "showDockingHelpers", (e) => {
      this.style.visibility = "visible";
    })
    lively.addEventListener("docking", document.body, "hideDockingHelpers", (e) => {
      this.style.visibility = "hidden";
    })
    lively.addEventListener("docking", document.body, "adjustDockingPreviewArea", (e) => {
      if (!e.detail || !e.detail.type) return; // or is throwing an error actually preferable?
      this.previewArea.style.visibility = (!(e.detail.type == "hide") ? "block" : "hidden"); 
      switch (e.detail.type) {
        case "top":
          this.setPreviewArea(lively.windowDockingCurrentBounds[0], lively.windowDockingCurrentBounds[1], lively.windowDockingCurrentBounds[2], lively.windowDockingCurrentBounds[3] / 2);
          break;
        case "left":
          this.setPreviewArea(lively.windowDockingCurrentBounds[0], lively.windowDockingCurrentBounds[1], lively.windowDockingCurrentBounds[2] / 2, lively.windowDockingCurrentBounds[3]);
          break;
        case "bottom":
          this.setPreviewArea(lively.windowDockingCurrentBounds[0], lively.windowDockingCurrentBounds[1] + (lively.windowDockingCurrentBounds[3] / 2), lively.windowDockingCurrentBounds[2], lively.windowDockingCurrentBounds[3] / 2);
          break;
        case "right":
          this.setPreviewArea(lively.windowDockingCurrentBounds[0] + (lively.windowDockingCurrentBounds[2] / 2), lively.windowDockingCurrentBounds[1], lively.windowDockingCurrentBounds[2] / 2, lively.windowDockingCurrentBounds[3]);
          break;
      }
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
  
  // @TODO move window docking helpers to new boundary without changing their size
  
}

// managing visibility with events


if (!lively.windowDocking) {
  lively.create("lively-window-docking").then(comp => {
    lively.windowDockingHelperSize = (window.clientWidth * 0.1, window.clientHeight * 0.1); // maybe also apply this to the helper elements directly
    lively.windowDockingCurrentBounds = [0,0,window.clientWidth, window.clientHeight];
    lively.windowDockingMaxHorizontalWindows = 2;
    lively.windowDockingMaxVerticalWindows = 2;
    
    lively.windowDocking = comp 
    document.body.appendChild(comp)
  })
}


