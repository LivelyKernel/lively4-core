/*MD 
# Canvas wrapped as Component 

 #TODO Demo does not work any more

Keywords: #Deprecated


MD*/

import Morph from 'src/components/widgets/lively-morph.js';

export default class ExampleCanvas extends Morph {
  initialize() {
    this.windowTitle = "ExampleCanvas";
    this.canvas = this.get("#canvas");
    
    this._oldWidth = 0;
    this._oldHeight = 0;
    
    const autoResizeCanvas = () => {
      this.adaptCanvasSize();
      setTimeout(autoResizeCanvas, 1000);
    }
    autoResizeCanvas();
  }
  
  adaptCanvasSize() {
    var bounds = this.getBoundingClientRect()
    if(bounds.width === this._oldWidth && bounds.height === this._oldHeight) {
      return;
    }

    if (this.canvas.width == 0 || this.canvas.height == 0) return;
    
    const imageData = this.canvas.getContext("2d").getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    this.canvas.style.width = bounds.width + "px";
    this.canvas.setAttribute("width", bounds.width + "px");
    this.canvas.style.height = bounds.height + "px";
    this.canvas.setAttribute("height", bounds.height + "px");
    
    this.canvas.getContext("2d").putImageData(imageData, 0, 0);
    
    this._oldWidth = bounds.width;
    this._oldHeight = bounds.height;
  }
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */