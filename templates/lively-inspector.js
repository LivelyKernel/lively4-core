
import Morph from './Morph.js';

export default class Inspector   extends Morph {
  

  displayValue(value) {
    var node = document.createElement("pre")
    node.innerHTML = JSON.stringify(value)
    return node
  }
  
  displayObject(object, depth, name) {
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

  displayNode(obj, indent) {
    var node = document.createElement("pre")
    node.innerHTML = obj.outerHTML.replace(/</g,"&lt;")
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
    this.appendChild(this.display(obj))
  }
}
console.log("loaded html.js")
