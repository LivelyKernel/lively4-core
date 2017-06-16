import {pt} from 'src/client/graphics.js';

export default class Clipboard {
  
  
  static load() {
    lively.removeEventListener("Clipboard", document)
    lively.removeEventListener("Clipboard", document.body)
    lively.addEventListener("Clipboard", document, "click", evt => this.onBodyClick(evt))
    lively.addEventListener("Clipboard", document.body, "paste", evt => this.onPaste(evt))
    document.body.setAttribute("tabindex", 0) // just ensure focusabiltity
  }
  
  static onPaste(evt) {
    if (!this.lastClickPos) return; // we don't know where to paste it...this.lastClickPos
    var data = evt.clipboardData.getData('text/plain')
    if (data) {
      var div = document.createElement("div")
      div.innerHTML = data
      document.body.appendChild(div)
      lively.setGlobalPosition(div, this.lastClickPos)
      return 
    }
    
    var items = (event.clipboardData || evt.clipboardData).items;
    if (items.length> 0) {
      for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
          var blob = item.getAsFile();
          var reader = new FileReader();
          reader.onload = (event) => {
            var img = document.createElement("img")
            img.src = event.target.result
            img.classList.add("lively-content")
            document.body.appendChild(img)
            lively.setGlobalPosition(img, this.lastClickPos)
          }; // data url!
          reader.readAsDataURL(blob);
        }
      }
      return 
    }
  }

  static onBodyClick(evt) {
    if(document.body.parentElement ===  evt.path[0]) {
      document.body.focus()
      this.lastClickPos = pt(evt.clientX,evt.clientY)
      // lively.showPoint(this.lastClickPos)
    }
  }
}

Clipboard.load()