/* # Target Selector button
 - click on button and then on target
 - previews possible targets on mouse over target
 - fires "target-changeed" event when "this.target" changes 
 - shows current target on mouse over button itself
*/

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyTargetButton extends Morph {
  async initialize() {
    this.registerButtons()
    this.addEventListener("mouseenter", evt => this.onMouseEnter(evt))
    this.addEventListener("mouseleave", evt => this.onMouseLeave(evt))

  }
  
  async onMouseEnter() {
    this.removeHighlight()
    this.showHighlight(this.target)    
  }

  async onMouseLeave() {
    this.removeHighlight()
  }
  
  async onChooseTarget() {
    await lively.sleep(0); // not in this turn...
    lively.addEventListener("TargetButton", document.body, "click", evt => this.onChooseTargetSelect(evt))
    lively.addEventListener("TargetButton", document.body, "mousemove", evt => this.onChooseTargetHighlight(evt))

  }

  removeHighlight() {
    if (this.highlight) this.highlight.remove()
  }
  
  showHighlight(target) {
    if (!target) return;
    this.removeHighlight()
    this.highlight = lively.showElement(this.highlightTarget)
    // this.highlight.innerHTML = ""
    this.highlight.style.border = "2px dashed blue"    
    this.highlight.querySelector("pre").style.color = "blue"
  }

  onChooseTargetHighlight(evt) {
    this.highlightTarget = evt.composedPath()[0]
    this.showHighlight(this.highlightTarget)
  }
  
  onChooseTargetSelect() {
    this.removeHighlight()
    lively.removeEventListener("TargetButton", document.body)
    this.target = this.highlightTarget
    this.dispatchEvent(new CustomEvent("target-changed", {detail: {target: this.target}}))
  }
  
}