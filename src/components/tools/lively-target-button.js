import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyTargetButton extends Morph {
  async initialize() {
    this.registerButtons()
  }
  
  async onChooseTarget() {
    await lively.sleep(0); // not in this turn...
    lively.addEventListener("TargetButton", document.body, "click", evt => this.onChooseTargetSelect(evt))
    lively.addEventListener("TargetButton", document.body, "mousemove", evt => this.onChooseTargetHighlight(evt))

  }

  removeHighlight() {
    if (this.highlight) this.highlight.remove()
  }
  
  onChooseTargetHighlight(evt) {
    this.removeHighlight()
    this.highlightTarget = evt.path[0]
    this.highlight = lively.showElement(this.highlightTarget)
    this.highlight.innerHTML = ""
    this.highlight.style.border = "2px dashed blue"
  }
  
  onChooseTargetSelect() {
    this.removeHighlight()
    lively.removeEventListener("TargetButton", document.body)
    this.target = this.highlightTarget
    // HaloService.showHalos(this.target)
    this.dispatchEvent(new CustomEvent("target-changed", {detail: {target: this.target}}))
  }
  
}