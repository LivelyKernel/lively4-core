"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyList extends Morph {
  async initialize() {
    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.addEventListener("click", evt => this.onClick(evt))
  }
  
  async livelyExample() {
    this.appendChild(<li>Eins</li>)
    this.appendChild(<li>Zwei</li>)
    this.appendChild(<li>Drei</li>)
    this.appendChild(<li>Vier</li>)
  }
  
  onItemClick(item, evt) {
    if (item.classList.contains("selected")) {
      this.deselectItem(item)
    } else {
      this.selectItem(item)
    }
  }

  deselectItem(item) {
    item.classList.remove("selected")
    if (this.selectedItem === item) {
      this.selectedItem = null
    }
  }
  
  itemValue(item) {
    return item.value || item.textContent
  }
  
  selectItem(item) {
    this.querySelectorAll("* > li").forEach(ea => this.deselectItem(ea)) 
    item.classList.add("selected")
    this.selectedItem = item
    this.selected = this.itemValue(item)
  }
  
  onClick(evt) {
    if (evt.target.localName == "li") {
      this.onItemClick(evt.target, evt)
    }
  }
}