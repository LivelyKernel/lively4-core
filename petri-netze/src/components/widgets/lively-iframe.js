import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyIFrame extends Morph {
  
  async initialize() {
    this.windowTitle = "iFrame Browser"
    var input = this.get("#input");
    input.onchange = () => this.update();

    if (!this.getAttribute("src")) {
      this.setURL("//lively-kernel.org/")    
    } else {
       this.setURL(this.getAttribute("src"))    
    }
  }
  
  update() {
    var input = this.get("#input");
    this.get("#frame").src = input.value;
  }
  
  setURL(url){
    this.setAttribute("src", url)
    this.get("#input").value = url
    this.get("#frame").src = url;
  }
  
  hideMenubar() {
    this.get("#menubar").hidden = true
  }
  
  showMenubar() {
    this.get("#menubar").hidden = false
  }

}
