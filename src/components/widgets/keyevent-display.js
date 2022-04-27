"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import {uuid} from 'utils'

export default class KeyeventDisplay extends Morph {
  async initialize() {
    lively.notify('init')
    this._keys = {}
    
    this.id = "KeyViz_" + uuid() 
  }
  
  attachedCallback() {
    lively.removeEventListener(this.id , document.body)


    lively.addEventListener(this.id, document.body, "keydown", evt => {
      this._keys[evt.key]= Date.now()
      this.updateView() // update only after a new key is pressed
    })

    lively.addEventListener(this.id, document.body, "keyup", async evt => {
      this._keys[evt.key] = false
      await lively.sleep(1000);
      this.updateView()
    })
  }
  
  detachedCallback() {
    lively.removeEventListener(this.id, document.body)
  }
  
  
  updateView() {
    var pane = this.get("#pane")
    pane.innerHTML = "";
    
    var keys = Object.keys(this._keys)
    keys
      .filter(ea => this._keys[ea])
      .sortBy(ea => this._keys[ea])
      .map(ea => ea.length == 1 ? ea.capitalize() : ea)
      .map(ea => <span class="key">{ea}</span>)
      .joinElements( ea => <span class="and">  - </span>)
      .forEach(ea => pane.appendChild(ea))
  }
  
  
}