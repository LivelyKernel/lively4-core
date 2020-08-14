import Morph from 'src/components/widgets/lively-morph.js';
import Strings from 'src/client/strings.js'
import _ from 'src/external/lodash/lodash.js'
import {getDeepProperty} from "utils"
import {pt} from "src/client/graphics.js"
import html from 'src/client/html.js'


export default class SAPGraph extends Morph {

  async initialize() {
    html.registerAttributeObservers(this);
    this.render()
  }
  
  get src() {
    return this.getAttribute("src")
  }
  set src(value) {
    return this.setAttribute("src", value)
  }

  onSrcChanged() {
    this.render()
  }

  async fetchJSON(url) {
    try {
      return fetch(url, {
        method: "GET",
        headers: {
          "content-type": "application/json"
        }
      }).then(r => r.json())
    } catch(e) {
      this.get("#content").innerHTML = "Error: " + e
      return false
    }
  }
  
  async render() {
    if (!this.src || this.src == "") return;
    var json = await this.fetchJSON(this.src)  
    if (!json) return
    this.json = json
    this.get("#content").innerHTML = "<pre>" + JSON.stringify(json, undefined, 2) + "</pre>"
  }
  
  livelyInspect(contentNode, inspector) {
     if (this.json) {
      contentNode.appendChild(inspector.display(this.json, false, "#json", this));
    }
  }
  
  async livelyExample() {
    this.setAttribute("src", "sap://Customers/1000500")
  }
}




