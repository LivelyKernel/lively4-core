
'use strict';

export default class Inspector  {

  static printObject(object, depth, name) {
    try {
      return "<pre style='fontSize:7pt'>" + JSON.stringify(object) + "</pre>"
    } catch(e) {
      return "<pre style='fontSize:7pt'>" + object + "</pre>"
    }
  }

  static printNode(node, indent) {
    return "<pre style='fontSize:7pt'>" + node.outerHTML.replace(/</g,"&lt;") + "</pre>"
  }

  static openInspector(obj) {
    return new Promise(async (resolve) => {
      obj = (await obj).value; // lively.vm
      var comp = lively.components.createComponent("lively-inspector")
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
console.log("loaded inspector.js")
