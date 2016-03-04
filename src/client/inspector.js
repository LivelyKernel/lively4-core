
'use strict';

export default class Inspector {

  static printObject(object, depth, name) {
    var printStr = ""
    if (_.isFunction(object)) {
      printStr = "<pre style='fontSize:7pt'>" + object + "</pre>"
    }

      var s =  '<li>' + (name ? name +": " : "") + printStr + ""
        +"\n"
    if (depth > 0) {
        s += '<ul>'
        _.keys(object).forEach( ea => s +=
          this.printObject(object[ea], depth - 1, ea))
       s += '</ul></li>\n'
    }
      return s
  }

  static printNode(node, indent) {
    if (node.nodeName == "#text")
      return "" + "<pre style='fontSize:7pt'>" + node.textContent + "</pre>"
    var s =  '<li>' + "" + node.localName + ": "
      + (node.src || "")
      +"\n"
    s += '<ul>'
    lively.array(node.childNodes).forEach( ea => s +=
      this.printNode(ea, indent + "  "))
    s += '</ul></li>\n'
    return s
  }

  static openInspector(obj) {
    return new Promise(resolve => {
      var comp = lively.components.createComponent("TreeView")
      comp.id = "Inspector"
      comp.style.overflow = "scroll"
      lively.components.openInWindow(comp).then(w => {
        var s =""
        if (obj instanceof HTMLElement) {
          s = this.printNode(obj)
        } else {
          s = this.printObject(obj, 2)
        }
        comp.innerHTML = s
        resolve(comp)})
    })
  }


}
console.log("loaded html.js")
