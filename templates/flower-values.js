import Morph from "./Morph.js"


export default class FlowerValues extends Morph {
  initialize() {
    lively.addEventListener("Flower", this, "dblclick", 
      evt => this.onDoubleClick(evt))
  }

  onDoubleClick() {
    lively.openInspector(this.content)
  }

  get content() {
    
    return this._content
  }
  
  set content(v) {
    try {
      var s = JSON.stringify(v)
    } catch(e) {
      s = "" + v
    }
    this.textContent = s
    this._content = v
  }
}