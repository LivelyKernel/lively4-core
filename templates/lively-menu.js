import Morph from './Morph.js';
import {pt} from 'src/client/graphics.js';
import html from  'src/client/html.js'

export default class LivelyMenu extends Morph {

  initialize() {
  	this.setAttribute("tabindex", 0) // we want keuboard events
  	html.registerKeys(this, "Menu", this, true)
  }
  
  onUpDown(evt) {
    this.sellectUpOrDown(evt, -1)
  }

  onDownDown(evt) {
    this.sellectUpOrDown(evt, 1)
  }
  
  onEscDown(evt) {
   this.remove() 
  }
  
  sellectUpOrDown(evt, offset) {
    var menu = this.get(".container")
    if (!this.currentItem) {
      this.selectItem(menu.childNodes[0])
    } else {
      var items = lively.array(menu.querySelectorAll("li"))
      var nextIdx = items.indexOf(this.currentItem)
      this.selectItem(items[nextIdx + offset])
    }
  }

  onLeftDown(evt) {
    if (this.parentMenu) {
      this.parentMenu.focus()
      this.parentMenu.sellectUpOrDown(evt, 0)
    }
  }

  
  onRightDown(evt) {
    if (!this.currentItem) return
  
    var entry = this.currentItem.entry
    if (entry[1] instanceof Array) {
      this.submenu.focus()
      this.submenu.sellectUpOrDown(evt, 0)
    }
  }

  onEnterDown(evt) {
    if (!this.currentItem) return

    var entry = this.currentItem.entry
    if (entry[1] instanceof Function) {
      entry[1](evt);
    }
  }

  openOn(items, openEvt) {
    var menu = this.get(".container");
    menu.innerHTML = "" // clear
    // create a radio button for each tool
    if (!items) {
      console.log("WARNING: no items to open")
      return Promise.resolve()
      return;
    }
    items.forEach((ea) => {
      var item = document.createElement("li");
      item.entry = ea
      var icon = "<div class='icon'>"+ (ea[3] ? ea[3] : "")+"</div>"
      var right = " <label>" 
        + (ea[2] ?  ea[2].replace("CMD","Ctrl")  : "")
        + "<span class='submenuindicator'> "+ (ea[1] instanceof Array ? "▶" : " ")+" </span>"
        + "</label>"

      
      item.innerHTML = icon + ea[0] + right 
      if (ea[1] instanceof Function) {
        var func = ea[1];
        item.addEventListener("click", func);
      }

      item.addEventListener("mouseenter", async (evt) => {
        this.selectItem(item)
      })
      menu.appendChild(item);
    });
    return Promise.resolve(menu)
  }
  
  async selectItem(item) {
    if (this.currentItem)
      this.currentItem.classList.remove("current")
    if (!item) return
    
    item.classList.add("current")
    this.currentItem = item
    
    var ea = item.entry
    var menu = this.get(".container");
    if (this.submenu) this.submenu.remove()
    if (ea[1] instanceof Array) {
      var subitems = ea[1];
      this.submenu = document.createElement("lively-menu")
      this.submenu.parentMenu = this
      await lively.components.openIn(menu, this.submenu)
      var bounds = item.getBoundingClientRect()
      var menuBounds = menu.getBoundingClientRect()
      this.submenu.openOn(subitems)
      lively.setPosition(this.submenu, 
        pt(bounds.right, bounds.top).subPt(pt(menuBounds.left, menuBounds.top)))
    }
  }
  
  
}