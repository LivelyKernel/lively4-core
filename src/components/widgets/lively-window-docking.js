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
    this.addEventListener("setPreviewArea", (e) => {
      console.log("Preview Area Event")
      this.setPreviewArea(e.top, e.left, e.width, e.height)
    })
    
    // window hat auch nicht funktioniert
    // this.dispatchEvent(new CustomEvent("setPreviewArea", { top: "0%", left: "50%", width:"50%", height:"100%" }));

    // lively.addEventListener VS this.addEventListener?
    // => event würde im Window geworfen werden und hier gecatcht
  }
  
  get previewArea() {
    return this.get('.helper-area')
  }
  
  setPreviewArea(top, left, width, height) {
    this.previewArea.style.top = top;
    this.previewArea.style.left = left;
    this.previewArea.style.width = width;
    this.previewArea.style.height = height;
  }
  
  
}

// managing visibility with events


if (!lively.windowDocking) {
  lively.create("lively-window-docking").then(comp => {
    lively.windowDocking = comp 
    document.body.appendChild(comp)
  })
}


