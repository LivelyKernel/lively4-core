import HaloItem from './HaloItem.js';

export default class HalloEditItem extends HaloItem {

  onClick() {
    lively.notify("toggle edit")
    if (this.target.getAttribute("contenteditable") == "true") {
      this.target.setAttribute("contenteditable", null)
    } else {
      this.target.setAttribute("contenteditable", true)
    }
    
    this.updateTarget(this.target)
    
  }
  
  
  updateTarget(target) {
    this.target = target
    if (target.getAttribute("contenteditable") == "true") {
      this.get("#label").classList.remove("disabled")
    } else {
      this.get("#label").classList.add("disabled")
    }
  }
}