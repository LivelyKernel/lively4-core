import Morph from './Morph.js';
import {pt} from 'src/client/graphics.js';

export default class LivelyMenu extends Morph {
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
          if (menu.submenu) menu.submenu.remove()
          if (ea[1] instanceof Array) {
            var subitems = ea[1];
            menu.submenu = document.createElement("lively-menu")
            await lively.components.openIn(menu, menu.submenu)
            var bounds = item.getBoundingClientRect()
            var menuBounds = menu.getBoundingClientRect()
            menu.submenu.openOn(subitems)
            lively.setPosition(menu.submenu, 
              pt(bounds.right, bounds.top).subPt(pt(menuBounds.left, menuBounds.top)))
          }
        })

        menu.appendChild(item);
      });
      return Promise.resolve(menu)
    }
}