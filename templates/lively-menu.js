
import Morph from './Morph.js';

export default class LivelyMenu extends Morph {
    openOn(items, openEvt) {
      return new Promise((resolve, reject) => {
        
        var menu = $(this.shadowRoot).find(".container")[0];
        menu.innerHTML = "" // clear
        
        // create a radio button for each tool
        if (!items) {
          console.log("WARNING: no items to open")
          resolve()
          return;
        }
        items.forEach((ea) => {
          var item = document.createElement("li");
          item.innerHTML = ea[0] + (ea[2] ? " <label>" + ea[2].replace("CMD","Ctrl") +"</label>"  : "")

          $(item).on("click",function(evt) {
            if (ea[1] && ea[1] instanceof Function) {
              ea[1](openEvt)
            }
          });
          menu.appendChild(item);
          resolve(menu)
        });
      })
    }
    
}