import HaloItem from 'src/components/halo/lively-halo-item.js';

export default class HalloNameItem extends HaloItem {
  
  initialize() {
    lively.html.registerKeys(this.get("#name"), "Halo", this)
  }
  
  onEnterDown(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    this.target.id = this.get("#name").textContent 
    lively.focusWithoutScroll(document.body)
  }
  
  onLeftDown(evt) {
    evt.stopPropagation(); // don't move halo, but text cursor
  }
  
  onRightDown(evt) {
    evt.stopPropagation(); // don't move halo, but text cursor
  }


  updateTarget(target) {
    this.target = target
    if (target.id) {
      this.get("#name").textContent = target.id
    } else {
      this.get("#name").textContent = ""
    }

      this.get("#classname").textContent = this.target.tagName.toLowerCase()

  }
}