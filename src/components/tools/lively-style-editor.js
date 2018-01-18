import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyStyleEditor extends Morph {
  async initialize() {
    this.windowTitle = "LivelyStyleEditor";   

    this.get("#target-button").addEventListener("target-changed", (evt) => {
      this.onUpdateTarget(evt.detail.target)
    })
    
    this.get('#fillChooser').addEventListener("value-changed", 
      e => this.onFillColor(e.detail.value));  
    this.get('#strokeColorChooser').addEventListener("value-changed", 
      e => this.onStrokeColor(e.detail.value));  
    this.get('#strokeWidthChooser').addEventListener("value-changed", 
      e => this.onStrokeWidth(e.detail.value));  
  }
  
  onUpdateTarget(target) {
    this.target = target
    lively.showElement(target)
  }
  
  onFillColor(color) {
    if (!this.target) return;
    if (this.target instanceof SVGElement) {
      this.target.setAttribute("fill", color)
      this.target
    } else {
      this.target.style.backgroundColor =  color      
    }
  }

  onStrokeColor(color) {
    if (!this.target) return;
    if (this.target instanceof SVGElement) {
      this.target.setAttribute("stroke", color)
      this.target
    } else {
      this.target.style.borderColor =  color      
    }
  }

  onStrokeWidth(size) {
    lively.notify("size " + size)
    if (!this.target) return;
    if (this.target instanceof SVGElement) {
      this.target.setAttribute("stroke-width", size)
      this.target
    } else {
      this.target.style.borderWidth =  size + "px"      
    }
  }

  
  
  
  
}