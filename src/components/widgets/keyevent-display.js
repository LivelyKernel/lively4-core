"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class KeyeventDisplay extends Morph {
  async initialize() {
    this.keys = {}
    lively.removeEventListener("KeyViz", document.body )


    lively.addEventListener("KeyViz", document.body, "keydown", evt => {
      this.keys[evt.key]= Date.now()
      this.updateView() // update only after a new key is pressed
    })

    lively.addEventListener("KeyViz", document.body, "keyup", async evt => {
      this.keys[evt.key] = false
      await lively.sleep(1000);
      this.updateView()
    })
  }
  
  updateView() {
    var pane = this.get("#pane")
    pane.innerHTML = "";
    Object.keys(this.keys)
      .filter(ea => this.keys[ea])
      .sortBy(ea => this.keys[ea])
      .map(ea => ea.length == 1 ? ea.capitalize() : ea)
      .map(ea => <span class="key">{ea}</span>)
      .joinElements( ea => <span class="and">  - </span>)
      .forEach(ea => pane.appendChild(ea))
  }
  
  
}