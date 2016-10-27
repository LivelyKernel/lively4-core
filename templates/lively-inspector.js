
import Morph from './Morph.js';

export default class Inspector   extends Morph {

  displayValue(value) {
    var node = document.createElement("pre")
    node.innerHTML = JSON.stringify(value)
    return node
  }
  
  displayObject(object) {
    var node = document.createElement("ul")
    var createChild = (ea) => {
      var child = document.createElement("span")
      child.innerHTML = "" + object[ea] + "..."
      child.onclick = evt => {
        child.innerHTML = ""
        child.appendChild(this.display(object[ea]))
        evt.stopPropagation()
      }
      return child
    } 
  
    Object.keys(object).forEach( ea => {
      var eaNode = document.createElement("li")
      eaNode.innerHTML = "" + ea  + ": "
      eaNode.onclick = evt => {
        eaNode.innerHTML = "" + ea  + ": "
        eaNode.appendChild(createChild(ea))
        evt.stopPropagation()
      }
      eaNode.appendChild(createChild(ea))
      node.appendChild(eaNode)
    })
    return node
  }

  displayNode(obj) {
    var node = document.createElement("div")
    var render = () => {
      if (!obj.tagName) {
        node.innertHTML = "DEBUG " + obj
        return node
      }
      node.innerHTML = "&lt;<a id='tagname'>" + obj.tagName.toLowerCase() + "</a>&gt;" +
        "<span id='content'><a id='more'>...</a></span>" +
        "&lt;" + obj.tagName.toLowerCase() + "&gt;"
      
      var contentNode = node.querySelector("#content")
      node.querySelector("#more").onclick = (evt) => {
        contentNode.innerHTML = "y"
        if (obj.shadowRoot) {
          contentNode.innerHTML = "<br>_shadow rootY_"
          contentNode.appendChild(this.displayNode(obj.shadowRoot))  
        }  
        obj.childNodes.forEach( ea => { 
          contentNode.appendChild(this.displayNode(ea))
      })
        
      }
      node.querySelector("#tagname").onclick = (evt) => {
        render()
      }
    }
    render()
    
    return node
  }
  
  display(obj) {
    if (obj instanceof HTMLElement) {
     return this.displayNode(obj)
     // return this.displayObject(obj)
    } else if (obj instanceof Object){
      return this.displayObject(obj)
    } else {
      return this.displayValue(obj)
    }
  }

  inspect(obj) {
    this.targetObject = obj;
    this.get("#editor").doitContext = obj;
    this.innerHTML = ""
    this.get("#container").appendChild(this.display(obj))
  }
  
  livelyMigrate(oldInstance) {
    this.inspect(oldInstance.targetObject)    
  } 
  
  
}
console.log("loaded html.js")
