"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Bindings from "src/client/bindings.js"
import {promisedEvent} from "src/client/utils.js"


/*MD # File Chooser

![](file-chooser.png){width=300px}

MD*/

export default class FileChooser extends Morph {
  async initialize() {
    this.registerAttributes(["root"]);
    aexpr(() =>  this.root).onChange(v => this.updateView());
    this.windowTitle = "FileChooser";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.updateView()
  }
  
  async updateView() {
    if (!this.root) return
    if (this.isUpdatingView) return;
    try {
      this.isUpdatingView = true 
      await this.get("#navbar").show(this.root)
      this.get("#navbar").hideDetails()      
    } finally {
      this.isUpdatingView = false
    }
  }
  
  getSelection() {
    return this.get("#navbar").getSelection()
  }
  
  onOk() {
    this.url = this.get("#navbar").url
    this.dispatchEvent(new CustomEvent("choose-file", {detail: this.url}))
    if (this.parentElement && this.parentElement.localName == "lively-window"){
      this.parentElement.remove()
    } 
  }

  async chooseFile(dir) {
    if(!dir.match(/\/$/) && await lively.files.isDirectory(dir)) {
      dir = dir + "/" // ensure directories end with slash
    }
    this.root = dir
    this.updateView()
    
    await promisedEvent(this, "choose-file")
    return this.url
  }

  async chooseFiles(dir) {
    await this.chooseFile(dir)
    return this.getSelection()
  }

  async livelyExample() {
    this.root = lively4url + "/README.md"
  }
  
  
}