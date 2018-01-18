import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyStyleEditor extends Morph {
  async initialize() {
    this.windowTitle = "LivelyStyleEditor";   

    this.get("#target-button").addEventListener("target-changed", (evt) => {
      this.onUpdateTarget(evt.detail.target)
    })
  }
  
  onUpdateTarget(target) {
    this.target = target
    lively.showElement(target)
  }
  
}