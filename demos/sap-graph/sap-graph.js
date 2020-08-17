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
      var text = await fetch(url, {
        method: "GET",
        headers: {
          "content-type": "application/json"
        }
      }).then(r => r.text())
      return JSON.parse(text)
    } catch(e) {
      this.get("#content").innerHTML = "Error: " + e + " response: " + text
      return false
    } 
  }
  
  async render() {
    if (!this.src || this.src == "") return;
    this.get("#content").innerHTML = "loading " + this.src
    var json = await this.fetchJSON(this.src)  
    if (!json) return
    this.json = json
    if (json.value) {
      this.renderArray(json.value)
    } else {
      this.renderSingle(json)
    }
  }
  
  async renderSingle(json) {
    var table = await (<lively-table></lively-table>)
    var array = [["key", "value"]]
    for(var key of Object.keys(json)) {
      array.push([key, json[key]])
    }
    
    table.setFromArray(array)
    this.get("#content").innerHTML = ""
    this.get("#content").appendChild(table)
  }
  
   async renderArray(json) {
    var table = await (<lively-table></lively-table>)
    table.setFromJSO(json)
    this.get("#content").innerHTML = ""
    this.get("#content").appendChild(table)
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




